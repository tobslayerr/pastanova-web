const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    images: [String],
    // TAMBAHKAN INI:
    addons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Addon' }]
}, { timestamps: true });

module.exports = mongoose.model('Menu', MenuSchema);
