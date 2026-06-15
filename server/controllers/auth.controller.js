import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

import { Api } from "telegram";

import User from "../models/User.js";

import {
  createTelegramClient,
} from "../services/telegram.service.js";

let tempClient = null;
let phoneCodeHash = "";
let tempPhone = "";


// SEND OTP
export const sendOTP = async (req, res) => {

  try {

    const { phone } = req.body;

    if (!phone) {

      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });

    }

    const client = createTelegramClient();

    await client.connect();

    const result = await client.sendCode(
      {
        apiId: Number(process.env.API_ID),
        apiHash: process.env.API_HASH,
      },
      phone
    );

    tempClient = client;
    phoneCodeHash = result.phoneCodeHash;
    tempPhone = phone;

    console.log("OTP SENT");
    console.log(phoneCodeHash);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (err) {

    console.log(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};


// VERIFY OTP
export const verifyOTP = async (req, res) => {

  try {

    const { otp } = req.body;

    if (!otp) {

      return res.status(400).json({
        success: false,
        message: "OTP required",
      });

    }

    if (!tempClient) {

      return res.status(400).json({
        success: false,
        message: "Session expired. Request OTP again.",
      });

    }

    // LOGIN
    const result = await tempClient.invoke(

      new Api.auth.SignIn({

        phoneNumber: tempPhone,

        phoneCodeHash,

        phoneCode: otp,

      })

    );

    // IMPORTANT
    // ensures authenticated session fully initialized
    const me = await tempClient.getMe();
    const username = me.username || null;

    // SAVE SESSION
    const session = tempClient.session.save();

    console.log("SESSION:");
    console.log(session);

    let user = await User.findOne({
      phone: tempPhone,
    });

    // CREATE USER
    if (!user) {
      user = await User.create({
        phone: tempPhone,
        telegramSession: session,
        username,
      });
    }
    // UPDATE USER
    else {
      user.telegramSession = session;
      if (username) {
        user.username = username;
      }
      await user.save();
    }

    // JWT
    const token = jwt.sign(

      {
        userId: user._id,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      }

    );

    // COOKIE
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    // CLEANUP TEMP STATE
    tempClient = null;
    phoneCodeHash = "";
    tempPhone = "";

    return res.status(200).json({

      success: true,

      message: "Login Successful",

      token,

      user: {

        id: user._id,

        phone: user.phone,

      },

    });

  } catch (err) {

    console.log(err);

    return res.status(500).json({

      success: false,

      message: err.message,

    });

  }

};