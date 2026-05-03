/**
 * utils/auth.ts
 *
 * Firebase Authentication with AsyncStorage persistence.
 * Keeps users logged in between app sessions on mobile.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  initializeAuth,
  Persistence,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { Platform } from "react-native";
import { app } from "./firebase";

/**
 * Custom AsyncStorage persistence for React Native.
 * Stores Firebase auth tokens in AsyncStorage so users
 * stay logged in between app restarts.
 */
const asyncStoragePersistence: Persistence = {
  type: "LOCAL" as const,
  _isAvailable: () => Promise.resolve(true),
  _set: (key: string, value: any) =>
    AsyncStorage.setItem(key, JSON.stringify(value)),
  _get: async (key: string) => {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  },
  _remove: (key: string) => AsyncStorage.removeItem(key),
  _addListener: (_key: string, _listener: any) => {},
  _removeListener: (_key: string, _listener: any) => {},
} as unknown as Persistence;

// Web uses standard getAuth, native uses initializeAuth with AsyncStorage
export const auth = Platform.OS === "web"
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: asyncStoragePersistence,
    });

export const googleProvider = new GoogleAuthProvider();

/** Sign in with email and password */
export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/** Create a new account with email and password */
export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/** Sign in with Google credential */
export async function loginWithGoogleCredential(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

/** Send password reset email */
export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

/** Sign out current user */
export async function logout() {
  return signOut(auth);
}