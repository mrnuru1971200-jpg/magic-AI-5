/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

interface RequestLog {
  id: string;
  type: 'chat' | 'generate_image' | 'edit_image';
  timestamp: number;
  prompt: string;
  userEmail: string;
  status: 'success' | 'error';
  errorMessage?: string;
}

// In-memory array to accumulate AI request logs for real-time monitoring in the Admin Panel
const logsMemoryStore: RequestLog[] = [];

// Helper to keep track of mock user registry for Admin control
interface RegisteredUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: number;
  bio?: string;
  status: 'active' | 'suspended';
}

const userMemoryStore: RegisteredUser[] = [
  {
    uid: "admin1",
    email: "m62205108@gmail.com", // From workspace user email metadata
    displayName: "Ultimate Admin",
    role: "admin",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    bio: "Chief AI Systems Architect",
    status: "active"
  },
  {
    uid: "testUser1",
    email: "sarah.connor@magicaiapp.com",
    displayName: "Sarah Connor",
    role: "user",
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
    bio: "Interested in futuristic cityscape generation.",
    status: "active"
  },
  {
    uid: "testUser2",
    email: "john.doe@test.com",
    displayName: "John Doe",
    role: "user",
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    status: "active"
  }
];

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add your credentials in the Secrets panel on AI Studio.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large base64 image streams for prompt-based editing
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // API Route: AI Chat System
  app.post("/api/chat", async (req, res) => {
    const { messages, userEmail } = req.body;
    const trackingEmail = userEmail || "anonymous@magicaiapp.com";

    try {
      const chatHistory = messages || [];
      if (chatHistory.length === 0) {
        return res.status(400).json({ error: "Missing conversation history." });
      }

      const client = getGeminiClient();
      const lastMessage = chatHistory[chatHistory.length - 1];
      const modelPrompt = lastMessage.text;

      // Map chat history elements for Gemini SDK
      const contents = chatHistory.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const result = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: "You are 'Magic AI', an ultra-intelligent, friendly, and fast AI companion designed inside a sleek cellular frame. Maintain a modern, elegant, short and accurate conversational style. Use emojis occasionally for high-fidelity engagement."
        }
      });

      const aiText = result.text || "I was unable to synthesize a proper response.";

      // Log success
      const logEntry: RequestLog = {
        id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        type: 'chat',
        timestamp: Date.now(),
        prompt: modelPrompt.substring(0, 100),
        userEmail: trackingEmail,
        status: 'success'
      };
      logsMemoryStore.push(logEntry);

      res.json({ text: aiText });
    } catch (err: any) {
      console.error("Chat Endpoint Error:", err);
      // Log error
      logsMemoryStore.push({
        id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        type: 'chat',
        timestamp: Date.now(),
        prompt: messages?.[messages.length - 1]?.text?.substring(0, 50) || "Error loading chat prompt",
        userEmail: trackingEmail,
        status: 'error',
        errorMessage: err.message || String(err)
      });

      res.status(500).json({ error: err.message || "An internal error occurred during chat processing." });
    }
  });

  // API Route: AI Image Generator
  app.post("/api/generate-image", async (req, res) => {
    const { prompt, aspectRatio, userEmail } = req.body;
    const trackingEmail = userEmail || "anonymous@magicaiapp.com";

    try {
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required to synthesize images." });
      }

      const client = getGeminiClient();
      const requestAspectRatio = aspectRatio || "1:1";

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: requestAspectRatio
          }
        }
      });

      let foundBase64: string | null = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            foundBase64 = part.inlineData.data;
            break;
          }
        }
      }

      if (!foundBase64) {
        throw new Error("No image data could be parsed from the model candidate frames.");
      }

      // Log success
      logsMemoryStore.push({
        id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        type: 'generate_image',
        timestamp: Date.now(),
        prompt: prompt.substring(0, 100),
        userEmail: trackingEmail,
        status: 'success'
      });

      res.json({ base64: foundBase64, mimeType: "image/png" });
    } catch (err: any) {
      console.error("Generator Endpoint Error:", err);
      logsMemoryStore.push({
        id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        type: 'generate_image',
        timestamp: Date.now(),
        prompt: prompt?.substring(0, 50) || "Empty prompt error",
        userEmail: trackingEmail,
        status: 'error',
        errorMessage: err.message || String(err)
      });

      res.status(500).json({ error: err.message || "Synthesis pipeline failed. Please ensure your Gemini key has visual capability enabled." });
    }
  });

  // API Route: AI Image Editor
  app.post("/api/edit-image", async (req, res) => {
    const { base64Image, prompt, userEmail } = req.body;
    const trackingEmail = userEmail || "anonymous@magicaiapp.com";

    try {
      if (!base64Image) {
        return res.status(400).json({ error: "Original image upload base64 string is required." });
      }
      if (!prompt) {
        return res.status(400).json({ error: "Editing instruction prompt is required." });
      }

      // Clean prefix if exist
      const headerIndex = base64Image.indexOf(";base64,");
      const cleanBase64 = headerIndex !== -1 ? base64Image.substring(headerIndex + 8) : base64Image;

      const client = getGeminiClient();

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: "image/png"
              }
            },
            {
              text: `Please edit this image according to this instruction: "${prompt}". Apply this effect seamlessly, preserving matches where possible, and return ONLY the freshly altered image in base64 format.`
            }
          ]
        }
      });

      let foundBase64: string | null = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            foundBase64 = part.inlineData.data;
            break;
          }
        }
      }

      if (!foundBase64) {
        throw new Error("Target edited canvas could not be parsed from candidate frames. Ensure prompt describes structured imagery.");
      }

      // Log success
      logsMemoryStore.push({
        id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        type: 'edit_image',
        timestamp: Date.now(),
        prompt: prompt.substring(0, 100),
        userEmail: trackingEmail,
        status: 'success'
      });

      res.json({ base64: foundBase64, mimeType: "image/png" });
    } catch (err: any) {
      console.error("Editor Endpoint Error:", err);
      logsMemoryStore.push({
        id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        type: 'edit_image',
        timestamp: Date.now(),
        prompt: prompt?.substring(0, 50) || "Blank prompt edit error",
        userEmail: trackingEmail,
        status: 'error',
        errorMessage: err.message || String(err)
      });

      res.status(500).json({ error: err.message || "Editing procedure failed. Verify base64 dimensions and target instructions." });
    }
  });

  // API Route: Admin monitoring statistics and request logs
  app.get("/api/admin/payload", (req, res) => {
    const stats = {
      totalChats: logsMemoryStore.filter(l => l.type === 'chat').length,
      totalImagesGenerated: logsMemoryStore.filter(l => l.type === 'generate_image').length,
      totalImagesEdited: logsMemoryStore.filter(l => l.type === 'edit_image').length,
      totalUsers: userMemoryStore.length
    };
    res.json({
      stats,
      logs: logsMemoryStore.slice().reverse(), // last logs first
      users: userMemoryStore
    });
  });

  // API Route: Admin delete/suspend user mock controller
  app.post("/api/admin/users/action", (req, res) => {
    const { userId, action } = req.body;
    const userIndex = userMemoryStore.findIndex(u => u.uid === userId);
    if (userIndex !== -1) {
      if (action === 'suspend') {
        userMemoryStore[userIndex].status = userMemoryStore[userIndex].status === 'suspended' ? 'active' : 'suspended';
      } else if (action === 'promote') {
        userMemoryStore[userIndex].role = userMemoryStore[userIndex].role === 'admin' ? 'user' : 'admin';
      } else if (action === 'delete') {
        userMemoryStore.splice(userIndex, 1);
      }
      return res.json({ success: true, users: userMemoryStore });
    }
    res.status(404).json({ error: "User profile index not detected." });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Magic AI Server] Running securely on Node.js container port: http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("FATAL: Failed to launch backend sever container:", error);
});
