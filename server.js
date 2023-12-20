import express from "express";
import dotenv from "dotenv";
import stripe from "stripe";
import balance  from "stripe";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, remove } from "firebase/database";

dotenv.config();

const app = express();


// Add CORS middleware to allow requests from any origin
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

const firebaseConfig = {
    apiKey: "AIzaSyDs1lfKYOB5--BiDaVHBWu9baIM8GHAnlo",
    authDomain: "sample-42d4a.firebaseapp.com",
    projectId: "sample-42d4a",
    storageBucket: "sample-42d4a.appspot.com",
    messagingSenderId: "508468942956",
    appId: "1:508468942956:web:65600c02f26dfd1b1f2049",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

app.use(express.static("public"));
app.use(express.json());

//home route
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: "public" });
});

//success
app.get("/success", (req, res) => {
    // Assuming you have the user ID available
    const userId = req.body.userId; // Access userId from the request body

    // Reset cartItems to an empty object after successful checkout
    cartItems = {};

    // Remove items from the database
    const userCartRef = ref(db, `UserAuthList/${userId}/cart`);
    remove(userCartRef)
        .then(() => {
            res.sendFile("/success.html", { root: "public" });
        })
        .catch((error) => {
            console.error("Error removing items from the database:", error);
            res.status(500).json({ error: "Error during checkout" });
        });
});

//cancel
app.get("/cancel.html", (req, res) => {
    res.sendFile("/cancel.html", { root: "public" });
});

// Fetch Stripe account balance
app.get("/getBalance", async (req, res) => {
    try {
        const balance = await stripeGateway.balance.retrieve();

        res.json({ balance: balance.available[0].amount / 100 }); // Convert to dollars
    } catch (error) {
        console.error("Error fetching balance:", error);
        res.status(500).json({ error: "Error fetching balance" });
    }
});

// Update the server-side code
app.get("/getSuccessfulTransactionsCount", async (req, res) => {
    try {
        const sessions = await stripeGateway.checkout.sessions.list({
            limit: 100, // Adjust as needed
        });

        // Filter sessions to include only successful transactions
        const successfulSessions = sessions.data.filter(session => session.payment_status === 'paid');
        const numberOfSuccessfulTransactions = successfulSessions.length;

        res.json({ numberOfSuccessfulTransactions });
    } catch (error) {
        console.error("Error fetching successful transactions count:", error);
        res.status(500).json({ error: "Error fetching successful transactions count" });
    }
});

// Update the server-side code
app.get("/getSuccessfulTransactions", async (req, res) => {
    try {
        const sessions = await stripeGateway.checkout.sessions.list({
            limit: 100, // Adjust as needed
        });

        // Filter sessions to include only successful transactions
        const successfulSessions = sessions.data.filter(session => session.payment_status === 'paid');

        // Extract relevant details for each successful transaction
        const successfulTransactions = successfulSessions.map(session => ({
            id: session.id,
            amount: session.amount_total / 100, // Convert to dollars
            currency: session.currency,
            customerEmail: session.customer_email || 'Guest',
            createdAt: new Date(session.created * 1000).toLocaleString(),
        }));

        res.json({ successfulTransactions });
    } catch (error) {
        console.error("Error fetching successful transactions:", error);
        res.status(500).json({ error: "Error fetching successful transactions" });
    }
});






const PORT = process.env.PORT || 3000;

//stripe
const stripeGateway = stripe(process.env.STRIPE_API);
const DOMAIN = process.env.DOMAIN;
let cartItems = {};

app.post("/stripe-checkout", async (req, res) => {
    try {
        const lineItems = req.body.items.map((item) => {
            const unitAmount = parseInt(
                (item.price || "0").replace(/[^0-9.-]+/g, "") * 100
            );

            console.log("Item Title:", item.title);
            console.log("Item ProductImg:", item.productImg);
            console.log("Unit Amount:", unitAmount);

            // Check for missing or invalid data
            if (!item.title || !item.productImg || isNaN(unitAmount)) {
                throw new Error("Invalid item data");
            }

            return {
                price_data: {
                    currency: "php",
                    product_data: {
                        name: item.title,
                        images: [item.productImg],
                    },
                    unit_amount: unitAmount,
                },
                quantity: item.quantity,
            };
        });

        const session = await stripeGateway.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            success_url: `${DOMAIN}/success`,
            cancel_url: `${DOMAIN}/cancel`,
            line_items: lineItems,
            billing_address_collection: "required",
        });

        // Assuming you have the user ID available
        const userId = req.body.userId; // Adjust this based on how you identify users

        // Remove items from the database
        const userCartRef = ref(db, `UserAuthList/${userId}/cart`);
        remove(userCartRef);

        res.json({ url: session.url });
    } catch (error) {
        console.error("Error during checkout:", error);
        res.status(500).json({ error: "Error during checkout" });
    }
    
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
