import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv"
dotenv.config();

export const protect = async (req,res , next) =>{
    try{
        const token = req.cookies.token;

        if(!token){
            return res.status(401).json({
                success : false,
                message : "Unauthorized Access"
            })
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        ) 

        const user = await User.findById(decoded.userId);
        if(!user){
            return res.status(400).json({
                success : false,
                message : "User not found"
            })
        }

        req.user = user;

        next();
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success : false,
            message : "Invalid Token"
        })
    }
}