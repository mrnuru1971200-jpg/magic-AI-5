/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: number;
  bio?: string;
  avatarUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
  ownerId: string;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string; // Base64 or standard URL
  createdAt: number;
  ownerId: string;
  aspectRatio: string;
}

export interface EditedImage {
  id: string;
  originalUrl: string; // base64
  prompt: string;
  editedUrl: string; // base64
  createdAt: number;
  ownerId: string;
}

export interface RequestLog {
  id: string;
  type: 'chat' | 'generate_image' | 'edit_image';
  timestamp: number;
  prompt: string;
  userEmail: string;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface SystemStats {
  totalChats: number;
  totalImagesGenerated: number;
  totalImagesEdited: number;
  totalUsers: number;
}
