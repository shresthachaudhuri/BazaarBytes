// models/Cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    qty: Number
});

const cartSchema = new mongoose.Schema({
    userId: String, // We'll use user email or _id for simplicity
    items: [cartItemSchema]
});

module.exports = mongoose.model('Cart', cartSchema);
