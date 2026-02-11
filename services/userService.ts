
import { UserSettings, ChatMessage, GeneratedImage } from '../types';
import { STARTUP_MESSAGE } from './geminiService';

const APP_STATE_KEY = 'fridayAppState';

export interface AppState {
    settings: UserSettings;
    chatHistory: ChatMessage[];
    downloadedModels: string[];
    imageHistory: GeneratedImage[];
}

const createInitialState = (): AppState => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return {
        settings: {
            theme: systemPrefersDark ? 'dark' : 'light',
            forceOffline: false,
            realTimeResponses: true,
            saveHistory: true,
            preferredLanguage: 'English',
            voiceName: 'Zephyr',
            extensions: {
                googleSearch: true,
                googleMaps: true,
                workspace: false,
            },
            highReasoningMode: false,
        },
        chatHistory: [STARTUP_MESSAGE],
        downloadedModels: [],
        imageHistory: [],
    };
};

export const UserService = {
    loadState: (): AppState => {
        try {
            const serializedState = localStorage.getItem(APP_STATE_KEY);
            if (serializedState === null) {
                return createInitialState();
            }
            const parsedState = JSON.parse(serializedState);
            // Basic validation and migration
            if (parsedState.settings && parsedState.chatHistory) {
                // Ensure all new setting fields exist
                const defaults = createInitialState().settings;
                parsedState.settings = { ...defaults, ...parsedState.settings };
                
                if (!Array.isArray(parsedState.imageHistory)) {
                    parsedState.imageHistory = [];
                }
                if (!Array.isArray(parsedState.downloadedModels)) {
                    parsedState.downloadedModels = [];
                }
                return parsedState;
            }
            return createInitialState();
        } catch (err) {
            console.error("Could not load state from localStorage", err);
            return createInitialState();
        }
    },

    saveState: (state: AppState) => {
        try {
            // Respect the 'saveHistory' privacy setting
            const stateToSave = { ...state };
            if (!state.settings.saveHistory) {
                stateToSave.chatHistory = [STARTUP_MESSAGE];
                stateToSave.imageHistory = [];
            }
            
            const serializedState = JSON.stringify(stateToSave);
            localStorage.setItem(APP_STATE_KEY, serializedState);
            localStorage.setItem('theme', state.settings.theme);
        } catch (err) {
            console.error("Could not save state to localStorage", err);
        }
    },
};
