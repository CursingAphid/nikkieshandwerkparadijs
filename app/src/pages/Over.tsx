import { useRef, useEffect, useState } from 'react';
import OverBanner from '../assets/banners/over_banner.png';
import NicoleOnScooter from '../assets/over/nicole_op_scooter.png';
import HobbyKamer1 from '../assets/over/hobby_kamer/1-25.png';
import HobbyKamer2 from '../assets/over/hobby_kamer/2-25.png';
import HobbyKamer3 from '../assets/over/hobby_kamer/3-24.png';
import HobbyKamer4 from '../assets/over/hobby_kamer/4-20.png';
import HobbyKamer5 from '../assets/over/hobby_kamer/5-15.png';
import OverMijLogo from '../assets/over/Over_mij_logo.png';

function Over() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  
  const hobbyKamerImages = [
    HobbyKamer1,
    HobbyKamer2,
    HobbyKamer3,
    HobbyKamer4,
    HobbyKamer5
  ];

  // Carousel functions
  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === hobbyKamerImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? hobbyKamerImages.length - 1 : prevIndex - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Scroll-based animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const elementId = entry.target.getAttribute('data-animate-id');
          if (elementId) {
            setVisibleElements(prev => new Set([...prev, elementId]));
          }
        }
      });
    }, observerOptions);

    // Observe all elements with data-animate-id
    const animatedElements = document.querySelectorAll('[data-animate-id]');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <div>
      <style>{`
        .fade-in-left {
          opacity: 0;
          transform: translateX(-50px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        
        .fade-in-left.visible {
          opacity: 1;
          transform: translateX(0);
        }
        
        .fade-in-right {
          opacity: 0;
          transform: translateX(50px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        
        .fade-in-right.visible {
          opacity: 1;
          transform: translateX(0);
        }
        
        .logo-pop-in {
          opacity: 0;
          transform: scale(0.8);
          transition: opacity 1s ease-out, transform 1s ease-out;
        }
        
        .logo-pop-in.visible {
          opacity: 1;
          transform: scale(1);
        }
      `}</style>
      {/* Banner Section */}
      <section 
        className="w-full h-48 md:h-64 lg:h-80 flex items-center justify-center"
        style={{ 
          backgroundImage: `url(${OverBanner})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      >
        <h1 
          ref={titleRef} 
          data-animate-id="banner-title"
          className={`text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center logo-pop-in ${visibleElements.has('banner-title') ? 'visible' : ''}`} 
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          Over Nikkie's Handwerkparadijs
        </h1>
      </section>

      {/* Wie ben ik? Section */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Text Column */}
            <div 
              data-animate-id="wie-ben-ik-text"
              className={`fade-in-left ${visibleElements.has('wie-ben-ik-text') ? 'visible' : ''}`}
            >
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
            <div 
              data-animate-id="wie-ben-ik-image"
              className={`fade-in-right ${visibleElements.has('wie-ben-ik-image') ? 'visible' : ''}`}
            >
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
      </div>

      {/* Mijn Diensten Section */}
      <div className="bg-blue-50 py-16 w-full">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image Column */}
            <div 
              data-animate-id="diensten-image"
              className={`fade-in-left ${visibleElements.has('diensten-image') ? 'visible' : ''}`}
            >
              <div className="relative">
                <img 
                  src={OverMijLogo} 
                  alt="Nicole met gehaakte knuffels en borduurwerk" 
                  className="w-full max-w-md lg:max-w-none h-auto rounded-2xl shadow-lg mx-auto lg:mx-0"
                />
              </div>
            </div>
            
            {/* Text Column */}
            <div 
              data-animate-id="diensten-text"
              className={`fade-in-right ${visibleElements.has('diensten-text') ? 'visible' : ''}`}
            >
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  Om alles nog persoonlijker te maken, heb ik een borduurmachine aangeschaft waarbij ik namen, teksten en afbeeldingen kan toevoegen aan mijn haakwerkjes. Inmiddels vind ik het borduren zo leuk dat ik mijn hobby heb uitgebreid met het borduren van allerlei items zoals badjasjes, rompertjes, badcapejes, mutsjes, handdoekjes en nog veel meer.
                </p>
                
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  Naast het borduren van babyartikelen maak ik ook dierendekentjes. Deze zachte dekentjes worden geborduurd met de naam en een afbeelding van je huisdier en afgewerkt met een mooie strik.
                </p>
                
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  Bij elk item ga ik op zoek naar de juiste kleuren, patronen en lettertypen zodat er een prachtig eindresultaat ontstaat. Neem gerust een kijkje op mijn website, facebooksite of instagram account. Mocht je interesse hebben in één van mijn werkjes of wil je iets persoonlijks gemaakt hebben, neem dan contact met mij op.
                </p>
                
                <p className="text-gray-700 text-lg leading-relaxed font-semibold">
                  Liefs Nicole ♥
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mijn Hobbykamer Section */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Text Column */}
            <div 
              data-animate-id="hobbykamer-text"
              className={`flex flex-col justify-start fade-in-left ${visibleElements.has('hobbykamer-text') ? 'visible' : ''}`}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Mijn Hobbykamer</h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                In ons huis heb ik één kamer omgetoverd tot mijn hobbykamer. Hier vind je al mijn materialen, 
                stofjes, haakwol en nog veel meer leuke items. In deze kamer komt mijn creativiteit tot leven!
              </p>
            </div>
            
            {/* Image Carousel Column */}
            <div 
              data-animate-id="hobbykamer-carousel"
              className={`relative fade-in-right ${visibleElements.has('hobbykamer-carousel') ? 'visible' : ''}`}
            >
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <div className="relative h-96 md:h-[500px]">
                  <img
                    src={hobbyKamerImages[currentImageIndex]}
                    alt={`Hobbykamer foto ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-500"
                  />
                  
                  {/* Navigation Arrows */}
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
                    aria-label="Vorige foto"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
                    aria-label="Volgende foto"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Dots Indicator */}
              <div className="flex justify-center mt-6 space-x-2">
                {hobbyKamerImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'bg-blue-600 scale-125' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Ga naar foto ${index + 1}`}
                  />
                ))}
              </div>
            </div>
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

