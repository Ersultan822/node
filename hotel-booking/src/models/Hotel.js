const { Schema, model } = require('mongoose');

const hotelSchema = new Schema(
  {
    name: { type: String, required: [true, 'Қонақүй атауы міндетті'], trim: true },
    city: { type: String, required: [true, 'Қала міндетті'], trim: true, index: true },
    address: { type: String, required: [true, 'Мекенжай міндетті'], trim: true },
    stars: { type: Number, min: 1, max: 5, default: 3 },
    phone: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = model('Hotel', hotelSchema);
