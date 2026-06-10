/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Mail, Lock, User, LogIn, ArrowRight } from "lucide-react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

interface AuthViewProps {
  onLoginSuccess: (user: { uid: string; email: string; displayName: string; role: 'admin' | 'user' }) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all requested fields.");
      setLoading(false);
      return;
    }

    try {
      if (auth) {
        if (isSignUp) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          // Determine mock admin role for specific email addresses
          const role = email.toLowerCase() === "m62205108@gmail.com" ? "admin" : "user";
          onLoginSuccess({
            uid: user.uid,
            email: user.email || email,
            displayName: username || email.split("@")[0],
            role,
          });
        } else {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          const role = email.toLowerCase() === "m62205108@gmail.com" ? "admin" : "user";
          onLoginSuccess({
            uid: user.uid,
            email: user.email || email,
            displayName: user.displayName || email.split("@")[0],
            role,
          });
        }
      } else {
        // Fallback local mock mode if firebase is offline
        console.warn("Using offline fallback Authentication mode.");
        const role = email.toLowerCase() === "m62205108@gmail.com" ? "admin" : "user";
        onLoginSuccess({
          uid: "mock_" + Date.now(),
          email,
          displayName: username || email.split("@")[0],
          role,
        });
      }
    } catch (err: any) {
      console.error("Auth Failure:", err);
      // Fallback fallback if firebase auth isn't enabled for email
      if (err.code === "auth/operation-not-allowed") {
        setError("Email/Password is not yet activated on Firebase console. Directing you with Offline mode bypass...");
        setTimeout(() => {
          onLoginSuccess({
            uid: "mock_" + Date.now(),
            email,
            displayName: username || email.split("@")[0],
            role: email.toLowerCase() === "m62205108@gmail.com" ? "admin" : "user"
          });
        }, 1500);
      } else {
        setError(err.message || "An error occurred during authentication.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDemoUser = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setEmail("m62205108@gmail.com");
      setPassword("admin123");
      setUsername("Magic Admin");
    } else {
      setEmail("sarah.connor@magicaiapp.com");
      setPassword("sarah123");
      setUsername("Sarah Connor");
    }
  };

  return (
    <div id="auth-container" className="flex flex-col justify-between h-full bg-slate-900 text-white p-6 relative overflow-hidden font-sans">
      {/* Background Neon Blur Nodes */}
      <div className="absolute top-[-100px] left-[-100px] w-64 h-64 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-72 h-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

      {/* Hero Welcome */}
      <div className="text-center mt-8 z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 mb-4 shadow-lg shadow-purple-500/35">
          <Sparkles className="w-7 h-7 text-white animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-200 to-blue-400 bg-clip-text text-transparent">
          Magic AI
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
          The ultimate intelligent companion for instant chats, high-fidelity images, and pro editing.
        </p>
      </div>

      {/* Main Login / Signup Form Card */}
      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-xl shadow-black/40 z-10 my-4">
        <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
          {isSignUp ? "Create Magic Account" : "Welcome Back"}
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleAction} className="space-y-4">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                id="auth-username-input"
                type="text"
                placeholder="Full Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              id="auth-email-input"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              id="auth-password-input"
              type="password"
              placeholder="Secret Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              required
            />
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isSignUp ? "Register Account" : "Access Console"}
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            id="auth-toggle-mode-btn"
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            {isSignUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>

      {/* Demo Account Credentials Quick Fill (Aesthetic and Highly Professional) */}
      <div className="z-10 p-4 bg-slate-800/40 border border-slate-700/30 rounded-2xl mb-4 backdrop-blur-md">
        <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-2 text-center">
          ⚡ Quick Sandbox Accounts
        </p>
        <div className="flex gap-2 justify-center">
          <button
            id="demo-admin-btn"
            onClick={() => loadDemoUser('admin')}
            className="px-3 py-1.5 bg-purple-950/40 border border-purple-500/30 rounded-lg text-[10px] text-purple-300 hover:bg-purple-900/40 font-mono transition-all"
          >
            Admin Profile
          </button>
          <button
            id="demo-user-btn"
            onClick={() => loadDemoUser('user')}
            className="px-3 py-1.5 bg-blue-950/40 border border-blue-500/30 rounded-lg text-[10px] text-blue-300 hover:bg-blue-900/40 font-mono transition-all"
          >
            User Profile
          </button>
        </div>
      </div>
    </div>
  );
}
