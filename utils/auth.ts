/**
 * utils/auth.ts
 *
 * Firebase Authentication with AsyncStorage persistence.
 * Uses initializeAuth + getReactNativePersistence so auth state
 * survives app restarts on React Native (iOS + Android).
 *
 * Web falls back to standard getAuth since AsyncStorage isn't available.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  getAuth,
  getReactNativePersistence,
  GoogleAuthProvider,
  initializeAuth,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { Platform } from "react-native";
import { app } from "./firebase";

// Use AsyncStorage persistence on native, default on web
export const auth = Platform.OS === "web"
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
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
