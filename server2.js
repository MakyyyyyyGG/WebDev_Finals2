import express from 'express';
import dotenv from 'dotenv';

const stripe = require('stripe')('sk_test_51ONeFdCH9Yb9ZLbw9Zy0rEjRitxQbbvhjZDzp0lUvy6tmzyvbxX2RClXMbJlAUulLgEFXEDJn6BATSwCtiXObxyR00fBxAPF1P');
const bodyParser = require('body-parser');
const path = require('path'); // Import the path module


const app = express();
app.use(bodyParser.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

app.post('/create-checkout-session', async (req, res) => {
    const lineItems = req.body.lineItems;

    // Create a checkout session on Stripe
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: 'https://your-website.com/success', // Replace with your success URL
        cancel_url: 'https://your-website.com/cancel', // Replace with your cancel URL
    });

    res.json({ id: session.id });
});

app.post('/check-payment-status', async (req, res) => {
    const sessionId = req.body.sessionId;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({ paymentStatus: session.payment_status });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
