import express from 'express';
import dotenv from 'dotenv';
import stripe from 'stripe';

dotenv.config();

const app = express();

// Add CORS middleware to allow requests from any origin
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(express.static('public'));
app.use(express.json());

//home route
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

//success
app.get('/success', (req, res) => {
    res.sendFile('success.html', { root: 'public' });
});

//cancel
app.get('/cancel', (req, res) => {
    res.sendFile('cancel.html', { root: 'public' });
});

const PORT = process.env.PORT || 3000;

//stripe
let stripeGateway = stripe(process.env.STRIPE_API);
let DOMAIN = process.env.DOMAIN;

// Initialize cartItems object
let cartItems = {};

app.post('/stripe-checkout', async (req, res) => {
    const lineItems = req.body.items.map((item) => {
        const unitAmount = parseInt((item.price || '0').replace(/[^0-9.-]+/g, '') * 100);

        return {
            price_data: {
                currency: 'php',
                product_data: {
                    name: item.title,
                    images: [item.productImg],
                },
                unit_amount: unitAmount,
            },
            quantity: item.quantity,
        };
    });

    try {
        const session = await stripeGateway.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${DOMAIN}/success`,
            cancel_url: `${DOMAIN}/cancel`,
            line_items: lineItems,
            billing_address_collection: 'required',
        });

        // Reset cartItems to an empty object after successful checkout
        cartItems = {};

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({ error: 'Error during checkout' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
