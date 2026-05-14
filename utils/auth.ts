/**
 * utils/auth.ts
 *
 * Firebase Authentication with AsyncStorage persistence.
 * Uses initializeAuth + getReactNativePersistence so auth state
 * survives app restarts on React Native (iOS + Android).
 *
 * Web falls back to standard getAuth since AsyncStorage isn't available.
 *
 * ───────────────────────────────────────────────────────────────────────
 * CHANGE HISTORY
 * ───────────────────────────────────────────────────────────────────────
 * 2026-05-13  Added changePassword(), getCurrentUserEmail(), and
 *             isGoogleProvider() to support the new Account section
 *             in settings.tsx. The Change Password flow is critical
 *             for beta testers (e.g. Nadine) who receive a temp
 *             password via an out-of-band channel (FB Messenger) and
 *             need to set their own once they're signed in — without
 *             going through the spam-folder dance of an email reset.
 *
 *             No existing exports were modified. All previous behavior
 *             is preserved verbatim.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  getReactNativePersistence,
  GoogleAuthProvider,
  initializeAuth,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { Platform } from "react-native";
import { app } from "./firebase";

// ──────────────────────────────────────────────────────────────────────────
// AUTH INSTANCE
// ──────────────────────────────────────────────────────────────────────────
// Native (iOS/Android): AsyncStorage-backed persistence so auth state
// survives app restarts. Web: default getAuth (AsyncStorage isn't
// available in browsers; Firebase falls back to IndexedDB on its own).
export const auth = Platform.OS === "web"
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export const googleProvider = new GoogleAuthProvider();

// ══════════════════════════════════════════════════════════════════════════
// EXISTING AUTH FUNCTIONS — UNCHANGED FROM PREVIOUS VERSION
// ══════════════════════════════════════════════════════════════════════════

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

/**
 * Send password reset email.
 * Used by login.tsx for users who forgot their password and aren't
 * signed in. This is the "I can't get into my account" flow.
 *
 * For signed-in users who want to change their password from the
 * Settings screen, use changePassword() below instead — it doesn't
 * require any email round-trip.
 */
export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

/** Sign out current user */
export async function logout() {
  return signOut(auth);
}

// ══════════════════════════════════════════════════════════════════════════
// NEW (2026-05-13) — ACCOUNT MANAGEMENT FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════
// These power the new Account section in settings.tsx. They operate on
// the currently signed-in user (auth.currentUser) and assume the caller
// (the Settings screen) is only reachable when a user is signed in.

/**
 * Change the currently signed-in user's password.
 *
 * Firebase requires *recent* re-authentication before sensitive
 * operations like password changes — even if the user is already
 * signed in. So this does two steps:
 *
 *   1. Re-authenticate with the user's current password
 *   2. Call updatePassword() with the new password
 *
 * If step 1 fails (wrong current password), step 2 never runs and the
 * error propagates out. The calling UI can map the error code to a
 * friendly message via the same getFriendlyError() pattern used in
 * login.tsx.
 *
 * IMPORTANT: This will NOT work for users who signed in with Google —
 * they don't have a Firebase-managed password. Callers should check
 * isGoogleProvider() first and hide the password form in that case.
 *
 * @param currentPassword  The user's existing password (used for reauth)
 * @param newPassword      The new password to set
 *
 * @throws Firebase auth error codes the UI should map to friendly text:
 *   - auth/wrong-password         : current password didn't match
 *   - auth/invalid-credential     : modern equivalent of wrong-password
 *   - auth/weak-password          : new password too short (<6 chars)
 *   - auth/requires-recent-login  : session too old, user must sign out
 *                                   and back in before changing password
 *   - auth/no-current-user        : (custom code) thrown below if there
 *                                   is somehow no signed-in user with an
 *                                   email address attached
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser;

  // Defensive guard. The Settings screen should never reach this state
  // (it's only mounted under auth), but cover it cleanly anyway so the
  // UI gets a predictable error code instead of a TypeError.
  if (!user || !user.email) {
    const err: any = new Error("No signed-in user with an email address.");
    err.code = "auth/no-current-user";
    throw err;
  }

  // Step 1: Re-authenticate. Firebase needs proof that the current
  // session actually knows the current password before allowing the
  // change. This protects against an attacker who steals an unlocked
  // device — they'd still need the password to change it.
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // Step 2: Now we can actually update the password. Firebase will
  // throw auth/weak-password here if the new password is too short.
  await updatePassword(user, newPassword);
}

/**
 * Return the current user's email address, or null if not signed in.
 * Used in settings.tsx to show "Signed in as: foo@bar.com" so the user
 * can confirm at a glance which account they're managing.
 */
export function getCurrentUserEmail(): string | null {
  return auth.currentUser?.email ?? null;
}

/**
 * Return true if the current user signed in via Google (rather than
 * email/password). Used by settings.tsx to decide whether to show:
 *
 *   - The Change Password form    (email/password users)
 *   - A "managed by Google" notice (Google sign-in users)
 *
 * Returns false if no user is signed in, or if no Google provider is
 * attached to the account. A user CAN have both providers attached
 * (linked accounts) — in that case this still returns true and we
 * could later add an unlink option, but for v1 we treat any Google
 * link as "use Google to manage it."
 */
export function isGoogleProvider(): boolean {
  const user = auth.currentUser;
  if (!user) return false;
  return user.providerData.some((p) => p.providerId === "google.com");
}
