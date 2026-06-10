/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { MessageSquare, Image, Sparkles, User, Shield, Moon, Sun, Monitor, Smartphone, Wifi, Battery, LogOut } from "lucide-react";
import { UserProfile } from "./types";
import AuthView from "./components/AuthView";
import ChatView from "./components/ChatView";
import ImageGenView from "./components/ImageGenView";
import ImageEditView from "./components/ImageEditView";
import AdminPanelView from "./components/AdminPanelView";
import ProfileView from "./components/ProfileView";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [currentTime, setCurrentTime] = useState<string>("09:41");

  // Keep simulated mobile status clock accurate to real local/UTC cycles
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hrs = String(now.getUTCHours()).padStart(2, "0");
      const mins = String(now.getUTCMinutes()).padStart(2, "0");
      setCurrentTime(`${hrs}:${mins}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 15000);
    return () => clearInterval(interval);
  }, []);

  // Save/retrieve user session
  useEffect(() => {
    const stored = localStorage.getItem("magic_user_session");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogin = (user: { uid: string; email: string; displayName: string; role: 'admin' | 'user' }) => {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: Date.now(),
      avatarUrl: `https://picsum.photos/seed/${user.email}/150/150`
    };
    setCurrentUser(profile);
    localStorage.setItem("magic_user_session", JSON.stringify(profile));
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setCurrentUser(updated);
    localStorage.setItem("magic_user_session", JSON.stringify(updated));
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem("magic_user_session");
    setActiveTab("chat");
  };

  // Switch HTML root class if needed for Tailwind dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Tab definitions
  const tabs = [
    { id: "chat", label: "AI Chat", icon: MessageSquare },
    { id: "generator", label: "Gen Images", icon: Image },
    { id: "editor", label: "Edit Canvas", icon: Sparkles },
    { id: "profile", label: "Profile", icon: User },
  ];

  // If user is admin, append Admin Panel
  const isAdmin = currentUser?.role === "admin" || currentUser?.email.toLowerCase() === "m62205108@gmail.com";
  const displayedTabs = isAdmin
    ? [...tabs, { id: "admin", label: "Admin", icon: Shield }]
    : tabs;

  return (
    <div className={`min-h-screen w-full flex flex-col justify-center items-center transition-colors duration-300 font-sans p-3 sm:p-6 ${
      isDarkMode ? "bg-[#030712] text-slate-200" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Dynamic top controls (Simulation toggle & Theme Switcher) */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-3.5 px-2 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
          <h1 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Magic Bento Space
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile vs Wide Screen toggle */}
          <button
            id="control-view-mode-toggle"
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
              isDarkMode
                ? 'bg-[#0F172A] hover:bg-slate-800/80 border-slate-800 text-slate-300'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
            }`}
            title={isMobileFrame ? "Switch to Wide Web Layout" : "Switch to Mobile Frame"}
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Desktop Bento Board</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Simulate Mobile Frame</span>
              </>
            )}
          </button>

          {/* Theme switcher */}
          <button
            id="control-theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border transition-all ${
              isDarkMode ? 'bg-[#0F172A] hover:bg-slate-800/80 border-slate-800 text-yellow-400' : 'bg-white hover:bg-slate-50 border-slate-200 text-indigo-600 shadow-sm'
            }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Work Frame (Either simulated mobile mockup or large full-width card) */}
      <div
        id="app-workspace-canvas"
        className={`relative transition-all duration-300 outline-none flex overflow-hidden ${
          isMobileFrame
            ? "w-full max-w-[375px] h-[780px] rounded-[48px] border-[10px] border-slate-900 shadow-2xl shadow-black/90 ring-4 ring-slate-800/40 flex-col bg-[#030712]"
            : "w-full max-w-6xl h-[780px] rounded-[32px] flex-row p-5 gap-5 bg-transparent border-transparent"
        }`}
      >
        {/* Mobile Header elements (Time, speaker notch, battery, status icons) */}
        {isMobileFrame && (
          <div className="h-11 w-full bg-slate-950 text-white flex justify-between items-center px-6 shrink-0 z-20 select-none">
            {/* Clock */}
            <span className="text-[12px] font-bold font-sans tracking-tight">{currentTime} UTC</span>
            {/* Center notch */}
            <div className="absolute top-1 bg-black w-[110px] h-[22px] left-1/2 -translate-x-1/2 rounded-full border border-slate-800/40 flex items-center justify-center">
              {/* Simulated camera lens dot */}
              <div className="w-2.5 h-2.5 bg-indigo-950 rounded-full border border-slate-800 absolute right-4 flex items-center justify-center">
                <div className="w-1 h-1 bg-blue-500 rounded-full" />
              </div>
              {/* Speaker pill */}
              <div className="w-12 h-1 bg-slate-800 rounded-full" />
            </div>
            {/* Status Icons */}
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-slate-350" />
              <Battery className="w-4 h-4 text-slate-300" />
            </div>
          </div>
        )}

        {/* Widescreen LEFT Bento Aside Navigation Sidebar */}
        {!isMobileFrame && currentUser && (
          <aside className={`w-20 flex flex-col items-center py-8 rounded-3xl border justify-between shrink-0 shadow-xl transition-colors ${
            isDarkMode ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col gap-8 items-center w-full">
              {/* App launcher Logo in custom gradient */}
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform cursor-pointer">
                <span className="font-black text-xl text-white">M</span>
              </div>

              {/* Navigation icons aligned precisely */}
              <div className="flex flex-col gap-5 w-full px-2.5">
                {displayedTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      id={`aside-nav-${tab.id}`}
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`p-3.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                        isActive
                          ? isDarkMode
                            ? 'bg-slate-800/60 border-slate-700/60 text-indigo-400'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-650'
                          : isDarkMode
                          ? 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                          : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                      title={tab.label}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile stock preview triggers profile tab or disconnects */}
            <div className="flex flex-col gap-3 items-center">
              <button
                id="aside-signout"
                onClick={handleSignOut}
                className="p-3 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Disconnect Workspace"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div
                onClick={() => setActiveTab("profile")}
                className="w-10 h-10 rounded-full overflow-hidden border border-slate-700/60 hover:ring-2 hover:ring-purple-500 transition-all cursor-pointer shrink-0 bg-slate-800"
              >
                <img
                  src={currentUser.avatarUrl || "https://picsum.photos/seed/avatar1/150/150"}
                  alt={currentUser.displayName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </aside>
        )}

        {/* Dynamic Canvas Container depending on login status */}
        <div
          id="tab-canvas-container"
          className={`flex-1 overflow-hidden relative flex flex-col ${
            !isMobileFrame && currentUser
              ? isDarkMode
                ? 'bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl'
                : 'bg-white border border-slate-200 rounded-3xl shadow-md'
              : ''
          }`}
        >
          {!currentUser ? (
            <AuthView onLoginSuccess={handleLogin} />
          ) : (
            <>
              {/* Screen Header inside active device */}
              <div className={`p-4 px-6 border-b flex justify-between items-center shrink-0 z-10 ${
                isDarkMode ? 'border-slate-800/80 bg-slate-900/50' : 'border-slate-200/80 bg-slate-50/50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-md animate-pulse shrink-0" />
                  <span className="text-xs font-black tracking-wider uppercase text-slate-350 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {activeTab === 'chat' && 'Magic Intelligent Chat'}
                    {activeTab === 'generator' && 'AI Image Canvas Generator'}
                    {activeTab === 'editor' && 'Dynamic Prompt Correction'}
                    {activeTab === 'profile' && 'Magic User Profile'}
                    {activeTab === 'admin' && 'System Admin Controls'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-tight text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/5">
                    {currentUser.role === 'admin' ? 'SYSTEM CORE' : 'MAGIC CLIENT'}
                  </span>
                  <span className="text-[10px] font-semibold opacity-70">
                    {currentUser.displayName.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* Core Feature Tab Panels */}
              <div className="flex-1 overflow-hidden relative">
                {activeTab === "chat" && <ChatView userEmail={currentUser.email} isDarkMode={isDarkMode} />}
                {activeTab === "generator" && <ImageGenView userEmail={currentUser.email} isDarkMode={isDarkMode} />}
                {activeTab === "editor" && <ImageEditView userEmail={currentUser.email} isDarkMode={isDarkMode} />}
                {activeTab === "profile" && (
                  <ProfileView
                    profile={currentUser}
                    onUpdateProfile={handleUpdateProfile}
                    onSignOut={handleSignOut}
                    isDarkMode={isDarkMode}
                  />
                )}
                {activeTab === "admin" && <AdminPanelView isDarkMode={isDarkMode} />}
              </div>

              {/* Bottom Nav Bar - ONLY in mobile frame */}
              {isMobileFrame && (
                <div className={`shrink-0 border-t z-10 flex h-[62px] justify-between items-center px-4 ${
                  isDarkMode ? 'border-slate-800/60 bg-slate-950/80' : 'border-slate-200 bg-white/80'
                } backdrop-blur-md pb-[env(safe-area-inset-bottom)]`}>
                  {displayedTabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        id={`nav-btn-${tab.id}`}
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-all ${
                          isActive
                            ? 'text-indigo-400 font-bold scale-103'
                            : 'text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]' : ''}`} />
                        <span className="text-[9px] mt-1 font-bold tracking-wide uppercase">
                          {tab.id === 'chat' ? 'Chat' : tab.id === 'generator' ? 'Gen' : tab.id === 'editor' ? 'Edit' : tab.id === 'profile' ? 'Profile' : 'Admin'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Widescreen RIGHT Bento Info Sidebar (Matches the Usage Statistics component exactly) */}
        {!isMobileFrame && currentUser && (
          <section className={`w-64 flex flex-col justify-between shrink-0 rounded-3xl border p-5 shadow-xl transition-all ${
            isDarkMode 
              ? 'bg-gradient-to-br from-indigo-900/15 via-[#0F172A] to-purple-900/15 border-indigo-500/15 text-slate-300' 
              : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-indigo-200 text-slate-700 shadow-lg'
          }`}>
            <div className="space-y-6">
              {/* Usage Header */}
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-md shadow-indigo-500/20 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="font-extrabold text-sm tracking-wide text-slate-100 uppercase bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Usage Statistics
                </h2>
              </div>

              {/* Dynamic Telemetry meters */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>Requests Today</span>
                    <span className="text-indigo-400 font-mono">72%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="w-[72%] h-full bg-indigo-500 rounded-full" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>Compute Power</span>
                    <span className="text-purple-400 font-mono">45%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="w-[45%] h-full bg-purple-500 rounded-full" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>Cluster Sync</span>
                    <span className="text-green-400 font-mono">99.8%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="w-[99.8%] h-full bg-green-500 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Active User Stats Bento Card */}
              <div className={`p-4 rounded-2xl border ${
                isDarkMode 
                  ? 'bg-slate-900/40 border-slate-800/80' 
                  : 'bg-white/80 border-slate-250'
              }`}>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1 text-slate-400">
                  <span>Active Workspace</span>
                  <span className="text-green-500 animate-pulse font-mono">ONLINE</span>
                </div>
                <div className="text-2xl font-black text-slate-100 font-mono tracking-tight bg-gradient-to-r from-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  12,840
                </div>
              </div>
            </div>

            {/* Quick action guidelines inside right rail */}
            <div className={`p-4 rounded-2xl border text-[11px] leading-relaxed relative overflow-hidden ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800/60 text-slate-400' 
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="font-extrabold text-[10px] uppercase tracking-wider mb-1 text-indigo-400">
                PROMPT SECRETS
              </div>
              <p>Add words like <span className="font-mono text-purple-450 text-indigo-400 font-bold">"neon"</span>, <span className="font-mono text-purple-450 text-indigo-400 font-bold">"isometric"</span>, or <span className="font-mono text-purple-450 text-indigo-400 font-bold">"photorealistic"</span> to achieve superior synthesis outputs.</p>
            </div>
          </section>
        )}

        {/* Simulated iOS home gesture bar inside mockup footer */}
        {isMobileFrame && (
          <div className="h-5 bg-slate-950 w-full shrink-0 flex items-center justify-center relative select-none">
            <div className="w-[120px] h-1 bg-slate-200 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
