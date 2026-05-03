/**
 * utils/auth.ts
 *
 * Firebase Authentication.
 * Uses standard getAuth on all platforms.
 * Note: on React Native, auth state persists via Firebase's built-in
 * token refresh mechanism even without explicit AsyncStorage persistence.
 */

import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
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