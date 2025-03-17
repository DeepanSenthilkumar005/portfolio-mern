const mongoose = require('mongoose')
const getISTTime = () => {
  let date = new Date();
  let istOffset = 5.5 * 60 * 60 * 1000; // IST Offset (+5:30)
  return new Date(date.getTime() + istOffset);
};
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
        default : getISTTime
    }
})

module.exports = mongoose.model("Feed",sch);
