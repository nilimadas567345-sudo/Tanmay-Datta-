
import { AppMode, OfflineModel } from '../types';

export const OFFLINE_MODELS: OfflineModel[] = [
  // Text & Language Models
  {
    id: 'gemini-2.5-flash-lite-offline',
    name: 'Gemini 2.5 Flash Lite',
    description: "Google's efficient, low-latency model optimized for on-device performance.",
    category: AppMode.Chat,
    size: '250MB',
    version: '1.0',
    compatibility: 'Android 11+',
    isRecommended: true,
  },
  {
    id: 'minigpt-1',
    name: 'MiniGPT',
    description: 'A compact and efficient language model for chat, writing, and summarization.',
    category: AppMode.Chat,
    size: '80MB',
    version: '1.2.0',
    compatibility: 'Android 8.1+',
  },
  {
    id: 'tinychat-1',
    name: 'TinyLLM',
    description: 'Ultra-lightweight model for basic Q&A and chat on older devices.',
    category: AppMode.Chat,
    size: '45MB',
    version: '1.0.1',
    compatibility: 'Android 8.1+',
  },
  // Image Generation
  {
    id: 'nanobanana-1',
    name: 'Nano-Banana',
    description: 'Fast, creative image generation from text prompts. Optimized for mobile.',
    category: AppMode.ImageGen,
    size: '120MB',
    version: '2.0.0',
    compatibility: 'Android 9+',
    isRecommended: true,
  },
  {
    id: 'tinydoodle-1',
    name: 'TinyDoodle',
    description: 'A small model for generating simple, artistic, and abstract images.',
    category: AppMode.ImageGen,
    size: '65MB',
    version: '1.1.0',
    compatibility: 'Android 8.1+',
  },
  // Image Analysis
  {
    id: 'mobileyolo-1',
    name: 'MobileYOLO',
    description: 'Real-time object detection and image analysis. Identify objects in photos.',
    category: AppMode.ImageAnalysis,
    size: '95MB',
    version: '3.1.0',
    compatibility: 'Android 9+',
    isRecommended: true,
  },
  {
    id: 'fastocr-1',
    name: 'FastOCR',
    description: 'Efficiently extract text from images and documents.',
    category: AppMode.ImageAnalysis,
    size: '50MB',
    version: '2.5.0',
    compatibility: 'Android 8.1+',
  },
  // Audio & Voice
  {
    id: 'whisper-tiny-1',
    name: 'Whisper Tiny',
    description: 'High-accuracy voice-to-text transcription. Great for notes and commands.',
    category: AppMode.Audio,
    size: '70MB',
    version: '1.8.0',
    compatibility: 'Android 9+',
    isRecommended: true,
  },
  {
    id: 'picotts-1',
    name: 'PicoTTS',
    description: 'A lightweight text-to-speech engine with a natural-sounding voice.',
    category: AppMode.Audio,
    size: '40MB',
    version: '1.2.0',
    compatibility: 'Android 8.1+',
  },
  // Utility AI
  {
      id: 'taskmini-1',
      name: 'TaskMini',
      description: 'A suite of utility tools including a summarizer and translator.',
      category: 'Utility',
      size: '110MB',
      version: '1.0.0',
      compatibility: 'Android 8.1+',
  },
  // Creative Tools
  {
      id: 'mememini-1',
      name: 'MemeMini',
      description: 'Generate memes from text and images with this creative tool.',
      category: 'Creative',
      size: '60MB',
      version: '1.0.0',
      compatibility: 'Android 8.1+',
  }
];
