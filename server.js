const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const multer = require('multer');
const mongoose = require('mongoose');
require('./db');
const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart'); // Added Cart model
const Order = require('./models/Order'); // Added Order model

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // To handle JSON for cart requests
app.use(express.static(path.join(__dirname)));

// Multer setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Routes
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('/upload-product', (req, res) => res.sendFile(path.join(__dirname, 'upload-product.html')));
app.get('/index2.html', (req, res) => res.sendFile(path.join(__dirname, 'index2.html')));

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (user) res.redirect(`/index2.html?name=${user.name}&userId=${user._id}`);

        else res.send('Invalid credentials. <a href="/login">Try again</a>');
    } catch (err) {
        console.error(err);
        res.send('Error during login.');
    }
});

app.get('/api/cart/count', async (req, res) => {
    const userId = req.query.userId;
    try {
        const cartItems = await Cart.find({ userId: userId });
        // Sum all quantities:
        const totalQuantity = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
        res.json({ count: totalQuantity });
    } catch (error) {
        console.error('Error fetching cart count:', error);
        res.status(500).json({ error: 'Failed to fetch cart count' });
    }
});


app.get('/api/cart/items', async (req, res) => {
    const { userId } = req.query;
    try {
        const user = await User.findById(userId);
        if (!user || !user.cart) {
            return res.json({ items: [] });
        }
        res.json({ items: user.cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch cart items' });
    }
});


// Register
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existing = await User.findOne({ email });
        if (existing) return res.send('User exists. <a href="/login">Login</a>');
        const user = new User({ name, email, password });
        await user.save();
        res.send('Registration successful! <a href="/login">Login</a>');
    } catch (err) {
        console.error(err);
        res.send('Registration error.');
    }
});

// Product Upload
app.post('/upload-product', upload.single('image'), async (req, res) => {
    const { name, description, price, category } = req.body;
    if (!req.file) return res.status(400).send('Upload image.');

    const newProduct = new Product({
        name, description, price: parseFloat(price), category,
        imagePath: '/uploads/' + req.file.filename
    });

    try {
        await newProduct.save();
        res.send('Product uploaded!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Product save error.');
    }
});

// Fetch Products by Category
app.get('/api/products/:category', async (req, res) => {
    try {
        const products = await Product.find({ category: req.params.category });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Fetch error' });
    }
});

// Fetch Single Product
app.get('/api/product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Detail fetch error' });
    }
});

// ----- CART APIs -----

// Add item to cart
app.post('/api/cart/add', async (req, res) => {
    const { userId, productId, name, price, qty } = req.body;

    try {
        let userCart = await Cart.findOne({ userId: userId });

        if (!userCart) {
            // Create a new cart for this user
            userCart = new Cart({
                userId: userId,   // <-- THIS must be passed properly (yours is 'null' now)
                items: [{ productId, name, price, qty }]
            });
        } else {
            // Check if product already exists
            const existingProduct = userCart.items.find(item => item.productId.toString() === productId);

            if (existingProduct) {
                existingProduct.qty += qty; // increment quantity
            } else {
                userCart.items.push({ productId, name, price, qty });
            }
        }

        await userCart.save();
        res.json({ message: 'Product added to cart!' });

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});


// Get Cart for User
app.get('/api/cart/:userId', async (req, res) => {
    const cart = await Cart.findOne({ userId: req.params.userId });
    res.json(cart ? cart.items : []);
});

// Remove Item
app.post('/api/cart/remove', async (req, res) => {
    const { userId, productId } = req.body;
    const cart = await Cart.findOne({ userId });
    if (cart) {
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();
    }
    res.json(cart);
});

// ----- CHECKOUT API -----
app.post('/api/checkout', async (req, res) => {
    const { userId } = req.body;
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
        return res.status(400).json({ error: 'Cart empty' });
    }

    const order = new Order({
        userId,
        items: cart.items,
        total: cart.items.reduce((sum, item) => sum + item.price * item.qty, 0)
    });

    await order.save();
    await Cart.deleteOne({ userId }); // Clear cart after checkout
    res.json({ message: 'Order placed', order });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Server error!');
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
