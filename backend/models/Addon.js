const mongoose = require('mongoose');

const AddonSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' }, // Kolom baru untuk deskripsi
    price: { type: Number, default: 0 },
    image: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Addon', AddonSchema);
