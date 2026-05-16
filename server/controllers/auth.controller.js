import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv"
dotenv.config();
import { Api } from "telegram";

import { createTelegramClient } from "../services/telegram.service.js";

let tempClient = null;
let phoneCodeHash = "";
let tempPhone = "";

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
      phone,
    );

    tempClient = client;
    phoneCodeHash = result.phoneCodeHash;
    tempPhone = phone;

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

export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP required",
      });
    }

    const result = await tempClient.invoke(

      new Api.auth.SignIn({
        phoneNumber: tempPhone,
        phoneCodeHash,
        phoneCode: otp,
      })

    );

    const session = tempClient.session.save();

    let user = await User.findOne({
      phone: tempPhone,
    });

    if (!user) {
      user = await User.create({
        phone: tempPhone,
        telegramSession: session,
      });
    } else {
      user.telegramSession = session;
      await user.save();
    }
    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      user: {
        id: user._id,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      seccess: false,
      message: err.message,
    });
  }
};
