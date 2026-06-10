/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Upload, Download, ArrowRight, Eye, RefreshCw, AlertCircle, Sparkle, Undo } from "lucide-react";
import { EditedImage } from "../types";

// Beautiful starter demo images so users can test image edits instantly
const PRESET_SOURCE_IMAGES = [
  {
    name: "Golden Retriever",
    url: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400",
    id: "dog"
  },
  {
    name: "Futuristic Car",
    url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=400",
    id: "car"
  },
  {
    name: "Ancient Castle",
    url: "https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&q=80&w=400",
    id: "castle"
  }
];

interface ImageEditViewProps {
  userEmail: string;
  isDarkMode: boolean;
}

export default function ImageEditView({ userEmail, isDarkMode }: ImageEditViewProps) {
  const [sourceImage, setSourceImage] = useState<string>("");
  const [editingPrompt, setEditingPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [editedHistory, setEditedHistory] = useState<EditedImage[]>([]);

  // Load custom editor history
  useEffect(() => {
    const cached = localStorage.getItem(`magic_edits_${userEmail}`);
    if (cached) {
      try {
        setEditedHistory(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse edits cache.", e);
      }
    }
  }, [userEmail]);

  // Set default sample image
  useEffect(() => {
    if (!sourceImage) {
      // Pick first preset
      convertUrlToBase64(PRESET_SOURCE_IMAGES[0].url);
    }
  }, [sourceImage]);

  // Function to download image URL to base64 so we can edit it via Gemini
  const convertUrlToBase64 = async (url: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setLoading(false);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.warn("Failed to convert preset url to base64, using fallback placeholder URL", e);
      // Fallback dataURL
      setSourceImage(url);
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMsg("Selected image exceeds 8MB storage limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setEditedImage(null); // Clear previous edit
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceImage) {
      setErrorMsg("Please select or upload a baseline canvas.");
      return;
    }
    if (!editingPrompt.trim()) {
      setErrorMsg("Please type an instruction prompt.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image: sourceImage,
          prompt: editingPrompt.trim(),
          userEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "The editing pipeline returned an error.");
      }

      const data = await response.json();
      const resultingUrl = `data:${data.mimeType};base64,${data.base64}`;
      setEditedImage(resultingUrl);

      // Save to history list
      const editRecord: EditedImage = {
        id: "edit_" + Date.now(),
        originalUrl: sourceImage,
        prompt: editingPrompt.trim(),
        editedUrl: resultingUrl,
        createdAt: Date.now(),
        ownerId: userEmail
      };

      const updatedHistory = [editRecord, ...editedHistory];
      setEditedHistory(updatedHistory);
      localStorage.setItem(`magic_edits_${userEmail}`, JSON.stringify(updatedHistory));

    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Editing procedure timeout. Try a simpler image size.");
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (imageUrl: string) => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `magic-ai-edit-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const loadPastEdit = (past: EditedImage) => {
    setSourceImage(past.originalUrl);
    setEditedImage(past.editedUrl);
    setEditingPrompt(past.prompt);
  };

  const suggestions = [
    "make it a digital cartoon illustration style",
    "add cyberpunk neon glow and lasers",
    "turn the background into an epic snowy mountain peak",
    "apply a warm realistic oil painting effect"
  ];

  return (
    <div id="image-edit-tab" className="flex flex-col h-full bg-transparent overflow-y-auto pb-8 scrollbar-thin">
      {/* Upload & Preset Source selectors */}
      <div className={`p-5 border-b ${isDarkMode ? 'border-slate-800 bg-[#0F172A]' : 'border-slate-200 bg-white'} space-y-4`}>
        <div className="flex justify-between items-center">
          <label className={`block text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            📸 Baseline Source Canvas
          </label>
          <div className="relative">
            <input
              id="file-canvas-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-canvas-upload"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold cursor-pointer transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom</span>
            </label>
          </div>
        </div>

        {/* Preset quick buttons */}
        <div className="flex gap-2 items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Presets:</span>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {PRESET_SOURCE_IMAGES.map((preset) => (
              <button
                id={`preset-${preset.id}`}
                key={preset.id}
                onClick={() => convertUrlToBase64(preset.url)}
                className={`px-3 py-1.5 text-[10px] rounded-xl border font-bold transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Main Canvas Before / After visual display */}
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {/* BEFORE CARD */}
          <div className={`rounded-3xl border overflow-hidden relative group aspect-[4/3] flex flex-col justify-between ${
            isDarkMode ? 'border-slate-800 bg-[#0F172A]' : 'border-slate-200 bg-slate-100'
          }`}>
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black text-white tracking-wider uppercase flex items-center gap-1">
              <span>Original</span>
            </div>
            {sourceImage ? (
              <img
                src={sourceImage}
                alt="Original Source"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-450 font-bold">
                Loading Source Canvas...
              </div>
            )}
          </div>

          {/* AFTER CARD */}
          <div className={`rounded-3xl border overflow-hidden relative aspect-[4/3] flex items-center justify-center ${
            isDarkMode ? 'border-slate-800 bg-[#0F172A]' : 'border-slate-200 bg-slate-100'
          }`}>
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-[9px] font-black text-white tracking-wider uppercase flex items-center gap-1">
              <span>Edited AI Magic</span>
            </div>
            {editedImage ? (
              <img
                src={editedImage}
                alt="AI Edited Output"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <Sparkle className="w-6 h-6 text-indigo-400 mx-auto animate-spin" />
                <span className="text-[10px] text-slate-500 mt-2 block font-bold">
                  Waiting for prompts...
                </span>
              </div>
            )}

            {editedImage && (
              <button
                id="btn-dl-edited"
                onClick={() => triggerDownload(editedImage)}
                className="absolute bottom-3 right-3 p-2 bg-[#4F46E5] hover:opacity-95 text-white rounded-xl shadow-md transition-all cursor-pointer"
                title="Download Artwork"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Editing Prompt input box */}
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              📝 Smart Correction Prompts
            </label>
            <div className="flex gap-2">
              <input
                id="edit-prompt-input"
                type="text"
                placeholder="e.g. Turn the dog into a cartoon, add neon party laser beams..."
                value={editingPrompt}
                onChange={(e) => setEditingPrompt(e.target.value)}
                className={`flex-1 py-3 px-4 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
                required
              />
              <button
                id="edit-submit-btn"
                type="submit"
                disabled={loading || !editingPrompt.trim() || !sourceImage}
                className="py-3 px-5 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:opacity-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shrink-0 disabled:opacity-40 cursor-pointer transition-all hover:scale-99 active:scale-98"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 animate-pulse" />}
                <span>Apply Magic</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-300 text-xs flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick presets suggestions */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              💡 Spark Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((sug, idx) => (
                <button
                  id={`sug-${idx}`}
                  key={idx}
                  type="button"
                  onClick={() => setEditingPrompt(sug)}
                  className={`text-[10px] py-1.5 px-3 rounded-xl border text-left transition-colors cursor-pointer font-semibold ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-800 hover:bg-[#1E293B] text-slate-400 hover:text-white'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 shadow-sm'
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* History slider */}
        {editedHistory.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              🕒 Past Magic Corrections
            </h4>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {editedHistory.map((past) => (
                <div
                  key={past.id}
                  onClick={() => loadPastEdit(past)}
                  className={`flex-shrink-0 w-24 rounded-2xl overflow-hidden border cursor-pointer hover:border-indigo-500 transition-colors p-1.5 ${
                    isDarkMode ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <img
                    src={past.editedUrl}
                    alt={past.prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-16 object-cover rounded-xl"
                  />
                  <p className="text-[9px] text-slate-400 truncate mt-1 text-center font-bold px-0.5">
                    {past.prompt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
