// pb_migrations/1700000002_seed_names.js
// Seeds the `names` collection with ~40 Argentine / Spanish names.
// Each name carries gender, origin, and meaning so the swipe cards
// have rich content from day one.

const NAMES = [
  // — Girls —
  { name: "Valentina", gender: "girl", origin: "Latin", meaning: "Strong, healthy" },
  { name: "Sofía", gender: "girl", origin: "Greek", meaning: "Wisdom" },
  { name: "Isabella", gender: "girl", origin: "Hebrew", meaning: "Pledged to God" },
  { name: "Martina", gender: "girl", origin: "Latin", meaning: "Of Mars, warlike" },
  { name: "Catalina", gender: "girl", origin: "Greek", meaning: "Pure" },
  { name: "Emilia", gender: "girl", origin: "Latin", meaning: "Rival, eager" },
  { name: "Renata", gender: "girl", origin: "Latin", meaning: "Reborn" },
  { name: "Delfina", gender: "girl", origin: "Greek", meaning: "Dolphin; from Delphi" },
  { name: "Lucía", gender: "girl", origin: "Latin", meaning: "Light" },
  { name: "Pilar", gender: "girl", origin: "Spanish", meaning: "Pillar (of the Virgin)" },
  { name: "Mora", gender: "girl", origin: "Spanish", meaning: "Blackberry, mulberry" },
  { name: "Juana", gender: "girl", origin: "Hebrew", meaning: "God is gracious" },
  { name: "Carmen", gender: "girl", origin: "Latin", meaning: "Song, poem" },
  { name: "Rocío", gender: "girl", origin: "Spanish", meaning: "Morning dew" },
  { name: "Guadalupe", gender: "girl", origin: "Spanish", meaning: "River of the wolf" },
  { name: "Antonella", gender: "girl", origin: "Latin", meaning: "Priceless, of great worth" },
  { name: "Camila", gender: "girl", origin: "Latin", meaning: "Attendant at a ceremony" },
  { name: "Julieta", gender: "girl", origin: "Latin", meaning: "Youthful" },
  { name: "Olivia", gender: "girl", origin: "Latin", meaning: "Olive tree" },
  { name: "Paloma", gender: "girl", origin: "Spanish", meaning: "Dove" },
  // — Boys —
  { name: "Mateo", gender: "boy", origin: "Hebrew", meaning: "Gift of God" },
  { name: "Benjamín", gender: "boy", origin: "Hebrew", meaning: "Son of the right hand" },
  { name: "Santiago", gender: "boy", origin: "Hebrew", meaning: "Supplanter (St. James)" },
  { name: "Joaquín", gender: "boy", origin: "Hebrew", meaning: "Raised by God" },
  { name: "Tomás", gender: "boy", origin: "Aramaic", meaning: "Twin" },
  { name: "Bautista", gender: "boy", origin: "Greek", meaning: "Baptist, one who baptizes" },
  { name: "Lautaro", gender: "boy", origin: "Mapuche", meaning: "Swift hawk" },
  { name: "Thiago", gender: "boy", origin: "Hebrew", meaning: "Supplanter" },
  { name: "Felipe", gender: "boy", origin: "Greek", meaning: "Lover of horses" },
  { name: "Ignacio", gender: "boy", origin: "Latin", meaning: "Fiery, ardent" },
  { name: "Facundo", gender: "boy", origin: "Latin", meaning: "Eloquent, fortunate" },
  { name: "Lorenzo", gender: "boy", origin: "Latin", meaning: "From Laurentum; laurel" },
  { name: "Gael", gender: "boy", origin: "Breton", meaning: "Generous lord" },
  { name: "Bruno", gender: "boy", origin: "Germanic", meaning: "Brown; armor" },
  { name: "Dante", gender: "boy", origin: "Latin", meaning: "Enduring, steadfast" },
  { name: "Ramiro", gender: "boy", origin: "Germanic", meaning: "Famous counselor" },
  { name: "Emiliano", gender: "boy", origin: "Latin", meaning: "Rival, eager" },
  { name: "Nicolás", gender: "boy", origin: "Greek", meaning: "Victory of the people" },
  { name: "Valentino", gender: "boy", origin: "Latin", meaning: "Strong, healthy" },
  { name: "Salvador", gender: "boy", origin: "Latin", meaning: "Savior" },
];

migrate(
  () => {
    const dao = $app.dao();
    const names = dao.findCollectionByNameOrId("names");
    for (const n of NAMES) {
      const record = new Record(names, {
        name: n.name,
        gender: n.gender,
        origin: n.origin,
        meaning: n.meaning,
        source: "seed",
      });
      dao.saveRecord(record);
    }
  },
  () => {
    // down: remove all seeded names
    const dao = $app.dao();
    const records = dao.findRecordsByFilter("names", "source = 'seed'");
    for (const r of records) dao.deleteRecord(r);
  }
);
