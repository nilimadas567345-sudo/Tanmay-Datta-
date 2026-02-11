
import { AppMode, OfflineModel } from '../types';

export const OFFLINE_MODELS: OfflineModel[] = [
  // Specific User Requested Model
  {
    id: 'gemma-3-27b-it',
    name: 'Gemma 3 27B IT',
    description: "Google's newest state-of-the-art open model. High performance reasoning and creative capabilities for desktop-class edge AI.",
    category: AppMode.Task,
    size: '15.5GB',
    version: 'v3.0',
    compatibility: '24GB+ VRAM / 32GB+ RAM',
    isRecommended: true,
    hfRepo: 'google/gemma-3-27b-it',
    tags: ['Next-Gen', 'Reasoning', 'Google', '27B']
  },
  {
    id: 'gemma-3-4b-it',
    name: 'Gemma 3 4B IT',
    description: "Efficient version of Gemma 3 optimized for mobile and laptop hardware without compromising on logical consistency.",
    category: AppMode.Chat,
    size: '2.8GB',
    version: 'v3.0',
    compatibility: '8GB+ RAM',
    hfRepo: 'google/gemma-3-4b-it',
    tags: ['Efficient', 'Mobile', 'Google', '4B']
  },
  {
    id: 'gemma-2-2b-it',
    name: 'Gemma 2 2B IT',
    description: "Lightweight, instruction-tuned model. Excellent for low-latency chat and summarization tasks.",
    category: AppMode.Chat,
    size: '1.6GB',
    version: 'v2.0',
    compatibility: '4GB+ RAM',
    hfRepo: 'google/gemma-2-2b-it',
    downloads: '1.2M',
    stars: '45k',
    tags: ['NLP', 'Fast', 'Google']
  },
  {
    id: 'phi-3.5-mini',
    name: 'Phi-3.5 Mini',
    description: 'Microsoft’s small language model with high reasoning power, now with expanded context windows.',
    category: AppMode.Task,
    size: '2.3GB',
    version: 'v3.5',
    compatibility: '4GB+ RAM',
    hfRepo: 'microsoft/Phi-3.5-mini-instruct',
    tags: ['Logic', 'Microsoft', 'Small']
  },
  {
    id: 'whisper-large-v3-turbo',
    name: 'Whisper Large v3 Turbo',
    description: 'The fastest high-accuracy speech-to-text model available for local audio processing.',
    category: AppMode.Audio,
    size: '1.5GB',
    version: 'v3.0',
    compatibility: 'GPU Recommended',
    isRecommended: true,
    hfRepo: 'openai/whisper-large-v3-turbo',
    tags: ['Audio', 'SOTA', 'OpenAI']
  },
  {
    id: 'stable-diffusion-3-medium',
    name: 'SD 3 Medium',
    description: 'The latest generation of Stable Diffusion for high-fidelity local image generation.',
    category: AppMode.ImageGen,
    size: '4.2GB',
    version: 'v3.0',
    compatibility: '8GB+ VRAM',
    hfRepo: 'stabilityai/stable-diffusion-3-medium',
    tags: ['Creative', 'Image Gen', 'Stability']
  }
];
