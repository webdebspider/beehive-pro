/**
 * utils/firebase.ts
 *
 * Firebase initialization.
 * Exports app, db, and storage for use throughout the app.
 * 
 * my note to self: add a plant note here for the github commit and push test
 * 
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDEJmor-jQRPlRaP2h1M9jr2_z-6jwZdao",
  authDomain: "beehive-app-a0cd4.firebaseapp.com",
  projectId: "beehive-app-a0cd4",
  storageBucket: "beehive-app-a0cd4.firebasestorage.app",
  messagingSenderId: "950068293878",
  appId: "1:950068293878:web:a6f84b61ae05fcce877cd7",
  measurementId: "G-6YMFMZLH6Y"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);