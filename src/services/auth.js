// ============================================
// Auth Service — Sprint 9 (Hybrid)
// Firebase Auth OR localStorage mock
// ============================================
import { FIREBASE_ENABLED, fbCreateUser, fbSignIn, auth } from './firebase.js';
import { createUser, getUser, getAllUsers, updateUser } from './db.js';
import { uid } from '../utils/helpers.js';

const AUTH_KEY = 'equipath_auth';

// ── Current User ─────────────────────────────────────────────────

export function getCurrentUser() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  const { userId } = JSON.parse(raw);
  // Sync read from localStorage DB (getUser is async in Firebase mode, so use sync wrapper)
  if (FIREBASE_ENABLED) {
    // In Firebase mode, we cache user profile in localStorage too for sync reads
    const cached = localStorage.getItem(`equipath_user_${userId}`);
    return cached ? JSON.parse(cached) : null;
  }
  const { getDB } = _localDB();
  return getDB().users[userId] || null;
}

export function getCurrentUserId() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  return JSON.parse(raw).userId;
}

// Helper to access localStorage DB internals for sync reads
function _localDB() {
  const DB_KEY = 'equipath_db';
  const getDB = () => {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : { users: {}, jobs: {}, applications: {} };
  };
  return { getDB };
}

// Cache user profile locally for sync reads (Firebase mode)
function _cacheUser(userId, userObj) {
  localStorage.setItem(`equipath_user_${userId}`, JSON.stringify(userObj));
}

// ── Sign Up ───────────────────────────────────────────────────────

export async function signUp(email, password, role, extraData = {}) {
  if (FIREBASE_ENABLED) {
    // Firebase Auth: creates real user account
    const fbUser = await fbCreateUser(email, password);
    const userId = fbUser.uid;
    const userRecord = {
      email,
      role,
      name: extraData.name || '',
      ...extraData,
      abilityProfile: null,
      overallAbilityScore: null,
    };
    await createUser(userId, userRecord);
    _cacheUser(userId, { id: userId, ...userRecord });
    localStorage.setItem(AUTH_KEY, JSON.stringify({ userId }));
    return { id: userId, ...userRecord };
  }

  // localStorage mock
  const allUsers = await getAllUsers();
  for (const id in allUsers) {
    if (allUsers[id].email === email) throw new Error('An account with this email already exists.');
  }

  const userId = uid();
  const user = await createUser(userId, {
    email, role,
    name: extraData.name || '',
    ...extraData,
    abilityProfile: null,
    overallAbilityScore: null,
  });

  // Store password hash (base64 — mock only!)
  const pwStore = JSON.parse(localStorage.getItem('equipath_pw') || '{}');
  pwStore[userId] = btoa(password);
  localStorage.setItem('equipath_pw', JSON.stringify(pwStore));
  localStorage.setItem(AUTH_KEY, JSON.stringify({ userId }));
  return user;
}

// ── Sign In ───────────────────────────────────────────────────────

export async function signIn(email, password) {
  if (FIREBASE_ENABLED) {
    const fbUser = await fbSignIn(email, password);
    const userId = fbUser.uid;
    const userRecord = await getUser(userId);
    if (userRecord) _cacheUser(userId, userRecord);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ userId }));
    return userRecord;
  }

  // localStorage mock
  const allUsers = await getAllUsers();
  let foundId = null;
  for (const id in allUsers) {
    if (allUsers[id].email === email) { foundId = id; break; }
  }
  if (!foundId) throw new Error('No account found with this email.');

  const pwStore = JSON.parse(localStorage.getItem('equipath_pw') || '{}');
  if (pwStore[foundId] !== btoa(password)) throw new Error('Incorrect password.');

  localStorage.setItem(AUTH_KEY, JSON.stringify({ userId: foundId }));
  return allUsers[foundId];
}

// ── Sign Out ──────────────────────────────────────────────────────

export async function signOut() {
  const userId = getCurrentUserId();
  if (FIREBASE_ENABLED && auth) {
    try { await auth.signOut(); } catch (_) {}
  }
  if (userId) localStorage.removeItem(`equipath_user_${userId}`);
  localStorage.removeItem(AUTH_KEY);
}

// ── Helpers ───────────────────────────────────────────────────────

export function isAuthenticated() {
  return !!getCurrentUser();
}

// ── Auth state listeners (for UI syncing) ─────────────────────────

const listeners = [];

export function onAuthChange(callback) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function notifyAuthChange() {
  const user = getCurrentUser();
  listeners.forEach(cb => cb(user));
}

// ── Update profile helper (cached) ───────────────────────────────

export async function updateCurrentUserProfile(data) {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const updated = await updateUser(userId, data);
  if (FIREBASE_ENABLED && updated) _cacheUser(userId, updated);
  return updated;
}
