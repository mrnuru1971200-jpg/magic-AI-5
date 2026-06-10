/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Mail, BookOpen, Crown, Check, ShieldCheck, Palette, LogOut, Code } from "lucide-react";
import { UserProfile } from "../types";

const AVATAR_STOCKS = [
  "https://picsum.photos/seed/avatar1/150/150",
  "https://picsum.photos/seed/avatar2/150/150",
  "https://picsum.photos/seed/avatar3/150/150",
  "https://picsum.photos/seed/avatar4/150/150",
];

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onSignOut: () => void;
  isDarkMode: boolean;
}

export default function ProfileView({ profile, onUpdateProfile, onSignOut, isDarkMode }: ProfileViewProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || AVATAR_STOCKS[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      displayName: displayName.trim() || profile.displayName,
      bio: bio.trim(),
      avatarUrl
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div id="profile-tab" className="p-5 space-y-6 h-full overflow-y-auto pb-10 font-sans">
      {/* Profile summary card */}
      <div className={`p-5 rounded-3xl border relative overflow-hidden flex flex-col items-center text-center ${
        isDarkMode
          ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800'
          : 'bg-gradient-to-b from-slate-50 to-white border-slate-200'
      }`}>
        <div className="absolute top-3 right-3">
          <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
            profile.role === 'admin'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-blue-500/20 text-blue-400'
          }`}>
            {profile.role === 'admin' ? (
              <>
                <Crown className="w-3 h-3 text-purple-400" />
                <span>Magic Administrator</span>
              </>
            ) : (
              <>
                <User className="w-3 h-3 text-blue-400" />
                <span>Verified User</span>
              </>
            )}
          </span>
        </div>

        {/* Big Avatar */}
        <div className="relative mt-4">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-550 shadow-xl">
            <img
              src={avatarUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full bg-slate-800 border-2 border-slate-900"
            />
          </div>
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-slate-900 rounded-full animate-pulse" />
        </div>

        <h2 className="text-lg font-extrabold mt-3">{displayName}</h2>
        <span className="text-[11px] font-mono text-slate-400">{profile.email}</span>
        {bio && (
          <p className="text-[11px] text-slate-400 mt-2 max-w-xs leading-relaxed italic">
            "{bio}"
          </p>
        )}
      </div>

      {/* Avatar chooses list */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-purple-500" />
          <span>Select Magic Avatar</span>
        </label>
        <div className="flex gap-2.5 justify-center">
          {AVATAR_STOCKS.map((stock, idx) => {
            const isSel = avatarUrl === stock;
            return (
              <div
                key={idx}
                onClick={() => setAvatarUrl(stock)}
                className={`w-12 h-12 rounded-xl p-0.5 cursor-pointer transition-all hover:scale-105 border ${
                  isSel ? 'border-purple-500 scale-102 bg-purple-500/20 shadow-md shadow-purple-500/20' : 'border-transparent'
                }`}
              >
                <img
                  src={stock}
                  alt={`Stock ${idx}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-lg border border-slate-800"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            ✏️ Display Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              id="profile-displayName-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`w-full py-3 pl-11 pr-4 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-100'
                  : 'bg-slate-50 border-slate-200 text-slate-850'
              }`}
              required
            />
          </div>
        </div>

        <div>
          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            📝 User Bio
          </label>
          <div className="relative">
            <BookOpen className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <textarea
              id="profile-bio-textarea"
              placeholder="Tell other magic users about your prompt discoveries..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={`w-full py-3 pl-11 pr-4 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-purple-500 h-20 resize-none ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-850 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        <button
          id="profile-save-btn"
          type="submit"
          className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-650 hover:opacity-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 cursor-pointer active:scale-98 transition-all"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400">Profile Updated Successfully!</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>

        {/* Sign out */}
        <button
          id="profile-signout-btn"
          type="button"
          onClick={onSignOut}
          className="w-full py-3 bg-red-950/20 border border-red-500/20 hover:bg-red-950/50 text-red-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Disconnect Session</span>
        </button>
      </form>

      {/* Info segment */}
      <div className={`p-4 rounded-2xl text-[10px] flex gap-2 items-center leading-relaxed ${
        isDarkMode ? 'bg-slate-900/60 text-slate-450 border border-slate-800/60' : 'bg-slate-50 text-slate-500 border border-slate-100'
      }`}>
        <Code className="w-4 h-4 text-purple-400 shrink-0" />
        <span>Connected secure workspace frame with Gemini node endpoints. All diagnostic operations strictly adhere to private policies.</span>
      </div>
    </div>
  );
}
