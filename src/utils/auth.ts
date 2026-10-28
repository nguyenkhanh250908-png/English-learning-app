import { UserProfile, UserStats, Difficulty } from '../types';

const SESSION_KEY = 'lingualeap_auth_session';
const USERS_DB_KEY = 'lingualeap_users_db';
const USER_STATS_PREFIX = 'lingualeap_user_stats_';

// Default initial demo user so users can test immediately without typing
export const DEFAULT_DEMO_USER: UserProfile = {
  id: 'user_alex_1',
  name: 'Alex Miller',
  email: 'alex@lingualeap.com',
  password: 'password123',
  avatar: '🚀',
  nativeLanguage: 'Vietnamese',
  targetLevel: 'A1',
  createdAt: new Date().toISOString(),
  isGuest: false,
};

export const DEFAULT_GUEST_USER: UserProfile = {
  id: 'user_guest_default',
  name: 'Guest Learner',
  email: 'guest@lingualeap.local',
  avatar: '🌱',
  nativeLanguage: 'Vietnamese',
  targetLevel: 'A1',
  createdAt: new Date().toISOString(),
  isGuest: true,
};

export const AVATAR_OPTIONS = ['🚀', '🦊', '🐼', '🦉', '🦁', '⭐', '🐯', '🐬', '🌸', '💡'];

/**
 * Retrieve all registered users from localStorage
 */
export function getRegisteredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading users from storage:', e);
  }
  // Initialize with demo user
  const initial = [DEFAULT_DEMO_USER];
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(initial));
  return initial;
}

/**
 * Get current session user, or null if logged out
 */
export function getCurrentSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw) as UserProfile;
      if (session.isGuest) return session;

      const registeredUser = getRegisteredUsers().find((user) => user.id === session.id);
      if (registeredUser) return registeredUser;

      localStorage.removeItem(SESSION_KEY);
    }
  } catch (e) {
    console.warn('Error reading session:', e);
  }

  // Use the demo profile only when no previously registered session exists.
  return DEFAULT_DEMO_USER;
}

/**
 * Save active session
 */
export function setCurrentSession(user: UserProfile | null) {
  if (user) {
    const { password: _password, ...sessionProfile } = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionProfile));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Login with email/password
 */
export function loginUser(
  identifier: string,
  password: string
): { success: boolean; user?: UserProfile; error?: string } {
  const users = getRegisteredUsers();
  const normalized = identifier.trim().toLowerCase();

  const found = users.find(
    (u) =>
      (u.email.toLowerCase() === normalized || u.name.toLowerCase() === normalized) &&
      u.password === password
  );

  if (!found) {
    return {
      success: false,
      error: 'Invalid username/email or password. Try alex@lingualeap.com / password123 or create an account.',
    };
  }

  setCurrentSession(found);
  return { success: true, user: found };
}

/**
 * Register a new user
 */
export function registerUser(data: {
  name: string;
  email?: string;
  password?: string;
  avatar?: string;
  nativeLanguage?: string;
  targetLevel?: Difficulty;
}): { success: boolean; user?: UserProfile; error?: string } {
  const users = getRegisteredUsers();
  const trimmedName = data.name.trim();
  const rawEmail = data.email?.trim().toLowerCase() || '';

  if (!trimmedName) {
    return { success: false, error: 'Please enter your name or username.' };
  }

  // If email was provided, check format; otherwise it is not required
  if (rawEmail && !rawEmail.includes('@')) {
    return { success: false, error: 'If providing an email, please enter a valid format.' };
  }

  if (!data.password || data.password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  // Check if name or email already exists
  const existing = users.find(
    (u) =>
      (rawEmail && u.email.toLowerCase() === rawEmail) ||
      u.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (existing) {
    return {
      success: false,
      error: 'An account with this name or email already exists. Please choose another or log in.',
    };
  }

  const sanitizedHandle = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'learner';
  const finalEmail = rawEmail || `${sanitizedHandle}@user.local`;

  const newUser: UserProfile = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: trimmedName,
    email: finalEmail,
    password: data.password,
    avatar: data.avatar || '🚀',
    nativeLanguage: data.nativeLanguage || 'Vietnamese',
    targetLevel: data.targetLevel || 'A1',
    createdAt: new Date().toISOString(),
    isGuest: false,
  };

  const updatedUsers = [...users, newUser];
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(updatedUsers));
  setCurrentSession(newUser);

  return { success: true, user: newUser };
}

/**
 * One-click Guest Login
 */
export function loginAsGuest(): UserProfile {
  const guestUser: UserProfile = {
    ...DEFAULT_GUEST_USER,
    id: `guest_${Date.now()}`,
    name: `Guest Learner #${Math.floor(1000 + Math.random() * 9000)}`,
  };
  setCurrentSession(guestUser);
  return guestUser;
}

/**
 * Log Out
 */
export function logoutUser() {
  setCurrentSession(null);
}

/**
 * Load User-specific stats or default stats
 */
export function loadUserStats(userId: string): UserStats {
  const key = `${USER_STATS_PREFIX}${userId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const savedStats = JSON.parse(raw) as UserStats;
      return { ...savedStats, userId };
    }
  } catch (e) {
    console.warn('Error loading user stats:', e);
  }

  // Default initial stats for new users
  return {
    userId,
    xp: 60,
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    learnedWords: ['v1', 'v2'],
    masteredWords: ['v1'],
    bookmarkedWords: ['v3'],
    dailyGoalTarget: 8,
    dailyGoalCurrent: 2,
    completedQuizzes: 0,
    voiceSpeed: 1.0,
    voiceAccent: 'en-US',
    categoryTests: {},
  };
}

/**
 * Save User-specific stats
 */
export function saveUserStats(userId: string, stats: UserStats) {
  const key = `${USER_STATS_PREFIX}${userId}`;
  try {
    localStorage.setItem(key, JSON.stringify({ ...stats, userId }));
  } catch (e) {
    console.warn('Error saving user stats:', e);
  }
}
