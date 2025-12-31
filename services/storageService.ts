import { Message, StoredFile } from '../types';

const KEYS = {
  CHAT_HISTORY: 'OMNICORE_CHAT_HISTORY_V1',
  SYSTEM_PROMPT: 'OMNICORE_SYSTEM_PROMPT_V1'
};

// --- LOCAL STORAGE (Settings & Light Data) ---

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
};

// --- OMNI FILE SYSTEM (IndexedDB for Heavy Files) ---

const DB_NAME = 'OmniCoreDrive';
const STORE_NAME = 'system_files';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveFileToDrive = async (file: Omit<StoredFile, 'id' | 'createdAt'>): Promise<string> => {
  const db = await openDB();
  const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const storedFile: StoredFile = {
    ...file,
    id,
    createdAt: Date.now()
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(storedFile);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
};

export const getFilesFromDrive = async (): Promise<StoredFile[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by newest first
      const files = (request.result as StoredFile[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(files);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteFileFromDrive = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Helper to convert Base64 or Strings to Blob
export const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};