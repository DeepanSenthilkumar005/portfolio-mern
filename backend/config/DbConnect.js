require('dotenv').config()
const mongoose = require('mongoose')

const ConnectDB = async () =>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB Connected")
    }
    catch(e)
    {
        console.error("MongoDB not Connected \n"+e);
    }
}
module.exports = ConnectDB;



