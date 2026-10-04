import { defaultChallengesSY, defaultChallengesTY } from '../data/defaultChallenges';

const KEYS = {
  SY_CHALLENGES: 'cc_challenges_sy',
  TY_CHALLENGES: 'cc_challenges_ty',
  COMPETITION_STATE: 'cc_competition_state',
  CURRENT_PARTICIPANT: 'cc_current_participant',
  PARTICIPANTS_LIST: 'cc_participants_list',
  ADMIN_AUTH: 'cc_admin_auth',
  ADMIN_PASSWORD: 'cc_admin_password',
};

// Create a broadcast channel for real-time multi-tab synchronization
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('coding_club_competition')
  : null;

export const broadcastMessage = (type, payload = {}) => {
  if (channel) {
    channel.postMessage({ type, payload, timestamp: Date.now() });
  }
  // Also dispatch a custom window event for same-tab updates
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

// =================== CHALLENGES ===================
export const getChallenges = (year = 'SY') => {
  const key = year.toUpperCase() === 'TY' ? KEYS.TY_CHALLENGES : KEYS.SY_CHALLENGES;
  const stored = localStorage.getItem(key);
  if (!stored) {
    const defaults = year.toUpperCase() === 'TY' ? defaultChallengesTY : defaultChallengesSY;
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveChallenge = (year, challenge) => {
  const challenges = getChallenges(year);
  const index = challenges.findIndex(c => c.id === challenge.id);
  let updated;
  if (index >= 0) {
    updated = [...challenges];
    updated[index] = challenge;
  } else {
    updated = [...challenges, { ...challenge, id: `${year.toLowerCase()}-${Date.now()}` }];
  }
  const key = year.toUpperCase() === 'TY' ? KEYS.TY_CHALLENGES : KEYS.SY_CHALLENGES;
  localStorage.setItem(key, JSON.stringify(updated));
  broadcastMessage('CHALLENGES_UPDATED', { year });
  return updated;
};

export const deleteChallenge = (year, id) => {
  const challenges = getChallenges(year);
  const updated = challenges.filter(c => c.id !== id);
  const key = year.toUpperCase() === 'TY' ? KEYS.TY_CHALLENGES : KEYS.SY_CHALLENGES;
  localStorage.setItem(key, JSON.stringify(updated));
  broadcastMessage('CHALLENGES_UPDATED', { year });
  return updated;
};

export const resetChallengesToDefault = (year) => {
  const key = year.toUpperCase() === 'TY' ? KEYS.TY_CHALLENGES : KEYS.SY_CHALLENGES;
  const defaults = year.toUpperCase() === 'TY' ? defaultChallengesTY : defaultChallengesSY;
  localStorage.setItem(key, JSON.stringify(defaults));
  broadcastMessage('CHALLENGES_UPDATED', { year });
  return defaults;
};

// =================== COMPETITION STATE ===================
export const getCompetitionState = () => {
  const stored = localStorage.getItem(KEYS.COMPETITION_STATE);
  if (!stored) {
    const defaultState = { status: 'WAITING', startedAt: null, endedAt: null };
    localStorage.setItem(KEYS.COMPETITION_STATE, JSON.stringify(defaultState));
    return defaultState;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return { status: 'WAITING', startedAt: null, endedAt: null };
  }
};

export const startCompetition = () => {
  const now = Date.now();
  const newState = { status: 'RUNNING', startedAt: now, endedAt: null };
  localStorage.setItem(KEYS.COMPETITION_STATE, JSON.stringify(newState));
  broadcastMessage('COMPETITION_STARTED', { startedAt: now });
  return newState;
};

export const endCompetition = () => {
  const now = Date.now();
  const current = getCompetitionState();
  const newState = { ...current, status: 'ENDED', endedAt: now };
  localStorage.setItem(KEYS.COMPETITION_STATE, JSON.stringify(newState));
  broadcastMessage('COMPETITION_ENDED', { endedAt: now });
  return newState;
};

export const resetCompetition = () => {
  const newState = { status: 'WAITING', startedAt: null, endedAt: null };
  localStorage.setItem(KEYS.COMPETITION_STATE, JSON.stringify(newState));
  broadcastMessage('COMPETITION_RESET');
  return newState;
};

// =================== PARTICIPANTS & LEADERBOARD ===================
export const registerParticipant = (name, year, rollNo) => {
  const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const participant = {
    id,
    name: name.trim(),
    year: year.toUpperCase(), // 'SY' | 'TY'
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
  localStorage.setItem(KEYS.CURRENT_PARTICIPANT, JSON.stringify(participant));

  // Add to all participants list
  const list = getAllParticipants();
  list.push(participant);
  localStorage.setItem(KEYS.PARTICIPANTS_LIST, JSON.stringify(list));
  broadcastMessage('PARTICIPANT_REGISTERED', participant);

  return participant;
};

export const getCurrentParticipant = () => {
  const stored = localStorage.getItem(KEYS.CURRENT_PARTICIPANT);
  return stored ? JSON.parse(stored) : null;
};

export const updateCurrentParticipantProgress = (updateData) => {
  const current = getCurrentParticipant();
  if (!current) return null;
  const updated = { ...current, ...updateData };
  localStorage.setItem(KEYS.CURRENT_PARTICIPANT, JSON.stringify(updated));

  // Update in global list
  const list = getAllParticipants();
  const index = list.findIndex(p => p.id === updated.id);
  if (index >= 0) {
    list[index] = updated;
  } else {
    list.push(updated);
  }
  localStorage.setItem(KEYS.PARTICIPANTS_LIST, JSON.stringify(list));
  broadcastMessage('PARTICIPANT_UPDATED', updated);
  return updated;
};

export const getAllParticipants = () => {
  const stored = localStorage.getItem(KEYS.PARTICIPANTS_LIST);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const getLeaderboardByYear = (year) => {
  const all = getAllParticipants();
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

export const clearAllLeaderboardData = () => {
  localStorage.removeItem(KEYS.PARTICIPANTS_LIST);
  localStorage.removeItem(KEYS.CURRENT_PARTICIPANT);
  broadcastMessage('LEADERBOARD_CLEARED');
};

// =================== ADMIN AUTH ===================
const DEFAULT_ADMIN_PASS = 'admin123';

export const verifyAdminPassword = (password) => {
  const saved = localStorage.getItem(KEYS.ADMIN_PASSWORD) || DEFAULT_ADMIN_PASS;
  const isValid = password === saved;
  if (isValid) {
    sessionStorage.setItem(KEYS.ADMIN_AUTH, 'true');
  }
  return isValid;
};

export const isAdminAuthenticated = () => {
  return sessionStorage.getItem(KEYS.ADMIN_AUTH) === 'true';
};

export const logoutAdmin = () => {
  sessionStorage.removeItem(KEYS.ADMIN_AUTH);
};

export const updateAdminPassword = (newPassword) => {
  localStorage.setItem(KEYS.ADMIN_PASSWORD, newPassword);
};
