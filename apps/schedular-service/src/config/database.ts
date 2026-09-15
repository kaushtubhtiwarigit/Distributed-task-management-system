import mongoose from "mongoose";

export const connectToDatabase = async () => {
    await mongoose.connect("mongodb://localhost:27017/tasks");
    console.log("Connected to database");   
}