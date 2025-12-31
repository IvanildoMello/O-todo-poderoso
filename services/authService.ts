import { User, SubscriptionTier } from '../types';

const USER_KEY = 'OMNICORE_USER_V1';

export const login = (email: string, name: string): User => {
  // Simulating a login - in a real app, this would hit an API and verify password
  const user: User = {
    id: Date.now().toString(),
    email,
    name: name || email.split('@')[0], // Fallback name if logging in via biometrics without name
    tier: SubscriptionTier.FREE, // Default to free
    avatar: `https://ui-avatars.com/api/?name=${name || email}&background=06b6d4&color=fff`
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

export const logout = () => {
  localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const upgradeUser = (tier: SubscriptionTier): User | null => {
  const user = getCurrentUser();
  if (user) {
    const updated = { ...user, tier };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  }
  return null;
};

// Biometric Helpers
export const checkBiometricSupport = async (): Promise<boolean> => {
  if (window.PublicKeyCredential && (await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())) {
    return true;
  }
  return false;
};

export const authenticateWithBiometrics = async (): Promise<boolean> => {
  // In a real app, we would call navigator.credentials.get({ publicKey: ... })
  // For this demo, we simulate the delay and success of the native prompt
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 1500);
  });
};