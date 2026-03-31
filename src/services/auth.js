// ============================================
// Auth Service (mock, localStorage-backed)
// ============================================
import { createUser, getUser, getAllUsers } from './db.js';
import { uid } from '../utils/helpers.js';

const AUTH_KEY = 'equipath_auth';

/** Get currently logged-in user */
export function getCurrentUser() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  const { userId } = JSON.parse(raw);
  return getUser(userId);
}

/** Get current user ID */
export function getCurrentUserId() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  return JSON.parse(raw).userId;
}

/** Sign up */
export function signUp(email, password, role, extraData = {}) {
  // Check for existing user with same email
  const allUsers = getAllUsers();
  for (const id in allUsers) {
    if (allUsers[id].email === email) {
      throw new Error('An account with this email already exists.');
    }
  }

  const userId = uid();
  const user = createUser(userId, {
    email,
    role,
    name: extraData.name || '',
    ...extraData,
    // Defaults
    abilityProfile: null,
    overallAbilityScore: null,
  });

  // Store password hash (just base64 for mock — never do this in production!)
  const pwStore = JSON.parse(localStorage.getItem('equipath_pw') || '{}');
  pwStore[userId] = btoa(password);
  localStorage.setItem('equipath_pw', JSON.stringify(pwStore));

  // Auto-login
  localStorage.setItem(AUTH_KEY, JSON.stringify({ userId }));
  return user;
}

/** Sign in */
export function signIn(email, password) {
  const allUsers = getAllUsers();
  let foundId = null;
  for (const id in allUsers) {
    if (allUsers[id].email === email) {
      foundId = id;
      break;
    }
  }

  if (!foundId) throw new Error('No account found with this email.');

  const pwStore = JSON.parse(localStorage.getItem('equipath_pw') || '{}');
  if (pwStore[foundId] !== btoa(password)) {
    throw new Error('Incorrect password.');
  }

  localStorage.setItem(AUTH_KEY, JSON.stringify({ userId: foundId }));
  return getUser(foundId);
}

/** Sign out */
export function signOut() {
  localStorage.removeItem(AUTH_KEY);
}

/** Check if user is authenticated */
export function isAuthenticated() {
  return !!getCurrentUser();
}

/** Auth state change listeners */
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
