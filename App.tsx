
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AppMode, ChatMessage, MessageType, Sender, OfflineModel, UserSettings, GeneratedImage } from './types';
import { GeminiService, STARTUP_MESSAGE, fileToBase64, getMimeType } from './services/geminiService';
import { OFFLINE_MODELS } from './services/offlineModels';
import { UserService, AppState } from './services/userService';

// --- Web Speech API Types ---
interface SpeechRecognitionErrorEvent extends Event { readonly error: string; }
interface SpeechRecognitionEvent extends Event { readonly results: SpeechRecognitionResultList; }
interface SpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; stop(): void;
  onstart: (() => void) | null; onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}
declare global { interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; } }

// --- ICONS ---
const Icons = {
  GeminiStar: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#gemini_grad)" />
      <defs>
        <linearGradient id="gemini_grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285F4" />
          <stop offset="0.5" stopColor="#9B72CB" />
          <stop offset="1" stopColor="#D96570" />
        </linearGradient>
      </defs>
    </svg>
  ),
  HF: () => <span className="text-xl">🤗</span>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Paperclip: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>,
  Mic: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>,
  Send: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  History: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Brain: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Star: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Heart: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-pink-500"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  Sync: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>,
  External: () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
};

// --- COMPONENTS ---

const Header: React.FC<{
  onOpenSettings: () => void;
  onOpenModelHub: () => void;
  isOffline: boolean;
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}> = ({ onOpenSettings, onOpenModelHub, isOffline, currentMode, onModeChange }) => (
  <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-40 bg-white/80 dark:bg-[#131314]/80 backdrop-blur-md border-b dark:border-gray-800">
    <div className="flex items-center gap-2">
      <Icons.GeminiStar />
      <span className="text-xl font-medium text-gray-800 dark:text-gray-200">Friday</span>
      <div className={`px-2 py-0.5 rounded-full uppercase font-bold text-[10px] ${isOffline ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
        {isOffline ? 'Offline' : 'Live'}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="hidden lg:flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 mr-2">
        {Object.values(AppMode).map(mode => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`px-3 py-1 text-xs rounded-full transition-all ${currentMode === mode ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {mode}
          </button>
        ))}
      </div>
      <button onClick={onOpenModelHub} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center gap-2 group">
        <Icons.HF />
        <span className="hidden md:inline text-xs font-bold uppercase tracking-wider group-hover:text-black dark:group-hover:text-white transition-colors">Hub</span>
      </button>
      <button onClick={onOpenSettings} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
        <Icons.Settings />
      </button>
    </div>
  </header>
);

const SuggestionCard: React.FC<{ icon: React.ReactNode; text: string; onClick: () => void }> = ({ icon, text, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-gray-50 dark:bg-[#1e1f20] p-4 rounded-xl flex flex-col gap-3 items-start text-left border border-transparent hover:border-blue-500 transition-all group w-44 min-w-[176px] shadow-sm"
  >
    <div className="text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform">{icon}</div>
    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium line-clamp-2">{text}</p>
  </button>
);

const LandingState: React.FC<{ onSuggest: (text: string) => void }> = ({ onSuggest }) => (
  <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-40 animate-fade-in">
    <h1 className="text-4xl md:text-5xl font-semibold mb-8 text-center gemini-gradient">
      Hello, Friday.
    </h1>
    <p className="text-xl text-gray-500 dark:text-gray-400 mb-12 text-center max-w-lg">
      How can I help you today?
    </p>
    <div className="flex gap-4 overflow-x-auto w-full max-w-3xl pb-4 scrollbar-hide no-scrollbar">
      <SuggestionCard 
        icon={<Icons.Brain />} 
        text="Brainstorm creative ideas for a project" 
        onClick={() => onSuggest("I need creative ideas for a 10-year anniversary celebration.")}
      />
      <SuggestionCard 
        icon={<Icons.HF />} 
        text="Explore local AI models from Hugging Face" 
        onClick={() => onSuggest("Which local models are best for summarization?")}
      />
      <SuggestionCard 
        icon={<Icons.Search />} 
        text="Research the latest in AI tech" 
        onClick={() => onSuggest("What is the current state of on-device LLMs?")}
      />
      <SuggestionCard 
        icon={<Icons.Mic />} 
        text="Practice speech-to-text with local models" 
        onClick={() => onSuggest("Let's test the local Whisper model accuracy.")}
      />
    </div>
  </div>
);

const MessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.sender === Sender.User;
  
  if (message.type === MessageType.Loading) {
    return (
      <div className="flex gap-4 p-6 animate-pulse">
        <div className="mt-1"><Icons.GeminiStar /></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-4 p-6 message-appear ${isUser ? 'bg-transparent' : ''}`}>
      <div className="mt-1 flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">U</div>
        ) : (
          <Icons.GeminiStar />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-gray-800 dark:text-gray-200 text-[16px] leading-relaxed whitespace-pre-wrap break-words">
          {message.imageUrl && <img src={message.imageUrl} className="max-w-md w-full rounded-xl mb-4 border dark:border-gray-700 shadow-md" alt="Generated" />}
          {message.text}
        </div>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.citations.map((c, i) => (
              <a key={i} href={c.uri} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full hover:underline border dark:border-gray-700 transition-colors">
                {c.title}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- APP COMPONENT ---

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(UserService.loadState);
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.Chat);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isListening, setIsListening] = useState(false);
  const [isModelHubOpen, setIsModelHubOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [downloadingStatus, setDownloadingStatus] = useState<Record<string, number>>({});
  const [hubSearchQuery, setHubSearchQuery] = useState('');
  const [hfModelsData, setHfModelsData] = useState<Record<string, { likes: number, downloads: number }>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { settings, chatHistory, downloadedModels: downloadedModelIds } = appState;
  const downloadedModels = useMemo(() => new Set(downloadedModelIds), [downloadedModelIds]);

  useEffect(() => { UserService.saveState(appState); }, [appState]);
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); }
  }, []);

  // Fetch Live HF Stats
  const fetchHubStats = async () => {
    setIsSyncing(true);
    try {
      const results: Record<string, { likes: number, downloads: number }> = {};
      for (const model of OFFLINE_MODELS) {
        try {
          const resp = await fetch(`https://huggingface.co/api/models/${model.hfRepo}`);
          if (resp.ok) {
            const data = await resp.json();
            results[model.hfRepo] = {
              likes: data.likes || 0,
              downloads: data.downloads || 0
            };
          }
        } catch (e) {
          console.error(`Failed to sync ${model.hfRepo}`, e);
        }
      }
      setHfModelsData(results);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isModelHubOpen) fetchHubStats();
  }, [isModelHubOpen]);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAppState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, newMessage] }));
  }, []);

  const handleSend = async (text: string, file?: File) => {
    if (!text && !file) return;
    setInputText('');
    setAttachedFile(null);
    addMessage({ sender: Sender.User, type: MessageType.Text, text });
    setIsLoading(true);

    const effectiveOffline = isOffline || settings.forceOffline;

    try {
      if (effectiveOffline) {
        const model = OFFLINE_MODELS.find(m => m.category === currentMode);
        if (model && downloadedModels.has(model.id)) {
          // Simulate local inference
          await new Promise(r => setTimeout(r, 1200));
          const isHighPerf = model.id.includes('27b');
          const responseText = `[HF EDGE INFERENCE - ${model.name}]\n\nProcessing "${text}" locally using ${isHighPerf ? 'high-performance' : 'optimized'} weights from ${model.hfRepo}.\n\nFriday Status: On-device private execution enabled.\n\n(This is a specialized Edge-AI simulation. In a native environment, Friday utilizes the system NPU to run ${model.hfRepo} with zero data leaving the device.)`;
          addMessage({ sender: Sender.AI, type: MessageType.Text, text: responseText });
          setIsLoading(false);
          return;
        } else {
          throw new Error(`Offline Mode Error: To use Friday without internet in "${currentMode}" mode, please download a compatible model (e.g. ${OFFLINE_MODELS.find(m => m.category === currentMode)?.name || 'Gemma'}) from the Friday Hub.`);
        }
      }

      let response;
      switch (currentMode) {
        case AppMode.Chat:
        case AppMode.Audio:
        case AppMode.Task:
          response = await GeminiService.generateChatResponse(text, currentMode);
          addMessage({ sender: Sender.AI, type: MessageType.Text, text: response });
          break;
        case AppMode.Search:
          const sResp = await GeminiService.generateSearchResponse(text);
          addMessage({ sender: Sender.AI, type: MessageType.Text, text: sResp.text, citations: sResp.citations });
          break;
        case AppMode.ImageGen:
          let imgB64, mime;
          if (file) { imgB64 = await fileToBase64(file); mime = getMimeType(file); }
          response = await GeminiService.generateImage(text, imgB64, mime);
          addMessage({ sender: Sender.AI, type: MessageType.Image, text: `Generated: ${text}`, imageUrl: response });
          break;
        case AppMode.ImageAnalysis:
          if (!file) throw new Error("Image required for analysis.");
          const b64 = await fileToBase64(file);
          const m = getMimeType(file);
          response = await GeminiService.analyzeImage(text, b64, m);
          addMessage({ sender: Sender.AI, type: MessageType.Text, text: response });
          break;
      }
    } catch (e) {
      addMessage({ sender: Sender.AI, type: MessageType.Error, text: (e as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadModel = (modelId: string) => {
    if (downloadedModels.has(modelId) || downloadingStatus[modelId] !== undefined) return;

    setDownloadingStatus(prev => ({ ...prev, [modelId]: 0 }));
    
    const model = OFFLINE_MODELS.find(m => m.id === modelId);
    // Large models take longer to "sync"
    const step = model ? Math.max(0.5, 3 - parseFloat(model.size) / 2000) : 2;

    const interval = setInterval(() => {
      setDownloadingStatus(prev => {
        const current = prev[modelId] || 0;
        if (current >= 100) {
          clearInterval(interval);
          setAppState(s => ({ ...s, downloadedModels: [...s.downloadedModels, modelId] }));
          const next = { ...prev };
          delete next[modelId];
          return next;
        }
        return { ...prev, [modelId]: Math.min(100, current + step * (Math.random() + 0.2)) };
      });
    }, 100);
  };

  const startListening = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    recognitionRef.current = new SpeechRec();
    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onresult = (e: any) => setInputText(e.results[0][0].transcript);
    recognitionRef.current.start();
  };

  const filteredModels = useMemo(() => {
    if (!hubSearchQuery) return OFFLINE_MODELS;
    const query = hubSearchQuery.toLowerCase();
    return OFFLINE_MODELS.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.hfRepo.toLowerCase().includes(query) ||
      m.tags?.some(t => t.toLowerCase().includes(query))
    );
  }, [hubSearchQuery]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatHistory, isLoading]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#131314] transition-colors overflow-hidden">
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onOpenModelHub={() => setIsModelHubOpen(true)}
        isOffline={isOffline || settings.forceOffline}
        currentMode={currentMode}
        onModeChange={setCurrentMode}
      />

      <main ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden pt-16 pb-32 scroll-smooth">
        {chatHistory.length <= 1 && !isLoading ? (
          <LandingState onSuggest={(t) => handleSend(t)} />
        ) : (
          <div className="max-w-3xl mx-auto w-full">
            {chatHistory.map(m => <MessageItem key={m.id} message={m} />)}
            {isLoading && <MessageItem message={{ id: 'l', sender: Sender.AI, type: MessageType.Loading, text: '', timestamp: '' }} />}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white dark:from-[#131314] via-white/90 dark:via-[#131314]/90 to-transparent">
        <div className="max-w-3xl mx-auto">
          {attachedFile && (
            <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center gap-2 truncate">
                 <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center text-blue-500">
                    <Icons.Paperclip />
                 </div>
                 <span className="text-xs font-medium truncate max-w-[200px] text-gray-700 dark:text-gray-300">{attachedFile.name}</span>
              </div>
              <button onClick={() => setAttachedFile(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><Icons.Close /></button>
            </div>
          )}
          <div className={`relative flex items-center bg-gray-100 dark:bg-[#1e1f20] rounded-[32px] px-6 py-3 transition-all shadow-sm focus-within:shadow-md border border-transparent focus-within:border-gray-200 dark:focus-within:border-gray-700 ${isListening ? 'ring-2 ring-blue-500' : ''}`}>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-500 dark:text-gray-400 hover:text-blue-500 p-1 transition-colors"
              title="Attach File"
            >
              <Icons.Paperclip />
            </button>
            <input 
              type="file" ref={fileInputRef} className="hidden" 
              onChange={(e) => e.target.files?.[0] && setAttachedFile(e.target.files[0])} 
            />
            <input 
              type="text" 
              placeholder={isListening ? "Listening..." : "Ask Friday anything..."}
              className="flex-1 bg-transparent border-none outline-none px-4 text-gray-800 dark:text-gray-200 placeholder-gray-500"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText, attachedFile || undefined)}
            />
            <div className="flex items-center gap-2">
              <button 
                onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
                className={`p-1 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 dark:text-gray-400 hover:text-blue-500'}`}
              >
                <Icons.Mic />
              </button>
              {(inputText.trim() || attachedFile) && (
                <button 
                  onClick={() => handleSend(inputText, attachedFile || undefined)}
                  className="p-1 text-blue-500 hover:scale-110 transition-transform"
                >
                  <Icons.Send />
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-4 uppercase tracking-widest font-medium opacity-70">
            Friday supports local execution of SOTA models from Hugging Face Hub.
          </p>
        </div>
      </div>

      {/* Model Hub Modal */}
      {isModelHubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsModelHubOpen(false)}>
          <div className="bg-white dark:bg-[#1e1f20] rounded-[28px] p-6 md:p-8 w-full max-w-3xl h-[90vh] flex flex-col shadow-2xl border dark:border-gray-800 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                  <Icons.HF />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-0.5 tracking-tight">Friday AI Hub</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Hugging Face Edge Ecosystem</p>
                    <button onClick={fetchHubStats} className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all ${isSyncing ? 'animate-spin text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}>
                      <Icons.Sync />
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsModelHubOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors self-end md:self-auto"><Icons.Close /></button>
            </div>

            <div className="relative mb-6">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Icons.Search />
              </div>
              <input 
                type="text" 
                placeholder="Search models like 'Gemma' or 'Stable Diffusion'..."
                className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 ring-blue-500/50 transition-all shadow-inner"
                value={hubSearchQuery}
                onChange={e => setHubSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {filteredModels.map(m => {
                const isDownloaded = downloadedModels.has(m.id);
                const progress = downloadingStatus[m.id];
                const isDownloading = progress !== undefined;
                const hfStats = hfModelsData[m.hfRepo];

                return (
                  <div key={m.id} className={`group p-5 border-2 rounded-2xl flex flex-col gap-4 transition-all ${isDownloaded ? 'border-green-100 dark:border-green-900/20 bg-green-50/20 dark:bg-green-900/5' : 'border-gray-100 dark:border-gray-800 hover:border-blue-400/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'}`}>
                     <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 leading-tight">{m.name}</h3>
                            {m.isRecommended && <span className="bg-yellow-100 dark:bg-yellow-900/30 text-[10px] text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Editor's Choice</span>}
                            <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-mono">{m.size}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <a href={`https://huggingface.co/${m.hfRepo}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-mono truncate">
                              {m.hfRepo}
                              <Icons.External />
                            </a>
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{m.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 font-bold uppercase tracking-wide">
                             <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
                                <Icons.Download />
                                <span>{hfStats ? formatNumber(hfStats.downloads) : (m.downloads || 'Syncing...')}</span>
                             </div>
                             <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
                                <Icons.Heart />
                                <span>{hfStats ? formatNumber(hfStats.likes) : (m.stars || 'Syncing...')}</span>
                             </div>
                             <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-700 mx-1 hidden md:block" />
                             <div className="flex gap-2">
                               {m.tags?.map(tag => (
                                 <span key={tag} className="text-blue-500 hover:text-blue-600 cursor-pointer">#{tag}</span>
                               ))}
                             </div>
                          </div>
                        </div>
                        
                        <div className="w-full md:w-auto shrink-0 flex items-center">
                          {isDownloaded ? (
                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                <div className="flex items-center gap-2 text-green-600 bg-green-100 dark:bg-green-900/20 px-6 py-2.5 rounded-xl border-2 border-green-200 dark:border-green-800/20 justify-center">
                                  <Icons.Check />
                                  <span className="text-sm font-bold uppercase tracking-widest">Active</span>
                                </div>
                                <p className="text-[9px] text-center text-gray-400 font-bold">EDGE DEPLOYED</p>
                            </div>
                          ) : isDownloading ? (
                            <div className="w-full md:w-48 flex flex-col gap-2 p-1">
                               <div className="flex justify-between text-[10px] font-bold">
                                  <span className="text-blue-500 animate-pulse">SYNCING WEIGHTS...</span>
                                  <span>{Math.round(progress)}%</span>
                               </div>
                               <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                                  <div className="h-full bg-blue-500 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleDownloadModel(m.id)} 
                              className="w-full md:w-auto bg-gray-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl text-sm font-black uppercase tracking-tighter flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/5 hover:shadow-blue-500/10"
                            >
                              <Icons.Download />
                              Deploy Edge
                            </button>
                          )}
                        </div>
                     </div>
                  </div>
                );
              })}
              {filteredModels.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                  <div className="mb-4 opacity-10 scale-[2]"><Icons.HF /></div>
                  <p className="font-bold uppercase tracking-widest text-xs">No edge models found in repository</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                Friday Hub | Secure Origin Storage Deployment
              </p>
              <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold">
                <span>V3.0.4-EDGE</span>
                <span>SYSTEM NPU: DETECTED</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsSettingsOpen(false)}>
           <div className="bg-white dark:bg-[#1e1f20] rounded-[28px] p-8 w-full max-w-md shadow-2xl border dark:border-gray-800" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold tracking-tight">System Settings</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><Icons.Close /></button>
              </div>
              <div className="space-y-6">
                 <div className="flex justify-between items-center group">
                    <div>
                       <p className="font-bold text-sm">Dark Theme</p>
                       <p className="text-xs text-gray-500 font-medium">Toggle system interface brightness</p>
                    </div>
                    <button 
                      onClick={() => setAppState(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'dark' ? 'light' : 'dark'}}))} 
                      className={`w-12 h-6 rounded-full transition-all relative shadow-inner ${settings.theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${settings.theme === 'dark' ? 'left-7' : 'left-1'}`} />
                    </button>
                 </div>
                 <div className="flex justify-between items-center group">
                    <div>
                       <p className="font-bold text-sm">Edge Priority (Force Offline)</p>
                       <p className="text-xs text-gray-500 font-medium">Bypass cloud APIs for local Hub models</p>
                    </div>
                    <button 
                      onClick={() => setAppState(p => ({...p, settings: {...p.settings, forceOffline: !p.settings.forceOffline}}))} 
                      className={`w-12 h-6 rounded-full transition-all relative shadow-inner ${settings.forceOffline ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${settings.forceOffline ? 'left-7' : 'left-1'}`} />
                    </button>
                 </div>
                 <div className="pt-6 border-t dark:border-gray-800">
                    <button onClick={() => { setAppState(p => ({...p, chatHistory: [STARTUP_MESSAGE]})); setIsSettingsOpen(false); }} className="w-full py-3 bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-500/20 transition-all">
                      Purge Local Logs
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
