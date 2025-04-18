const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: { type: String, required: true },
    imagePath: { type: String, required: true },
    // You might want to add a sellerId to link the product to a user
    // sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);