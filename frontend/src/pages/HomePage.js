import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const cursorLightRef = useRef(null);

  // Cursor light effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cursorLightRef.current) {
        cursorLightRef.current.style.left = e.clientX + 'px';
        cursorLightRef.current.style.top = e.clientY + 'px';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Intersection Observer for reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Generate particles
  const generateParticles = (count = 20) => {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const left = Math.random() * 100;
      const bottom = Math.random() * 100;
      const delay = Math.random() * 6;
      particles.push(
        <div
          key={i}
          className="particle"
          style={{
            left: `${left}%`,
            bottom: `${bottom}%`,
            animationDelay: `${delay}s`,
          }}
        />
      );
    }
    return particles;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.name.length < 2) {
      setSubmitError('Numele trebuie să aibă cel puțin 2 caractere');
      return;
    }
    if (formData.message.length < 10) {
      setSubmitError('Mesajul trebuie să aibă cel puțin 10 caractere');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await axios.post(`${API}/contact`, formData);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(
        error.response?.data?.detail || 'Eroare la trimiterea formularului. Vă rugăm încercați din nou.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Cursor light */}
      <div className="cursor-light" ref={cursorLightRef} />

      <div className="app-wrapper">
        {/* HERO SECTION */}
        <section className="section" id="sec0">
          <div className="particles-container">{generateParticles(25)}</div>
          <div className="text-center relative z-10">
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-extrabold gold-glow mb-6"
              style={{ color: '#D4AF37' }}
            >
              {['K', 'E', 'Y', 'D', 'E', 'V'].map((char, i) => (
                <span key={i} className="hero-title-char show">
                  {char}
                </span>
              ))}
            </h1>
            <p
              className="text-base md:text-xl text-gray-300 max-w-xl mx-auto mb-10"
              style={{ transition: 'opacity 1s 2s', opacity: 1 }}
            >
              Construim site-uri optimizate SEO care ajută afacerile să crească
            </p>
            <a
              href="#sec1"
              className="btn-gold inline-block"
              style={{ transition: 'opacity 1s 2.3s', opacity: 1 }}
            >
              Explorează
            </a>
          </div>
        </section>

        {/* DESPRE SECTION */}
        <section className="section" id="sec1" style={{ background: '#000' }}>
          <div className="particles-container">{generateParticles(20)}</div>
          <div className="max-w-2xl text-center relative z-10">
            <h2
              className="text-4xl md:text-5xl font-bold mb-16 reveal"
              style={{ color: '#D4AF37' }}
            >
              Despre Noi
            </h2>
            <p
              className="text-lg text-gray-300 mb-8 leading-relaxed reveal-left"
              style={{ transitionDelay: '0.2s' }}
            >
              Suntem KEYDEV, o echipă specializată în dezvoltarea de site-uri moderne, rapide și
              optimizate SEO.
            </p>
            <p
              className="text-lg text-gray-300 leading-relaxed reveal-right"
              style={{ transitionDelay: '0.4s' }}
            >
              Ajutăm afacerile să își crească prezența online prin design, performanță și strategie
              digitală.
            </p>
          </div>
        </section>

        {/* PROIECTE SECTION */}
        <section className="section" id="sec2" style={{ background: '#000' }}>
          <div className="particles-container">{generateParticles(20)}</div>
          <div className="text-center max-w-4xl relative z-10">
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 reveal"
              style={{ color: '#D4AF37' }}
            >
              Proiecte
            </h2>
            <p
              className="text-gray-400 mb-12 reveal"
              style={{ transitionDelay: '0.2s' }}
            >
              În curând lansăm proiecte digitale inovatoare
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="project-card rounded-xl p-8 reveal"
                style={{ transitionDelay: '0.3s' }}
              >
                <div className="text-3xl mb-4">🌐</div>
                <h3 className="font-semibold text-lg mb-2">Web Design</h3>
                <p className="text-gray-500 text-sm">Coming soon</p>
              </div>
              <div
                className="project-card rounded-xl p-8 reveal"
                style={{ transitionDelay: '0.5s' }}
              >
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="font-semibold text-lg mb-2">Performanță</h3>
                <p className="text-gray-500 text-sm">Coming soon</p>
              </div>
              <div
                className="project-card rounded-xl p-8 reveal"
                style={{ transitionDelay: '0.7s' }}
              >
                <div className="text-3xl mb-4">📈</div>
                <h3 className="font-semibold text-lg mb-2">SEO</h3>
                <p className="text-gray-500 text-sm">Coming soon</p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section className="section" id="sec3" style={{ background: '#000' }}>
          <div className="particles-container">{generateParticles(20)}</div>
          <div className="max-w-lg w-full text-center relative z-10">
            <h2
              className="text-4xl md:text-5xl font-bold mb-10 reveal"
              style={{ color: '#D4AF37' }}
            >
              Hai să lucrăm împreună
            </h2>
            <form
              onSubmit={handleSubmit}
              className="space-y-4 reveal"
              style={{ transitionDelay: '0.3s' }}
            >
              <div>
                <label htmlFor="name" className="sr-only">
                  Nume
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input rounded-lg"
                  placeholder="Nume"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input rounded-lg"
                  placeholder="Email"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="message" className="sr-only">
                  Mesaj
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="form-input rounded-lg"
                  rows="4"
                  placeholder="Mesaj"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                className="btn-gold w-full rounded-lg font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" />
                    Se trimite...
                  </>
                ) : (
                  'Trimite mesajul'
                )}
              </button>
            </form>

            {submitSuccess && (
              <p className="text-green-400 mt-4">Mesajul a fost trimis! ✨</p>
            )}
            {submitError && (
              <p className="text-red-400 mt-4">{submitError}</p>
            )}

            <div
              className="mt-10 text-gray-500 text-sm reveal"
              style={{ transitionDelay: '0.5s' }}
            >
              <p>contact@keydev.ro</p>
              <div className="flex justify-center gap-4 mt-3">
                <a href="#" className="hover:text-gold transition-colors" aria-label="Instagram">
                  📷
                </a>
                <a href="#" className="hover:text-gold transition-colors" aria-label="LinkedIn">
                  💼
                </a>
                <a href="#" className="hover:text-gold transition-colors" aria-label="Twitter">
                  🐦
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
