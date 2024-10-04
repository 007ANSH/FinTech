import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
dotenv.config();
const client = new MongoClient(process.env.MONGO_URL);

mongoose.connect(process.env.MONGO_URL);

const month = mongoose.Schema({
    name : String, 
    expense : [
        {
            name : String,
            amount : Number,
            date : String
        }
    ]
})

const monthModel = mongoose.model('month', month); 

export default monthModel;


