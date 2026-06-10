/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Download, Share2, ZoomIn, Grid, Image, AlertCircle, Trash2, Check } from "lucide-react";
import { GeneratedImage } from "../types";

interface ImageGenViewProps {
  userEmail: string;
  isDarkMode: boolean;
}

export default function ImageGenView({ userEmail, isDarkMode }: ImageGenViewProps) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [stylePreset, setStylePreset] = useState("photorealistic");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Load custom gallery
  useEffect(() => {
    const cached = localStorage.getItem(`magic_images_${userEmail}`);
    if (cached) {
      try {
        setGallery(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse image cache.", e);
      }
    } else {
      // Bootstrapped sample galleries to prevent empty screen on first view
      const demoImages: GeneratedImage[] = [
        {
          id: "demo_1",
          prompt: "A beautiful futuristic cyberpunk metropolis floating above purple clouds, 3D render",
          imageUrl: "https://picsum.photos/seed/cybermetro/600/600",
          createdAt: Date.now() - 1000 * 60 * 60 * 24,
          ownerId: userEmail,
          aspectRatio: "1:1"
        },
        {
          id: "demo_2",
          prompt: "A neon colored holographic avatar of an astronaut floating in deep dark space, futuristic",
          imageUrl: "https://picsum.photos/seed/astronaut/600/600",
          createdAt: Date.now() - 1000 * 60 * 60 * 12,
          ownerId: userEmail,
          aspectRatio: "1:1"
        }
      ];
      setGallery(demoImages);
    }
  }, [userEmail]);

  const saveGallery = (newGallery: GeneratedImage[]) => {
    setGallery(newGallery);
    localStorage.setItem(`magic_images_${userEmail}`, JSON.stringify(newGallery));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    const fullPrompt = stylePreset ? `${prompt.trim()}, ${stylePreset}` : prompt.trim();

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          aspectRatio,
          userEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "The image synthesis engine returned an error.");
      }

      const data = await response.json();
      const newImg: GeneratedImage = {
        id: "img_" + Date.now(),
        prompt: fullPrompt,
        imageUrl: `data:${data.mimeType};base64,${data.base64}`,
        createdAt: Date.now(),
        ownerId: userEmail,
        aspectRatio
      };

      const updated = [newImg, ...gallery];
      saveGallery(updated);
      setPrompt("");
      setSelectedImage(newImg); // Automatically review generated masterpiece
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Synthesis cluster timeout. Ensure Gemini capabilities are provisioned.");
    } finally {
      setLoading(false);
    }
  };

  const deleteGeneratedImage = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = gallery.filter(g => g.id !== idToDelete);
    saveGallery(updated);
    if (selectedImage?.id === idToDelete) {
      setSelectedImage(null);
    }
  };

  // Simulated download
  const downloadImage = (img: GeneratedImage) => {
    const a = document.createElement("a");
    a.href = img.imageUrl;
    a.download = `magic-ai-${img.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Share option: Copies base64/url to clipboard or calls native share
  const shareImage = (img: GeneratedImage) => {
    try {
      if (navigator.share) {
        navigator.share({
          title: "Magic AI Artwork",
          text: `Check out my generated AI artwork: "${img.prompt}"`,
          url: window.location.href
        }).catch(err => console.log("Share canceled", err));
      } else {
        navigator.clipboard.writeText(img.imageUrl);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const styleChips = [
    { label: "Photorealistic", value: "photorealistic, cinematic lighting, 8k" },
    { label: "Anime / Cartoon", value: "anime key visual style, highly detailed illustration, 2d, colorful" },
    { label: "Cyberpunk Glow", value: "neon futuristic cyberpunk aesthetic, glowing dark city vibe, digital concept art" },
    { label: "Isometric 3D", value: "cute isometric 3D render, minimalist, clay style, vibrant color background" },
    { label: "Vintage Ink", value: "vintage copperplate etching, line art engraving, black and white sketch" }
  ];

  return (
    <div id="image-gen-tab" className="flex flex-col h-full bg-transparent overflow-y-auto pb-8 scrollbar-thin">
      {/* Input prompt settings */}
      <div className={`p-5 border-b ${isDarkMode ? 'border-slate-800 bg-[#0F172A]' : 'border-slate-200 bg-white'}`}>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              🎨 Synthesis Prompt
            </label>
            <textarea
              id="img-prompt-textarea"
              placeholder="e.g., A crystal sphere sitting on a velvet table reflecting a mystical forest, fantasy style..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className={`w-full py-3 px-4 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-20 ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-450'
              }`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                📐 Aspect Ratio
              </label>
              <select
                id="img-aspect-select"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 text-slate-200 focus:ring-1 focus:ring-indigo-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="1:1">1:1 (Avatar)</option>
                <option value="16:9">16:9 (Landscape Banner)</option>
                <option value="9:16">9:16 (Mobile Portrait)</option>
                <option value="4:3">4:3 (Card Feature)</option>
              </select>
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                🌟 Style Filter
              </label>
              <select
                id="img-preset-select"
                value={stylePreset}
                onChange={(e) => setStylePreset(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 text-slate-200 focus:ring-1 focus:ring-indigo-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {styleChips.map((preset, idx) => (
                  <option key={idx} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-300 text-xs flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            id="img-generate-submit-btn"
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:opacity-95 text-white active:scale-99 transition-all disabled:opacity-40 select-none cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>AI is writing pixels... (~5s)</span>
              </>
            ) : (
              <>
                <span>Synthesize Artwork</span>
                <Sparkles className="w-4 h-4 animate-pulse" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Gallery workspace */}
      <div className="p-5 space-y-4">
        <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <Grid className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>Altered Canvas Gallery</span>
        </h3>

        {gallery.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <Image className="w-8 h-8 opacity-40 animate-bounce" />
            <span>Empty studio. Frame your first artwork above!</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {gallery.map(img => {
              return (
                <div
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer border aspect-square shadow-md transition-all hover:scale-[1.02] hover:shadow-indigo-500/10 ${
                    isDarkMode ? 'border-slate-805 bg-slate-900/40' : 'border-slate-200 bg-white'
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                    <p className="text-[9px] text-white font-semibold line-clamp-2 leading-snug">
                      {img.prompt}
                    </p>
                    <div className="flex gap-1.5 mt-1 text-slate-350">
                      <button
                        id={`btn-dl-thumb-${img.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(img);
                        }}
                        className="p-1 rounded bg-black/40 hover:bg-[#4F46E5] text-white transition-colors"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        id={`btn-del-thumb-${img.id}`}
                        onClick={(e) => deleteGeneratedImage(img.id, e)}
                        className="p-1 rounded bg-black/40 hover:bg-red-650 text-red-400 ml-auto transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-Screen Masterpiece Inspection Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col justify-between p-4 font-sans">
          {/* Modal Header */}
          <div className="flex justify-between items-center text-white p-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
              <span className="text-xs font-black tracking-wider uppercase text-slate-300">Masterpiece Review</span>
            </div>
            <button
              id="btn-close-modal"
              onClick={() => setSelectedImage(null)}
              className="px-4.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Exit Review
            </button>
          </div>

          {/* Centered Image display */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative max-w-full max-h-[60vh] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-indigo-500/5">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.prompt}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[60vh] object-contain mx-auto"
              />
            </div>
          </div>

          {/* Modal Footer Control Tray */}
          <div className="p-4.5 bg-[#0F172A] border border-slate-800 rounded-3xl space-y-3.5 max-w-lg mx-auto w-full">
            <p className="text-slate-300 text-[11px] text-center font-semibold leading-relaxed px-2 select-all">
              "{selectedImage.prompt}"
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                id="modal-download-btn"
                onClick={() => downloadImage(selectedImage)}
                className="py-3 bg-[#4F46E5] hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Artwork</span>
              </button>

              <button
                id="modal-share-btn"
                onClick={() => shareImage(selectedImage)}
                className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {shareSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-green-400 animate-pulse" />
                    <span className="text-green-400">Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-indigo-400" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
