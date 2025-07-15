import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config()

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        connectDB
        console.log(`Server is running at port : ${process.env.PORT}`);
        
    })
})
.catch((err) => {
  console.error('❌ MongoDB connection failed:', err.message);
  console.error(err);           
  process.exit(1);    
});

