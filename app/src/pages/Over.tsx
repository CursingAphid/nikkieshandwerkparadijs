import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OverBanner from '../assets/banners/over_banner.png';
import NicoleOnScooter from '../assets/over/nicole_op_scooter.png';

function Over() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Scroll-based animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px 200px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    if (titleRef.current) {
      observer.observe(titleRef.current);
    }

    return () => {
      if (titleRef.current) {
        observer.unobserve(titleRef.current);
      }
    };
  }, []);

  return (
    <div>
      {/* Banner Section */}
      <section 
        className="w-full h-48 md:h-64 lg:h-80 flex items-center justify-center"
        style={{ 
          backgroundImage: `url(${OverBanner})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      >
        <h1 ref={titleRef} className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center logo-pop-in" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          Over Nikkie's Handwerkparadijs
        </h1>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Wie ben ik? Section */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Text Column */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-6">Wie ben ik?</h1>
              
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  Ik ben Nicole Albertz en woon in Kerkrade samen met mijn gezin en onze hond Bailey. 
                  Ik werk in een verzekeringskantoor, maar vind mijn rust en ontspanning in het haken en borduren.
                </p>
                
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  Jaren geleden ben ik begonnen met het maken van simpele haakwerkjes. Ik heb het vak geleerd 
                  en maak nu vol enthousiasme veel verschillende items die ik graag wil delen.
                </p>
                
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  Mijn favoriete bezigheid is het maken van knuffels en kraamcadeaus zoals babydoekjes, 
                  rammelaars, speenkettingen en slabbetjes.
                </p>
              </div>
            </div>
            
            {/* Image Column */}
            <div>
              <div className="relative">
                <img 
                  src={NicoleOnScooter} 
                  alt="Nicole op de scooter met knuffels en kraamcadeaus" 
                  className="w-full max-w-md md:max-w-none h-auto rounded-2xl shadow-lg mx-auto md:mx-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 mt-8">Contact</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Heb je vragen over een product of wil je een speciale bestelling plaatsen? Neem gerust contact 
            met mij op! Ik help je graag verder met het realiseren van jouw unieke handwerk.
          </p>
          
          <div className="mb-6">
            <Link 
              to="/contact" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Neem contact op</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex justify-center items-center space-x-6">
            {/* Instagram Icon */}
            <a
              href="https://www.instagram.com/nikkieshandwerkparadijs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-300"
              aria-label="Instagram"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {/* Facebook Icon */}
            <a
              href="https://www.facebook.com/nikkieshandwerkparadijs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-300"
              aria-label="Facebook"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>

          <div className="mt-4 text-center text-gray-400 text-sm">
            © 2024 Nikkie's Handwerk Paradijs. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Over

