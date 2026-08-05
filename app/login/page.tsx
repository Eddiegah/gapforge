"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, Github, Mail, Lock } from "lucide-react";
import Link from "next/link";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOAuth = async (provider: "github" | "google") => {
    setLoading(true);
    await signIn(provider, { callbackUrl: "/dashboard" });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    // Email/password auth not wired — providers only
  };

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[rgb(var(--bg))]">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ x: [0, 60, -30, 0], y: [0, -80, 40, 0], scale: [1, 1.15, 0.9, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-[15%] w-[500px] h-[500px] rounded-full bg-violet-700/25 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -70, 40, 0], y: [0, 50, -60, 0], scale: [1, 0.85, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute bottom-10 right-[10%] w-[400px] h-[400px] rounded-full bg-violet-500/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 60, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 10 }}
          className="absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full bg-amber-500/10 blur-3xl"
        />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="card p-8 shadow-2xl shadow-black/30 backdrop-blur-sm bg-[rgb(var(--card))]/95">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 mb-4 shadow-lg shadow-violet-900/40">
              <Zap size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] mb-1">GapForge</h1>
            <p className="text-sm text-[rgb(var(--muted))]">
              {isSignup ? "Create your account to discover research gaps" : "Sign in to discover research gaps"}
            </p>
          </div>

          {/* Mode toggle hint */}
          <p className="text-center text-sm text-[rgb(var(--muted))] mb-6">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  Create your account
                </button>
              </>
            )}
          </p>

          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-medium py-2.5 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-60 text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleOAuth("github")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[#24292f] text-white font-medium py-2.5 px-4 rounded-lg border border-[#30363d] hover:bg-[#2d333b] transition-colors disabled:opacity-60 text-sm"
            >
              <Github size={18} />
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[rgb(var(--border))]" />
            <span className="text-xs text-[rgb(var(--muted))]">or continue with email</span>
            <div className="flex-1 h-px bg-[rgb(var(--border))]" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmail} className="space-y-4">
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="input pl-10"
                aria-label="Email address"
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input pl-10 pr-10"
                aria-label="Password"
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {!isSignup && (
              <div className="text-right">
                <Link href="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 transition-all tracking-wide"
            >
              {isSignup ? "SIGN UP" : "SIGN IN"}
            </button>
          </form>

          <p className="text-center text-xs text-[rgb(var(--muted))] mt-6">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="hover:text-[rgb(var(--fg))] underline">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="hover:text-[rgb(var(--fg))] underline">Privacy Policy</Link>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
