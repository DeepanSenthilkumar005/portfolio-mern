const mongoose = require('mongoose')

const sch = mongoose.Schema({
    name: {
        required: [true, "Name is required"],
        type: String,
        trim: true
    },
    email: {
        required: [true, "Email is required"],
        type: String,
        trim: true,
        lowercase: true
    },
    // Optional: the contact form no longer asks for it. String, not Number, so
    // "+91 94424 79225" survives intact.
    phone: {
        type: String,
        trim: true,
        default: ""
    },
    msg: {
        required: [true, "Message is required"],
        type: String,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("Feed", sch);
