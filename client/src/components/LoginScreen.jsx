import React, { useState } from "react";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";

const countries = [
  { code: "+91", name: "IN", flag: "🇮🇳" },
  { code: "+1", name: "US/CA", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+7", name: "RU", flag: "🇷🇺" },
  { code: "+971", name: "AE", flag: "🇦🇪" },
  { code: "+81", name: "JP", flag: "🇯🇵" },
  { code: "+86", name: "CN", flag: "🇨🇳" },
  { code: "+49", name: "DE", flag: "🇩🇪" },
  { code: "+33", name: "FR", flag: "🇫🇷" },
  { code: "+39", name: "IT", flag: "🇮🇹" },
  { code: "+61", name: "AU", flag: "🇦🇺" },
  { code: "+55", name: "BR", flag: "🇧🇷" },
  { code: "+27", name: "ZA", flag: "🇿🇦" },
  { code: "+62", name: "ID", flag: "🇮🇩" },
];

const LoginScreen = () => {
  const { loginUser, showToast } = useApp();
  const [countryCode, setCountryCode] = useState("+91");
  const [rawPhone, setRawPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = Phone Number, 2 = OTP Verification
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const getFullPhone = () => {
    return countryCode + rawPhone.trim();
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!rawPhone) {
      showToast("Please enter your phone number", "error");
      return;
    }

    const fullPhone = getFullPhone();
    setIsSendingOtp(true);
    try {
      const data = await api.auth.sendOTP(fullPhone);
      if (data.success) {
        showToast("OTP code sent successfully!");
        setStep(2);
      }
    } catch (err) {
      showToast(err.message || "Failed to send OTP", "error");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      showToast("Please enter the OTP code", "error");
      return;
    }

    setIsVerifying(true);
    try {
      const data = await api.auth.verifyOTP(otp.trim());
      if (data.success) {
        showToast("Logged in successfully!");
        loginUser(data.user);
      }
    } catch (err) {
      showToast(err.message || "Verification failed", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-6 overflow-hidden">
      {/* Background Liquid Bubbles */}
      <div className="bg-liquid-glow">
        <div className="bg-bubble bg-bubble-1"></div>
        <div className="bg-bubble bg-bubble-2"></div>
        <div className="bg-bubble bg-bubble-3"></div>
      </div>

      {/* Main Glass Card */}
      <div className="glass-panel w-full max-w-sm rounded-3xl p-8 flex flex-col gap-6 animate-fade-in-up">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            {step === 1 ? "Your Phone" : "Enter Code"}
          </h2>
          <p className="text-xs text-gray-400 font-medium px-4">
            {step === 1
              ? "Verify your phone number to restore your Telegram session."
              : `We sent a Telegram verification code to ${getFullPhone()}`}
          </p>
        </div>

        {/* STEP 1: Phone input with country code */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div className="flex gap-2 w-full">
              {/* Country Code Select Dropdown */}
              <div className="relative flex-shrink-0 w-24">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={isSendingOtp}
                  className="w-full px-2 py-3.5 rounded-xl glass-input text-xs font-bold text-center appearance-none cursor-pointer bg-stone-900"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Raw Phone Number Input */}
              <input
                type="tel"
                placeholder="Phone number"
                value={rawPhone}
                onChange={(e) => setRawPhone(e.target.value)}
                disabled={isSendingOtp}
                className="flex-grow px-4 py-3.5 rounded-xl glass-input text-sm tracking-wider placeholder:text-gray-500 font-semibold"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C1121F] to-[#780001] hover:from-[#d31c2a] hover:to-[#8c0203] text-white font-semibold text-sm shadow-md active:scale-98 transition-transform duration-100 cursor-pointer flex justify-center items-center"
            >
              {isSendingOtp ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Send OTP Code"
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification input */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Verification Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl glass-input text-sm text-center tracking-widest placeholder:text-gray-500 font-bold"
              maxLength={6}
              required
            />

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C1121F] to-[#780001] hover:from-[#d31c2a] hover:to-[#8c0203] text-white font-semibold text-sm shadow-md active:scale-98 transition-transform duration-100 cursor-pointer flex justify-center items-center"
            >
              Verify OTP
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-red-400 font-medium text-center hover:underline cursor-pointer py-1"
            >
              Edit phone number
            </button>
          </form>
        )}
      </div>

      {/* Fullscreen Blocker Overlay during verification */}
      {isVerifying && (
        <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-black/60 backdrop-blur-md transition-opacity duration-300">
          <div className="glass-panel p-8 rounded-3xl flex flex-col items-center gap-4 text-center max-w-xs scale-in">
            <div className="w-12 h-12 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin"></div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Verifying Telegram Account...</p>
              <p className="text-[10px] text-gray-400">Please wait. Initiating secure MTProto session.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
