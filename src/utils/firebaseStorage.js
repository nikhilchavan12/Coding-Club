import { 
  ref, 
  set, 
  get, 
  push, 
  update, 
  remove, 
  onValue,
  off 
} from 'firebase/database';
import { database } from '../firebaseConfig';
import { defaultChallengesSY, defaultChallengesTY } from '../data/defaultChallenges';

const PATHS = {
  SY_CHALLENGES: 'challenges/sy',
  TY_CHALLENGES: 'challenges/ty',
  COMPETITION_STATE: 'competition/state',
  PARTICIPANTS: 'participants',
  ADMIN_PASSWORD: 'admin/password'
};

// =================== CHALLENGES ===================
export const getChallenges = async (year = 'SY') => {
  const path = year.toUpperCase() === 'TY' ? PATHS.TY_CHALLENGES : PATHS.SY_CHALLENGES;
  const snapshot = await get(ref(database, path));
  
  if (!snapshot.exists()) {
    const defaults = year.toUpperCase() === 'TY' ? defaultChallengesTY : defaultChallengesSY;
    await set(ref(database, path), defaults);
    return defaults;
  }
  
  const data = snapshot.val();
  return Array.isArray(data) ? data : Object.values(data || {});
};

export const saveChallenge = async (year, challenge) => {
  const path = year.toUpperCase() === 'TY' ? PATHS.TY_CHALLENGES : PATHS.SY_CHALLENGES;
  const challenges = await getChallenges(year);
  const index = challenges.findIndex(c => c.id === challenge.id);
  
  let updated;
  if (index >= 0) {
    updated = [...challenges];
    updated[index] = challenge;
  } else {
    updated = [...challenges, { ...challenge, id: `${year.toLowerCase()}-${Date.now()}` }];
  }
  
  await set(ref(database, path), updated);
  return updated;
};

export const deleteChallenge = async (year, id) => {
  const path = year.toUpperCase() === 'TY' ? PATHS.TY_CHALLENGES : PATHS.SY_CHALLENGES;
  const challenges = await getChallenges(year);
  const updated = challenges.filter(c => c.id !== id);
  await set(ref(database, path), updated);
  return updated;
};

export const resetChallengesToDefault = async (year) => {
  const path = year.toUpperCase() === 'TY' ? PATHS.TY_CHALLENGES : PATHS.SY_CHALLENGES;
  const defaults = year.toUpperCase() === 'TY' ? defaultChallengesTY : defaultChallengesSY;
  await set(ref(database, path), defaults);
  return defaults;
};

// =================== COMPETITION STATE ===================
export const getCompetitionState = async () => {
  const snapshot = await get(ref(database, PATHS.COMPETITION_STATE));
  
  if (!snapshot.exists()) {
    const defaultState = { status: 'WAITING', startedAt: null, endedAt: null };
    await set(ref(database, PATHS.COMPETITION_STATE), defaultState);
    return defaultState;
  }
  
  return snapshot.val();
};

export const startCompetition = async () => {
  const now = Date.now();
  const newState = { status: 'RUNNING', startedAt: now, endedAt: null };
  await set(ref(database, PATHS.COMPETITION_STATE), newState);
  return newState;
};

export const endCompetition = async () => {
  const now = Date.now();
  const current = await getCompetitionState();
  const newState = { ...current, status: 'ENDED', endedAt: now };
  await set(ref(database, PATHS.COMPETITION_STATE), newState);
  return newState;
};

export const resetCompetition = async () => {
  const newState = { status: 'WAITING', startedAt: null, endedAt: null };
  await set(ref(database, PATHS.COMPETITION_STATE), newState);
  return newState;
};

// Subscribe to competition state changes
export const subscribeToCompetitionState = (callback) => {
  const stateRef = ref(database, PATHS.COMPETITION_STATE);
  onValue(stateRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
  
  return () => off(stateRef);
};

// =================== PARTICIPANTS & LEADERBOARD ===================
export const registerParticipant = async (name, year, rollNo) => {
  const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const participant = {
    id,
    name: name.trim(),
    year: year.toUpperCase(),
    rollNo: rollNo.trim(),
    joinedAt: Date.now(),
    completed: false,
    solvedCount: 0,
    skippedCount: 0,
    totalQuestions: 0,
    startTime: null,
    endTime: null,
    totalSeconds: null
  };
  
  // Store in localStorage for current session
  localStorage.setItem('cc_current_participant', JSON.stringify(participant));
  
  // Add to Firebase
  await set(ref(database, `${PATHS.PARTICIPANTS}/${id}`), participant);
  
  return participant;
};

export const getCurrentParticipant = () => {
  const stored = localStorage.getItem('cc_current_participant');
  return stored ? JSON.parse(stored) : null;
};

export const updateCurrentParticipantProgress = async (updateData) => {
  const current = getCurrentParticipant();
  if (!current) return null;
  
  const updated = { ...current, ...updateData };
  localStorage.setItem('cc_current_participant', JSON.stringify(updated));
  
  // Update in Firebase
  await update(ref(database, `${PATHS.PARTICIPANTS}/${current.id}`), updateData);
  
  return updated;
};

export const getAllParticipants = async () => {
  const snapshot = await get(ref(database, PATHS.PARTICIPANTS));
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const data = snapshot.val();
  return Array.isArray(data) ? data : Object.values(data || {});
};

export const getLeaderboardByYear = async (year) => {
  const all = await getAllParticipants();
  const filtered = all.filter(p => p.year === year.toUpperCase());

  // Sorting logic:
  // 1. Completed participants first
  // 2. Highest solvedCount first
  // 3. Lowest totalSeconds first
  // 4. Lowest skippedCount
  return filtered.sort((a, b) => {
    if (a.completed && !b.completed) return -1;
    if (!a.completed && b.completed) return 1;
    if ((b.solvedCount || 0) !== (a.solvedCount || 0)) {
      return (b.solvedCount || 0) - (a.solvedCount || 0);
    }
    if (a.totalSeconds != null && b.totalSeconds != null) {
      return a.totalSeconds - b.totalSeconds;
    }
    return (a.skippedCount || 0) - (b.skippedCount || 0);
  });
};

export const clearAllLeaderboardData = async () => {
  await remove(ref(database, PATHS.PARTICIPANTS));
  localStorage.removeItem('cc_current_participant');
};

// Subscribe to participants changes for real-time leaderboard
export const subscribeToParticipants = (callback) => {
  const participantsRef = ref(database, PATHS.PARTICIPANTS);
  onValue(participantsRef, async (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const participants = Array.isArray(data) ? data : Object.values(data || {});
      callback(participants);
    }
  });
  
  return () => off(participantsRef);
};

// =================== ADMIN AUTH ===================
const DEFAULT_ADMIN_PASS = 'admin123';

export const verifyAdminPassword = async (password) => {
  try {
    const snapshot = await get(ref(database, PATHS.ADMIN_PASSWORD));
    const saved = snapshot.exists() ? snapshot.val() : DEFAULT_ADMIN_PASS;
    const isValid = password === saved;
    if (isValid) {
      sessionStorage.setItem('cc_admin_auth', 'true');
    }
    return isValid;
  } catch (error) {
    console.error('Error verifying admin password:', error);
    // If Firebase fails, fall back to default password
    const isValid = password === DEFAULT_ADMIN_PASS;
    if (isValid) {
      sessionStorage.setItem('cc_admin_auth', 'true');
    }
    return isValid;
  }
};

export const isAdminAuthenticated = () => {
  return sessionStorage.getItem('cc_admin_auth') === 'true';
};

export const logoutAdmin = () => {
  sessionStorage.removeItem('cc_admin_auth');
};

export const updateAdminPassword = async (newPassword) => {
  await set(ref(database, PATHS.ADMIN_PASSWORD), newPassword);
};

// Broadcast channel for local tab sync (still useful for same-browser tabs)
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('coding_club_competition')
  : null;

export const broadcastMessage = (type, payload = {}) => {
  if (channel) {
    channel.postMessage({ type, payload, timestamp: Date.now() });
  }
  window.dispatchEvent(new CustomEvent('cc_event', { detail: { type, payload } }));
};

export const subscribeToBroadcast = (callback) => {
  const handler = (event) => {
    callback(event.data || event.detail);
  };
  const localHandler = (event) => {
    callback(event.detail);
  };

  if (channel) {
    channel.addEventListener('message', handler);
  }
  window.addEventListener('cc_event', localHandler);

  return () => {
    if (channel) {
      channel.removeEventListener('message', handler);
    }
    window.removeEventListener('cc_event', localHandler);
  };
};
