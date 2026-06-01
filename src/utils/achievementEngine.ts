import { AchievementDef, UserProfile, UserAchievement } from '../types';

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'onboarding_clear',
    title: 'Flight Certification',
    description: 'Complete the interactive flight deck onboarding tour to obtain operational clearance.',
    badgeSymbol: '🛰️',
    category: 'onboarding',
    xpReward: 150,
  },
  {
    id: 'scen_radiation_storm',
    title: 'Solar Flare Deflector',
    description: 'Trigger the Solar Flare radiation storm cascade to stress-test your antenna grid.',
    badgeSymbol: '☀️',
    category: 'scenarios',
    xpReward: 100,
  },
  {
    id: 'scen_debris_impact',
    title: 'Micrometeorite Survivalist',
    description: 'Trigger a high-velocity debris strike and watch dynamic BFS routing repair the links.',
    badgeSymbol: '☄️',
    category: 'scenarios',
    xpReward: 100,
  },
  {
    id: 'scen_thermal_degrade',
    title: 'Thermal Deck Regulator',
    description: 'Trigger outer hull thermal cycle degradation and verify gain boosting multipliers.',
    badgeSymbol: '🔥',
    category: 'scenarios',
    xpReward: 100,
  },
  {
    id: 'topology_weaver',
    title: 'Weaver of Topology',
    description: 'Test all four network structures (Structured Grid, Hex Honeycomb, Neural Fractal, and Cluster Random).',
    badgeSymbol: '🕸️',
    category: 'topology',
    xpReward: 120,
  },
  {
    id: 'limits_max_sens',
    title: 'Hyper-Sensing Core',
    description: 'Dial up the base sensor range to the maximum limit of 16.0 cm.',
    badgeSymbol: '🌐',
    category: 'limits',
    xpReward: 80,
  },
  {
    id: 'limits_max_comm',
    title: 'Deep-Space Outreach',
    description: 'Extend the P2P communication link distance threshold to its maximum limit of 44.0 cm.',
    badgeSymbol: '📡',
    category: 'limits',
    xpReward: 80,
  },
  {
    id: 'resilience_expert',
    title: 'Apex Fault Advisor',
    description: 'Sustain 6 or more simultaneous failed nodes while keeping self-healing coverage above 80%.',
    badgeSymbol: '🛡️',
    category: 'limits',
    xpReward: 200,
  },
];

const STORAGE_KEYS = {
  USERS_DB: 'cubesat_sim_users_db',
  ACTIVE_USER: 'cubesat_sim_active_user',
};

// Simple in-memory / local storage user account database
interface UserAccount {
  username: string;
  passwordHash: string; // stored plainly in this sandbox model with basic mask
  profile: UserProfile;
}

export function getLocalUsersDB(): Record<string, UserAccount> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS_DB);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed reading users database', e);
    return {};
  }
}

export function saveLocalUsersDB(db: Record<string, UserAccount>) {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(db));
  } catch (e) {
    console.error('Failed saving users database', e);
  }
}

export function registerUser(username: string, passwordPlain: string, callsign: string): { success: boolean; error?: string; profile?: UserProfile } {
  const normUser = username.trim().toLowerCase();
  if (!normUser || !passwordPlain) {
    return { success: false, error: 'Username and passcode are mandatory.' };
  }
  
  const db = getLocalUsersDB();
  if (db[normUser]) {
    return { success: false, error: 'A flight profile with this name already exists.' };
  }

  const defaultProfile: UserProfile = {
    username: username.trim(),
    callsign: callsign.trim() || `Station-${Math.floor(100 + Math.random() * 900)}`,
    level: 1,
    xp: 0,
    achievements: [],
    customSectorName: 'Atlas Sector-C',
    autoCenterView: true,
    gridOpacity: 80,
    lastLoginAt: new Date().toISOString(),
  };

  db[normUser] = {
    username: normUser,
    passwordHash: btoa(passwordPlain), // basic mock encoding for preview client
    profile: defaultProfile,
  };

  saveLocalUsersDB(db);
  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, normUser);
  return { success: true, profile: defaultProfile };
}

export function loginUser(username: string, passwordPlain: string): { success: boolean; error?: string; profile?: UserProfile } {
  const normUser = username.trim().toLowerCase();
  const db = getLocalUsersDB();
  const acc = db[normUser];

  if (!acc || acc.passwordHash !== btoa(passwordPlain)) {
    return { success: false, error: 'Invalid Ground Control security key or callsign.' };
  }

  acc.profile.lastLoginAt = new Date().toISOString();
  db[normUser] = acc;
  saveLocalUsersDB(db);

  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, normUser);
  return { success: true, profile: acc.profile };
}

export function getActiveUser(): UserProfile | null {
  const activeName = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
  if (!activeName) return null;

  const db = getLocalUsersDB();
  const acc = db[activeName];
  return acc ? acc.profile : null;
}

export function logoutActiveUser() {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
}

export function updateActiveProfile(updatedProfile: UserProfile): UserProfile {
  const activeName = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
  if (!activeName) return updatedProfile;

  const db = getLocalUsersDB();
  const acc = db[activeName];
  if (acc) {
    acc.profile = updatedProfile;
    db[activeName] = acc;
    saveLocalUsersDB(db);
  }
  return updatedProfile;
}

export function addXPAndCheckAchievements(
  profile: UserProfile,
  xpEarned: number,
  triggerAchievementId?: string
): { updatedProfile: UserProfile; newlyUnlocked: AchievementDef[]; leveledUp: boolean } {
  let updated = { ...profile };
  const newlyUnlocked: AchievementDef[] = [];
  let leveledUp = false;

  // 1. Process potential Achievement unlocks
  if (triggerAchievementId) {
    const isAlreadyUnlocked = updated.achievements.some((a) => a.id === triggerAchievementId);
    if (!isAlreadyUnlocked) {
      const def = ACHIEVEMENT_DEFS.find((d) => d.id === triggerAchievementId);
      if (def) {
        updated.achievements.push({
          id: triggerAchievementId,
          unlockedAt: new Date().toISOString(),
        });
        newlyUnlocked.push(def);
        xpEarned += def.xpReward;
      }
    }
  }

  // 2. Add XP
  if (xpEarned > 0) {
    updated.xp += xpEarned;
    
    // Level boundary calculation: level = math.floor(xp / 200) + 1
    const targetLevel = Math.floor(updated.xp / 200) + 1;
    if (targetLevel > updated.level) {
      updated.level = targetLevel;
      leveledUp = true;
    }
  }

  // 3. Save Active User to DB
  updateActiveProfile(updated);

  return {
    updatedProfile: updated,
    newlyUnlocked,
    leveledUp,
  };
}
