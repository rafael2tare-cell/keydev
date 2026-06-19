from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import asyncio
import resend
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')



# MongoDB connection
mongo_url = os.getenv('MONGO_URL', 'mongodb+srv://nujcesunt_db_user:PrQZSFVqM0Q1i7vn@keydev.lvu52sh.mongodb.net')
client = AsyncIOMotorClient(mongo_url)
db_name = os.getenv('DB_NAME', 'keydev')

# Resend configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
NOTIFICATION_EMAIL = os.environ.get('NOTIFICATION_EMAIL', 'nujcesunt@gmail.com')

# Create the main app without a prefix
app = FastAPI()

app.mount("/static", StaticFiles(directory="backend/static"), name="static")

@app.get("/")
async def read_index():
    return FileResponse("backend/static/index.html")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


# Contact Models
class ContactSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    message: str = Field(..., min_length=10, max_length=2000)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = Field(default="new")  # new, read, archived

class ContactSubmissionCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    message: str = Field(..., min_length=10, max_length=2000)


# Helper function to send email notification
async def send_contact_notification(contact: ContactSubmission):
    """Send email notification when contact form is submitted"""
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not configured, skipping email notification")
        return
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .header h1 {{ color: #000; margin: 0; font-size: 28px; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .field {{ margin-bottom: 20px; }}
            .field-label {{ font-weight: bold; color: #D4AF37; font-size: 14px; text-transform: uppercase; }}
            .field-value {{ margin-top: 5px; padding: 10px; background: white; border-left: 3px solid #D4AF37; }}
            .footer {{ text-align: center; margin-top: 20px; color: #999; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📬 Mesaj Nou de Contact - KEYDEV</h1>
            </div>
            <div class="content">
                <div class="field">
                    <div class="field-label">Nume:</div>
                    <div class="field-value">{contact.name}</div>
                </div>
                <div class="field">
                    <div class="field-label">Email:</div>
                    <div class="field-value">{contact.email}</div>
                </div>
                <div class="field">
                    <div class="field-label">Mesaj:</div>
                    <div class="field-value">{contact.message}</div>
                </div>
                <div class="field">
                    <div class="field-label">Data și Ora:</div>
                    <div class="field-value">{contact.timestamp.strftime('%d.%m.%Y %H:%M:%S')}</div>
                </div>
            </div>
            <div class="footer">
                <p>Acesta este un mesaj automat de la formularul de contact KEYDEV</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    params = {
        "from": SENDER_EMAIL,
        "to": [NOTIFICATION_EMAIL],
        "subject": f"🔔 Contact Nou: {contact.name}",
        "html": html_content
    }
    
    try:
        # Run sync SDK in thread to keep FastAPI non-blocking
        email_result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email notification sent successfully: {email_result.get('id')}")
        return email_result
    except Exception as e:
        logger.error(f"Failed to send email notification: {str(e)}")
        # Don't raise exception - we don't want to fail the contact submission if email fails


# Status Check Routes (existing)
@api_router.get("/")
async def root():
    return {"message": "KEYDEV API - Backend functional"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# Contact Routes
@api_router.post("/contact", response_model=ContactSubmission)
async def submit_contact_form(input: ContactSubmissionCreate):
    """Submit a contact form and send email notification"""
    try:
        # Create contact submission object
        contact_dict = input.model_dump()
        contact_obj = ContactSubmission(**contact_dict)
        
        # Convert to dict and serialize datetime to ISO string for MongoDB
        doc = contact_obj.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        
        # Save to database
        await db.contacts.insert_one(doc)
        
        # Send email notification (non-blocking, won't fail the request if email fails)
        asyncio.create_task(send_contact_notification(contact_obj))
        
        logger.info(f"Contact form submitted: {contact_obj.name} ({contact_obj.email})")
        
        return contact_obj
    except Exception as e:
        logger.error(f"Error submitting contact form: {str(e)}")
        raise HTTPException(status_code=500, detail="Eroare la trimiterea formularului. Vă rugăm încercați din nou.")


@api_router.get("/contacts", response_model=List[ContactSubmission])
async def get_all_contacts(status: Optional[str] = None):
    """Get all contact submissions (for admin dashboard)"""
    try:
        # Build query filter
        query = {}
        if status:
            query['status'] = status
        
        # Exclude MongoDB's _id field from the query results
        contacts = await db.contacts.find(query, {"_id": 0}).sort("timestamp", -1).to_list(1000)
        
        # Convert ISO string timestamps back to datetime objects
        for contact in contacts:
            if isinstance(contact['timestamp'], str):
                contact['timestamp'] = datetime.fromisoformat(contact['timestamp'])
        
        return contacts
    except Exception as e:
        logger.error(f"Error fetching contacts: {str(e)}")
        raise HTTPException(status_code=500, detail="Eroare la încărcarea contactelor")


@api_router.patch("/contacts/{contact_id}/status")
async def update_contact_status(contact_id: str, status: str):
    """Update contact status (for admin dashboard)"""
    try:
        if status not in ["new", "read", "archived"]:
            raise HTTPException(status_code=400, detail="Status invalid. Folosiți: new, read, sau archived")
        
        result = await db.contacts.update_one(
            {"id": contact_id},
            {"$set": {"status": status}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Contactul nu a fost găsit")
        
        return {"message": "Status actualizat cu succes", "contact_id": contact_id, "status": status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contact status: {str(e)}")
        raise HTTPException(status_code=500, detail="Eroare la actualizarea statusului")


@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    """Delete a contact submission (for admin dashboard)"""
    try:
        result = await db.contacts.delete_one({"id": contact_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Contactul nu a fost găsit")
        
        return {"message": "Contact șters cu succes", "contact_id": contact_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting contact: {str(e)}")
        raise HTTPException(status_code=500, detail="Eroare la ștergerea contactului")


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
