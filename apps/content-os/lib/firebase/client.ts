/**
 * Firebase Client
 * Initializes Firebase app and Firestore instance
 * Uses singleton pattern to avoid duplicate initialization
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

let app: FirebaseApp;
let db: Firestore;

// Initialize Firebase (singleton pattern)
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Firestore
db = getFirestore(app);

export { app, db };
