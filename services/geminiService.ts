
import { GoogleGenAI, Modality, GenerateContentResponse, GroundingChunk } from "@google/genai";
import { ChatMessage, MessageType, Sender, AppMode } from '../types';

// Constants
export const STARTUP_MESSAGE: ChatMessage = {
  id: 'start-1',
  sender: Sender.AI,
  type: MessageType.Text,
  text: 'Friday is online and ready. Select a mode or ask me anything!',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

// Models Configuration
const MODEL_TEXT_FAST = 'gemini-flash-lite-latest'; // Low latency for Chat/Audio
const MODEL_TEXT_THINKING = 'gemini-3-pro-preview'; // High reasoning for Task
const MODEL_SEARCH = 'gemini-2.5-flash'; // Search Grounding
const MODEL_VISION = 'gemini-2.5-flash'; // Image Analysis
const MODEL_IMAGE_GEN = 'gemini-2.5-flash-image'; // Nano Banana for Gen & Edit

// Utility Functions
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });

export const getMimeType = (file: File): string => {
    return file.type;
};


// Gemini Service
let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
}

export const GeminiService = {
  generateChatResponse: async (prompt: string, mode: AppMode): Promise<string> => {
    if (!ai) throw new Error("Gemini AI not initialized.");

    // Thinking Mode for Task & Productivity
    if (mode === AppMode.Task) {
        const response = await ai.models.generateContent({
            model: MODEL_TEXT_THINKING,
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }, // Max thinking budget
            }
        });
        return response.text || "I thought about it, but couldn't generate a response.";
    }

    // Fast Mode for Chat, Audio
    const response = await ai.models.generateContent({
      model: MODEL_TEXT_FAST,
      contents: prompt,
    });
    return response.text || "";
  },

  generateSearchResponse: async (prompt: string): Promise<{ text: string; citations: { uri: string; title: string }[] }> => {
    if (!ai) throw new Error("Gemini AI not initialized.");
    const response = await ai.models.generateContent({
      model: MODEL_SEARCH,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingChunks: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const citations = groundingChunks
      .map(chunk => chunk.web)
      .filter(web => web?.uri && web?.title)
      .map(web => ({ uri: web!.uri!, title: web!.title! }));

    return { text: response.text || "No search results found.", citations };
  },

  generateImage: async (prompt: string, imageBase64?: string, mimeType?: string): Promise<string> => {
    if (!ai) throw new Error("Gemini AI not initialized.");
    
    const parts: any[] = [];
    
    // Image Editing: If an image is provided, add it to the request
    if (imageBase64 && mimeType) {
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: imageBase64
            }
        });
    }
    
    // Add the text prompt
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: MODEL_IMAGE_GEN,
      contents: {
        parts: parts,
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content.parts || []) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    throw new Error('No image was generated.');
  },

  analyzeImage: async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    if (!ai) throw new Error("Gemini AI not initialized.");
    const imagePart = {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    };
    const textPart = { text: prompt };
    
    const response = await ai.models.generateContent({
      model: MODEL_VISION,
      contents: { parts: [textPart, imagePart] },
    });
    return response.text || "I couldn't analyze the image.";
  },
};
