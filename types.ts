
export enum Sender {
  User = 'user',
  AI = 'ai',
}

export enum MessageType {
  Text = 'text',
  Image = 'image',
  Error = 'error',
  Loading = 'loading',
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  type: MessageType;
  text: string;
  timestamp: string;
  imageUrl?: string;
  citations?: { uri: string; title: string }[];
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: string;
}

export enum AppMode {
  Chat = 'Chat',
  Search = 'Search',
  ImageGen = 'Image Generation',
  ImageAnalysis = 'Image Analysis',
  Audio = 'Audio',
  Task = 'Task & Productivity',
}

export interface OfflineModel {
  id: string;
  name: string;
  description: string;
  category: AppMode | 'Utility' | 'Creative';
  size: string;
  version: string;
  compatibility: string;
  isRecommended?: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  forceOffline: boolean;
}