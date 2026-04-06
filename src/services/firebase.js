// ============================================
// Firebase Service — Sprint 9
// Live Cloud Firestore + Firebase Auth
// ============================================
// NOTE: Replace the config below with your own Firebase project credentials.
// Get them from: https://console.firebase.google.com → Your Project → Project Settings → Web App
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// ── Firebase Config ──────────────────────────────────────────────
// ⚠️  REPLACE with your actual Firebase credentials!
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

// ── Detect if Firebase is configured ────────────────────────────
export const FIREBASE_ENABLED =
  FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY' &&
  FIREBASE_CONFIG.projectId !== 'YOUR_PROJECT_ID';

let app, db, auth;

if (FIREBASE_ENABLED) {
  try {
    app  = initializeApp(FIREBASE_CONFIG);
    db   = getFirestore(app);
    auth = getAuth(app);
    console.info('🔥 Firebase initialized (live mode)');
  } catch (e) {
    console.warn('Firebase init failed, falling back to localStorage:', e);
  }
} else {
  console.info('🗃️  Firebase not configured — running in localStorage mode');
}

export { db, auth, serverTimestamp };

// ── Firestore Helpers ────────────────────────────────────────────

/** Get a single document from a collection */
export async function fsGet(colName, id) {
  if (!db) return null;
  const snap = await getDoc(doc(db, colName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Set / overwrite a document */
export async function fsSet(colName, id, data) {
  if (!db) return;
  await setDoc(doc(db, colName, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/** Add a new document with auto-ID */
export async function fsAdd(colName, data) {
  if (!db) return null;
  const ref = await addDoc(collection(db, colName), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

/** Get all documents in a collection */
export async function fsGetAll(colName) {
  if (!db) return [];
  const snap = await getDocs(collection(db, colName));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Query documents */
export async function fsQuery(colName, field, op, value) {
  if (!db) return [];
  const q = query(collection(db, colName), where(field, op, value));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Update specific fields */
export async function fsUpdate(colName, id, data) {
  if (!db) return;
  await updateDoc(doc(db, colName, id), { ...data, updatedAt: serverTimestamp() });
}

// ── Firebase Auth Helpers ────────────────────────────────────────

export async function fbCreateUser(email, password) {
  if (!auth) throw new Error('Firebase Auth not configured');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function fbSignIn(email, password) {
  if (!auth) throw new Error('Firebase Auth not configured');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logOutFirebase() {
  if (!auth) return;
  await fbSignOut(auth);
}

export function fbOnAuthChange(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}
