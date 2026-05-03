/**
 * utils/auth.ts
 *
 * Firebase Authentication utilities.
 * Handles email/password and Google sign-in.
 *
 * Used by:
 *  - app/login.tsx
 *  - context/AuthContext.tsx
 */

import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { app } from "./firebase";

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/** Sign in with email and password */
export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/** Create a new account with email and password */
export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/** Sign in with Google credential (from expo-auth-session) */
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