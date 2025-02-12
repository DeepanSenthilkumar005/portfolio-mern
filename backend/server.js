require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const ConnectDB = require('./config/DbConnect');
const Feedback = require('./models/feedback')

app.use(cors());
app.use(express.json());

// Connecting the Database
ConnectDB();

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Backend is running at http://localhost:${port}`);
});


app.post('/feedback', async (req, res) => {
    try {
        const { name, email, phone, msg } = req.body;

        // Validation (Optional)
        if (!name || !email || !msg) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        // Create and Save Feedback
        const newFeedback = new Feedback({ name, email, phone, msg });
        await newFeedback.save();

        res.status(201).json({ message: "Feedback submitted successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});