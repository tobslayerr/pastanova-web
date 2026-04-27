const mongoose = require('mongoose');

const AddonSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    image: { type: String, required: true }, // URL Cloudinary
}, { timestamps: true });

module.exports = mongoose.model('Addon', AddonSchema);
