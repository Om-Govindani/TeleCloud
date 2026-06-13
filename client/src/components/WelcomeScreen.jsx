import React from "react";

const WelcomeScreen = ({ onGetStarted }) => {
  return (
    <div className="relative min-h-screen flex flex-col justify-between items-center p-6 text-center select-none overflow-hidden">
      {/* Background Liquid Bubbles */}
      <div className="bg-liquid-glow">
        <div className="bg-bubble bg-bubble-1"></div>
        <div className="bg-bubble bg-bubble-2"></div>
        <div className="bg-bubble bg-bubble-3"></div>
      </div>

      {/* Top spacing */}
      <div></div>

      {/* Logo & Tagline Card */}
      <div className="glass-panel w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-6 transform transition-all duration-700 animate-fade-in-up">
        {/* Animated Glass Logo */}
        <div className="relative w-24 h-24 rounded-2xl glass-panel flex items-center justify-center shadow-lg border border-white/10 shadow-[#C1121F]/10">
          <img
            src="/logo.png"
            alt="TeleCloud Logo"
            className="w-16 h-16 object-contain animate-pulse"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            TeleCloud
          </h1>
          <p className="text-sm text-gray-400 font-medium px-4">
            Telegram-powered liquid glass cloud storage. Turn private channels into files and folders.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="w-full space-y-3 pt-2">
          <div className="flex items-center gap-3 text-left bg-white/2 p-3 rounded-xl border border-white/5">
            <div className="p-2 rounded-lg bg-[#C1121F]/10 text-[#C1121F]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-200">Unlimited Storage</p>
              <p className="text-[10px] text-gray-400">Powered by private Telegram channels.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-left bg-white/2 p-3 rounded-xl border border-white/5">
            <div className="p-2 rounded-lg bg-[#780001]/20 text-[#C1121F]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-200">Instant Collaboration</p>
              <p className="text-[10px] text-gray-400">Share folders dynamically with other users.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Button wrapper */}
      <div className="w-full max-w-sm pb-8">
        <button
          onClick={onGetStarted}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C1121F] to-[#780001] hover:from-[#d11a27] hover:to-[#8c0001] text-white font-semibold text-base shadow-lg shadow-[#C1121F]/20 active:scale-95 transition-transform duration-150 cursor-pointer"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
