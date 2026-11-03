/* The 5 starter products. Shown before your database is connected, and added to it with
   one click from the admin panel ("Add the 5 starter products"). After that, change products
   in the admin panel, not here. No supplier costs or links in this file: everyone can see it. */
window.STARTER_PRODUCTS = [
  {
    id: "tws-earbuds-40h", order: 1, category: "earbuds",
    name: "TWS Wireless Earbuds · 40H Playtime",
    description: "Bluetooth 5.4 earbuds with touch controls and a pocket charging case. Up to 40 hours of playback with the case. Ships with a white case.",
    price: 685, mrp: 1449, inStock: true,
    images: ["earbuds-1.jpg", "earbuds-2.jpg"],
    features: ["Up to 40 hours of total playtime with the charging case", "Bluetooth 5.4 for quick, stable pairing", "Touch controls for music and calls", "Built-in mic for HD voice calls", "In the box: earbuds, white charging case and USB charging cable"]
  },
  {
    id: "magnetic-neckband-55h", order: 2, category: "neckband",
    name: "Magnetic Neckband Earphones · 55H Playtime",
    description: "Wireless neckband with magnetic earbuds that snap together when not in use, and up to 55 hours of playtime. Colour may vary.",
    price: 547, mrp: 949, inStock: true,
    images: ["neckband-1.jpg", "neckband-2.jpg"],
    features: ["Up to 55 hours of playtime", "Magnetic earbuds snap together when you're not listening", "Buttons on the neckband for music and calls", "Lightweight, about 70 g", "Colour may vary from the photos"]
  },
  {
    id: "t800-smartwatch", order: 3, category: "watch",
    name: "T800 Smartwatch · Bluetooth Calling",
    description: "49mm smartwatch for calls and notifications on your wrist, with heart-rate and sleep tracking and wireless charging.",
    price: 825, mrp: 999, inStock: true,
    images: ["watch-1.jpg", "watch-2.jpg"],
    features: ["Big 1.99-inch display in a 49mm case", "Make and answer calls from your wrist over Bluetooth", "Heart-rate and sleep tracking, plus multiple sport modes", "Wireless charging", "Phone notifications, voice assistant and calculator"]
  },
  {
    id: "powerbank-20000-33w", order: 4, category: "powerbank",
    name: "20000mAh 33W Fast-Charging Power Bank",
    description: "Charges most phones 4 to 5 times. USB-A and Type-C outputs charge two devices at once, with an LED battery indicator.",
    price: 1871, mrp: 2999, inStock: true,
    images: ["powerbank-1.jpg", "powerbank-2.jpg"],
    features: ["20000mAh capacity charges most phones 4 to 5 times", "33W fast charging", "USB-A and Type-C outputs charge two devices at once", "Digital display shows the battery level", "Protection against overcharging, overvoltage and short circuits"]
  },
  {
    id: "bluetooth-speaker-10w", order: 5, category: "speaker",
    name: "Portable Bluetooth Speaker · 10W with FM",
    description: "Dual 5W drivers with LED lights, FM radio, and USB and memory-card playback. 2400mAh rechargeable battery.",
    price: 703, mrp: 999, inStock: true,
    images: ["speaker-1.jpg", "speaker-2.jpg"],
    features: ["10W stereo sound from two 5W drivers", "Plays from Bluetooth (up to 10 m), FM radio, memory card or USB drive", "2400mAh rechargeable battery", "LED lights on both ends", "Carry strap included"]
  }
];
