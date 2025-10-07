function Over() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Over Nikkie's Handwerk Paradijs</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Welkom bij Nikkie's Handwerk Paradijs! Hier vind je unieke, met de hand gemaakte creaties 
            die met liefde en zorg zijn gemaakt.
          </p>
          
          <h2 className="text-2xl font-bold mb-4 mt-8">Wat ik doe</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Ik ben gespecialiseerd in twee ambachten:
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3">Haken</h3>
              <p className="text-gray-700 leading-relaxed">
                Het haken van knuffels en kraamcadeaus is mijn passie. Elk stuk wordt met de hand gemaakt 
                en kan volledig gepersonaliseerd worden naar jouw wensen. Van schattige amigurumi tot praktische 
                babyartikelen - alles is mogelijk!
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3">Borduren</h3>
              <p className="text-gray-700 leading-relaxed">
                Met borduren voeg ik een persoonlijk tintje toe aan textiel. Of het nu gaat om een naam op een 
                badjasje, een leuke afbeelding op een handdoek of een speciaal patroon op een dierendeken - 
                elk geborduurde item is uniek en blijft lang mooi.
              </p>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-4 mt-8">Contact</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Heb je vragen over een product of wil je een speciale bestelling plaatsen? Neem gerust contact 
            met mij op! Ik help je graag verder met het realiseren van jouw unieke handwerk.
          </p>
          
          <div className="bg-blue-50 p-6 rounded-lg mt-8">
            <p className="text-gray-700">
              <strong>Let op:</strong> Alle producten worden met de hand gemaakt en op bestelling geproduceerd. 
              Levertijden kunnen variëren afhankelijk van de complexiteit van het project en mijn huidige werkvoorraad.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Over

