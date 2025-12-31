import { Message } from '../types';

const KEYS = {
  CHAT_HISTORY: 'OMNICORE_CHAT_HISTORY_V1',
  SYSTEM_PROMPT: 'OMNICORE_SYSTEM_PROMPT_V1'
};

export const saveChatHistory = (messages: Message[]) => {
  try {
    localStorage.setItem(KEYS.CHAT_HISTORY, JSON.stringify(messages));
  } catch (e) {
    console.error("Falha ao salvar histórico no armazenamento local", e);
  }
};

export const getChatHistory = (): Message[] | null => {
  try {
    const data = localStorage.getItem(KEYS.CHAT_HISTORY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Falha ao recuperar histórico", e);
    return null;
  }
};

export const saveSystemPrompt = (prompt: string) => {
  try {
    localStorage.setItem(KEYS.SYSTEM_PROMPT, prompt);
  } catch (e) {
    console.error("Falha ao salvar prompt do sistema", e);
  }
};

export const getSystemPrompt = (): string | null => {
  try {
    return localStorage.getItem(KEYS.SYSTEM_PROMPT);
  } catch (e) {
    return null;
  }
};

export const clearStorage = () => {
  localStorage.removeItem(KEYS.CHAT_HISTORY);
  // Optional: Decide if system prompt should be cleared or kept
};