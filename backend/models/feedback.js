const mongoose = require('mongoose')

const sch = mongoose.Schema({
    name : {
        required : [true,"Name is required"],
        type : String
    },
    email : {
        required : [true,"Email is required"],
        type : String
    },
    phone : {
        required : [true,"Phone is required"],
        type : Number
    },
    msg : {
        required : [true,"Message is required"],
        type : String
    },
    date : {
        type : Date,
        default : Date.now
    }
})

module.exports = mongoose.model("Feed",sch);