
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
            // Basic validation to ensure state shape is correct
            if (parsedState.settings && parsedState.chatHistory && Array.isArray(parsedState.downloadedModels)) {
                // Backward compatibility: Ensure imageHistory exists
                if (!Array.isArray(parsedState.imageHistory)) {
                    parsedState.imageHistory = [];
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
            const serializedState = JSON.stringify(state);
            localStorage.setItem(APP_STATE_KEY, serializedState);
            // Save theme separately for instant theme loading (FOUC prevention)
            localStorage.setItem('theme', state.settings.theme);
        } catch (err) {
            console.error("Could not save state to localStorage", err);
        }
    },
};