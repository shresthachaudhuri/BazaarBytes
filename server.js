const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const multer = require('multer'); // Import multer

const mongoose = require('mongoose');
require('./db');
const User = require('./models/User');
const Product = require('./models/Product'); // Create a Product model (see below)

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads')); // Store uploaded files in the 'uploads' directory
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Serve login and register pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/upload-product', (req, res) => {
    res.sendFile(path.join(__dirname, 'upload-product.html'));
});

// Handle login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email, password });

        if (user) {
            res.redirect(`/index2.html?name=${user.name}`);
        } else {
            res.send('Invalid email or password. <a href="/login">Try again</a>');
        }
    } catch (err) {
        console.error(err);
        res.send('Error occurred during login.');
    }
});

// Serve index2.html
app.get('/index2.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index2.html'));
});

// Handle registration
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.send('User already exists. <a href="/login">Login</a>');
        }

        const user = new User({ name, email, password });
        await user.save();

        res.send('Registration successful! <a href="/login">Login</a>');
    } catch (err) {
        console.error(err);
        res.send('Error occurred during registration.');
    }
});

// Handle product upload
app.post('/upload-product', upload.single('image'), async (req, res) => {
    const { name, description, price, category } = req.body;

    if (!req.file) {
        return res.status(400).send('Please upload an image.');
    }

    const newProduct = new Product({
        name: name,
        description: description,
        price: parseFloat(price),
        category: category,
        imagePath: '/uploads/' + req.file.filename // Store the path to the image
        // You might want to associate this product with the logged-in seller as well
    });

    try {
        await newProduct.save();
        res.send('Product uploaded successfully!');
        // You might want to redirect the user to a success page
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving product to database.');
    }
});

// Route to fetch products by category
app.get('/api/products/:category', async (req, res) => {
    const categoryName = req.params.category;
    try {
        const products = await Product.find({ category: categoryName });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Error handler for unhandled errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
