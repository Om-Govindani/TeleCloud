import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
dotenv.config();
import express from "express";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(cors({
    origin : "https://localhost:5173",
    credentials : true,
}))

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth" , authRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("MongoDB Connected")

    app.listen(process.env.PORT, ()=>{
        console.log(`Server running on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log(err);
})