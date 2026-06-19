import { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const fetchContacts = async () => {
    setLoading(true);
    setError('');
    try {
      const url = filter === 'all' ? `${API}/contacts` : `${API}/contacts?status=${filter}`;
      const response = await axios.get(url);
      setContacts(response.data);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Eroare la încărcarea contactelor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const updateContactStatus = async (contactId, newStatus) => {
    try {
      await axios.patch(`${API}/contacts/${contactId}/status`, null, {
        params: { status: newStatus }
      });
      fetchContacts(); // Refresh list
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Eroare la actualizarea statusului');
    }
  };

  const deleteContact = async (contactId) => {
    if (!window.confirm('Sigur doriți să ștergeți acest contact?')) return;
    
    try {
      await axios.delete(`${API}/contacts/${contactId}`);
      fetchContacts(); // Refresh list
    } catch (err) {
      console.error('Error deleting contact:', err);
      alert('Eroare la ștergerea contactului');
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'new':
        return 'badge badge-new';
      case 'read':
        return 'badge badge-read';
      case 'archived':
        return 'badge badge-archived';
      default:
        return 'badge';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'new':
        return 'Nou';
      case 'read':
        return 'Citit';
      case 'archived':
        return 'Arhivat';
      default:
        return status;
    }
  };

  return (
    <div className="admin-container min-h-screen py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold" style={{ color: '#D4AF37' }}>
            📊 Admin Dashboard - KEYDEV
          </h1>
          <a
            href="/"
            className="btn-gold"
          >
            ← Înapoi la site
          </a>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Toate ({contacts.length})
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'new'
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Noi
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'read'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Citite
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'archived'
                ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Arhivate
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <span className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
          <p className="mt-4 text-gray-400">Se încarcă contactele...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && contacts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-400 text-lg">
            {filter === 'all' 
              ? 'Nu există contacte încă' 
              : `Nu există contacte cu statusul "${getStatusLabel(filter)}"`
            }
          </p>
        </div>
      )}

      {/* Contacts List */}
      {!loading && contacts.length > 0 && (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div key={contact.id} className="contact-card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-semibold mb-1" style={{ color: '#D4AF37' }}>
                    {contact.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {contact.email}
                  </p>
                </div>
                <span className={getStatusBadgeClass(contact.status)}>
                  {getStatusLabel(contact.status)}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-gray-300 leading-relaxed">
                  {contact.message}
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                <p className="text-gray-500 text-sm">
                  📅 {formatDate(contact.timestamp)}
                </p>
                
                <div className="flex gap-2">
                  {contact.status !== 'read' && (
                    <button
                      onClick={() => updateContactStatus(contact.id, 'read')}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      title="Marchează ca citit"
                    >
                      ✓ Citit
                    </button>
                  )}
                  {contact.status !== 'archived' && (
                    <button
                      onClick={() => updateContactStatus(contact.id, 'archived')}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                      title="Arhivează"
                    >
                      📦 Arhivează
                    </button>
                  )}
                  {contact.status === 'archived' && (
                    <button
                      onClick={() => updateContactStatus(contact.id, 'new')}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      title="Restaurează"
                    >
                      ↺ Restaurează
                    </button>
                  )}
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                    title="Șterge"
                  >
                    🗑️ Șterge
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
