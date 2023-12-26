import express from "express";
import dotenv from "dotenv";
import stripe from "stripe";
import { v4 as uuidv4 } from "uuid";
import balance from "stripe";
import { initializeApp } from "firebase/app";
import { set, getDatabase, ref, remove, update} from "firebase/database";

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
            res.sendFile("success.html", { root: "public" });
        })
        .catch((error) => {
            console.error("Error removing items from the database:", error);
            res.status(500).json({ error: "Error during checkout" });
        });
});

//cancel
app.get("/cancel.html", (req, res) => {
    res.sendFile("cancel.html", { root: "public" });
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
app.get("/getSuccessfulTransactions", async (req, res) => {
    try {
        const transactionsSnapshot = await get(ref(db, "TransactionHistory"));
        const transactionsData = transactionsSnapshot.val();

        if (transactionsData) {
            // Extract relevant details for each successful transaction
            const successfulTransactions = Object.values(transactionsData).map(
                (transaction) => ({
                    transactionId: transaction.transactionId,
                    formattedDate: transaction.formattedDate,
                    items: transaction.items,
                    totalAmount: transaction.totalAmount,
                    currency: "php", // Adjust as needed
                    status: transaction.status, // Default to "pending" if not present
                })
            );

            res.json({ successfulTransactions });
        } else {
            console.log("No transaction history found.");
            res.json({ successfulTransactions: [] });
        }
    } catch (error) {
        console.error("Error fetching successful transactions:", error);
        res.status(500).json({ error: "Error fetching successful transactions" });
    }
});

// Update the server-side code
// Update the server-side cod

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

        // Assuming you have the user ID available
        const userId = req.body.userId; // Adjust this based on how you identify users

        // Generate a new transaction ID (UUID)
        const transactionId = uuidv4();

        // Create a Stripe Checkout Session
        const session = await stripeGateway.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${DOMAIN}/success`, // Adjust this URL
            cancel_url: `${DOMAIN}/cancel.html`, // Adjust this URL
            metadata: {
                transactionId: transactionId, // Include the transaction ID in the session metadata
            },
        });

        // Save transaction details in the database with the new transaction ID
        const transactionRef = ref(db, `TransactionHistory/${userId}/${transactionId}`);
        const timestamp = new Date().toISOString();


        // Convert the timestamp to a Date object
        const date = new Date(timestamp);

        // Format the date in the Philippines timezone
        const options = { timeZone: "Asia/Manila" };
        const formattedDate = date.toLocaleString("en-US", options);

        const transactionDetails = {
            transactionId: transactionId,
            formattedDate,
            items: lineItems,
            totalAmount: req.body.totalAmount, // Add this if needed
            status: 'Pending',
            // Add more details as needed
        };
        

        await set(transactionRef, transactionDetails);

        // Reset the user's cart in the database
        const userCartRef = ref(db, `UserAuthList/${userId}/cart`);
        remove(userCartRef);

        res.json({ url: session.url, transactionId: transactionId });
    } catch (error) {
        console.error("Error during checkout:", error);
        res.status(500).json({ error: "Error during checkout" });
    }
});

app.post("/update-transaction-status", async (req, res) => {
    try {
        const userId = req.body.userId;
        const transactionId = req.body.transactionId;
        const newStatus = req.body.newStatus; // You can pass the new status from the client

        const transactionRef = ref(db, `TransactionHistory/${userId}/${transactionId}`);

        // Update the status in the database
        await update(transactionRef, { status: newStatus });

        res.json({ success: true, message: 'Transaction status updated successfully' });
    } catch (error) {
        console.error("Error updating transaction status:", error);
        res.status(500).json({ error: "Error updating transaction status" });
    }
});






app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

