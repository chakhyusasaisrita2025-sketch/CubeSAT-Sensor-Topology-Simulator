import React, { useState } from 'react';
import { UserProfile, AchievementDef } from '../types';
import {
  registerUser,
  loginUser,
  logoutActiveUser,
  updateActiveProfile,
  ACHIEVEMENT_DEFS,
} from '../utils/achievementEngine';
import {
  User,
  Shield,
  Award,
  Settings,
  LogOut,
  Sparkles,
  Lock,
  Globe,
  Database,
  UserPlus,
  Compass,
} from 'lucide-react';

interface UserProfilePanelProps {
  activeProfile: UserProfile | null;
  onProfileChange: (profile: UserProfile | null) => void;
  onOpenTour: () => void;
}

export default function UserProfilePanel({
  activeProfile,
  onProfileChange,
  onOpenTour,
}: UserProfilePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [callsign, setCallsign] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing profile fields
  const [editedCallsign, setEditedCallsign] = useState('');
  const [editedSector, setEditedSector] = useState('');
  const [editedAutoCenter, setEditedAutoCenter] = useState(true);
  const [editedGridOpacity, setEditedGridOpacity] = useState(80);

  const [activeTab, setActiveTab] = useState<'profile' | 'achievements' | 'settings'>('profile');

  // Open & pre-populate editing values
  const openPanel = () => {
    if (activeProfile) {
      setEditedCallsign(activeProfile.callsign);
      setEditedSector(activeProfile.customSectorName);
      setEditedAutoCenter(activeProfile.autoCenterView);
      setEditedGridOpacity(activeProfile.gridOpacity);
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsOpen(true);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both callsign name and passphrase.');
      return;
    }

    const res = registerUser(username, password, callsign);
    if (res.success && res.profile) {
      onProfileChange(res.profile);
      setSuccessMsg('Account registered successfully. Welcome to Ground Control.');
      setUsername('');
      setPassword('');
      setCallsign('');
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('profile');
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Failed to initialize flight station profile.');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Callsign name and secure key cannot be empty.');
      return;
    }

    const res = loginUser(username, password);
    if (res.success && res.profile) {
      onProfileChange(res.profile);
      setSuccessMsg('Satellite system access granted.');
      setUsername('');
      setPassword('');
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('profile');
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Identity verification failed.');
    }
  };

  const handleLogout = () => {
    logoutActiveUser();
    onProfileChange(null);
    setIsOpen(false);
  };

  const handleSaveSettings = () => {
    if (!activeProfile) return;
    const updated: UserProfile = {
      ...activeProfile,
      callsign: editedCallsign.trim() || activeProfile.callsign,
      customSectorName: editedSector.trim() || activeProfile.customSectorName,
      autoCenterView: editedAutoCenter,
      gridOpacity: editedGridOpacity,
    };
    const saved = updateActiveProfile(updated);
    onProfileChange(saved);
    setSuccessMsg('System configuration modified and saved.');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  // XP calculation
  const xpInCurrentLevel = activeProfile ? (activeProfile.xp % 200) : 0;
  const xpPercent = (xpInCurrentLevel / 200) * 100;

  return (
    <>
      {/* 1. Header Capsule Display Button */}
      <div className="flex items-center gap-3">
        {activeProfile ? (
          <button
            onClick={openPanel}
            className="h-10 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#d4af37]/40 flex items-center gap-3 transition-all text-left cursor-pointer"
            id="open-profile-hud"
          >
            <div className="relative">
              <div className="w-6 h-6 rounded-md bg-[#d4af37]/10 border border-[#d4af37]/40 flex items-center justify-center text-[10px] font-mono text-[#d4af37] font-bold">
                {activeProfile.username.substring(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border border-black rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 leading-none uppercase font-mono tracking-wider">Level {activeProfile.level} Flight Deck</p>
              <p className="text-xs text-white/80 font-semibold font-mono leading-tight">{activeProfile.callsign}</p>
            </div>
          </button>
        ) : (
          <button
            onClick={openPanel}
            className="h-10 px-4 border border-[#d4af37]/40 rounded bg-gradient-to-r from-emerald-500/5 to-[#d4af37]/5 flex items-center justify-center text-[10px] uppercase tracking-wider font-bold text-[#d4af37] hover:from-emerald-500/10 hover:to-[#d4af37]/10 transition-colors cursor-pointer mr-2.5"
            id="register-profile-button"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5 text-[#d4af37]" />
            <span>Establish Profile</span>
          </button>
        )}
      </div>

      {/* 2. Slide Drawer / Overlay Terminal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end">
          {/* Backdrop Clicker */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsOpen(false)} />

          <div className="w-full max-w-md bg-[#070708] border-l border-white/15 h-full z-10 p-6 flex flex-col justify-between shadow-2xl relative">
            {/* Embedded grid mesh background */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.01] pointer-events-none" />

            <div className="space-y-6 overflow-y-auto flex-1 pb-4 pr-1 scrollbar-thin">
              {/* Profile Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-[#d4af37]/10 rounded border border-[#d4af37]/20 text-[#d4af37]">
                    <Shield className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono text-white/40 block uppercase tracking-wide">Command Center Console</span>
                    <h2 className="text-lg font-light text-white font-serif" style={{ fontFamily: 'Georgia, serif' }}>
                      Profile & Achievements
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest border border-white/10 rounded hover:bg-white/5 cursor-pointer text-white/50 hover:text-white"
                >
                  Close
                </button>
              </div>

              {/* Success/Error Toast HUD */}
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded text-[11px] font-mono leading-relaxed">
                  ⚠️ ERROR: {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded text-[11px] font-mono leading-relaxed">
                  ✓ SUCCESS: {successMsg}
                </div>
              )}

              {/* MAIN BODY CONTENTS */}
              {!activeProfile ? (
                /* AUTHENTICATION VIEW */
                <div className="space-y-5">
                  <div className="bg-white/[0.02] border border-white/15 p-4 rounded-lg">
                    <span className="text-[#d4af37] text-[10px] font-mono uppercase tracking-widest block font-bold mb-1.5">SECURE MISSION ENVELOPE</span>
                    <p className="text-white/50 text-[11px] leading-relaxed font-mono">
                      Authorize node access to establish simulation parameters, save layout selections, store operational settings, and unlock specialized flight achievements.
                    </p>
                  </div>

                  <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">Callsign Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. CommanderCranston"
                        className="w-full bg-[#070708] border border-white/10 rounded p-2.5 text-xs text-white placeholder-white/20 font-mono focus:border-[#d4af37]/60 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">Station Access Key (Password)</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#070708] border border-white/10 rounded p-2.5 text-xs text-white placeholder-white/20 font-mono focus:border-[#d4af37]/60 focus:outline-none"
                      />
                    </div>

                    {isRegisterMode && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">Station Callsign (Optional)</label>
                        <input
                          type="text"
                          value={callsign}
                          onChange={(e) => setCallsign(e.target.value)}
                          placeholder="e.g. ATALAS-OMEGA"
                          className="w-full bg-[#070708] border border-white/10 rounded p-2.5 text-xs text-white placeholder-white/20 font-mono focus:border-[#d4af37]/60 focus:outline-none"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full h-11 bg-[#d4af37] text-black font-bold uppercase text-[10px] tracking-widest rounded hover:opacity-95 transition-opacity mt-4 cursor-pointer"
                    >
                      {isRegisterMode ? 'Establish Flight Terminal' : 'Authenticate Session'}
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <button
                      onClick={() => {
                        setIsRegisterMode(!isRegisterMode);
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[10px] font-mono text-[#d4af37] underline tracking-widest hover:text-white transition-colors uppercase cursor-pointer"
                    >
                      {isRegisterMode ? 'Already registered? Log in here' : 'New Flight Officer? Register free profile'}
                    </button>
                  </div>
                </div>
              ) : (
                /* AUTHENTICATED LOGGED IN WINDOW */
                <div className="space-y-5">
                  
                  {/* Tab Selector buttons */}
                  <div className="grid grid-cols-3 border-b border-white/10">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`pb-2.5 text-[10px] font-mono uppercase tracking-widest text-center cursor-pointer ${
                        activeTab === 'profile'
                          ? 'border-b-2 border-[#d4af37] text-white font-bold'
                          : 'text-white/40 hover:text-white/80'
                      }`}
                    >
                      Profile HUD
                    </button>
                    <button
                      onClick={() => setActiveTab('achievements')}
                      className={`pb-2.5 text-[10px] font-mono uppercase tracking-widest text-center cursor-pointer ${
                        activeTab === 'achievements'
                          ? 'border-b-2 border-[#d4af37] text-white font-bold'
                          : 'text-white/40 hover:text-white/80'
                      }`}
                    >
                      Medals ({activeProfile.achievements.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`pb-2.5 text-[10px] font-mono uppercase tracking-widest text-center cursor-pointer ${
                        activeTab === 'settings'
                          ? 'border-b-2 border-[#d4af37] text-white font-bold'
                          : 'text-white/40 hover:text-white/80'
                      }`}
                    >
                      Settings
                    </button>
                  </div>

                  {/* ACTIVE TAB 1: PROFILE HUB */}
                  {activeTab === 'profile' && (
                    <div className="space-y-5 relative">
                      {/* Avatar & Class display */}
                      <div className="bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 rounded-xl p-5 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 flex flex-col items-center justify-center">
                          <span className="text-[22px] font-mono text-[#d4af37] font-light">L{activeProfile.level}</span>
                          <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">RANK</span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold text-white font-mono">{activeProfile.callsign}</p>
                          <p className="text-[10px] uppercase font-mono text-white/40 leading-none flex items-center gap-1">
                            <Globe className="w-3 h-3 text-[#d4af37]" />
                            <span>Station: {activeProfile.customSectorName}</span>
                          </p>
                          <p className="text-[9px] font-mono text-[#d4af37] leading-none">
                            Registered Account: {activeProfile.username}
                          </p>
                        </div>
                      </div>

                      {/* XP Meter Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-white/40 uppercase tracking-widest">Mission Progress Meter</span>
                          <span className="text-white/80">{activeProfile.xp} total XP</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-[#d4af37] transition-all duration-500 rounded-full"
                            style={{ width: `${xpPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-[#94a3b8] font-mono">
                          <span>CLASS {activeProfile.level} OFFICER</span>
                          <span>{200 - xpInCurrentLevel} XP UNTIL LEVEL {activeProfile.level + 1}</span>
                        </div>
                      </div>

                      {/* Summary Data grid */}
                      <div className="grid grid-cols-2 gap-3 bg-white/[0.01] border border-white/5 rounded-xl p-4">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-mono text-white/30 block">Station Status</span>
                          <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            TELEMETRY OK
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-mono text-white/30 block">System Medals</span>
                          <span className="text-xs font-mono text-white/80 font-semibold">
                            {activeProfile.achievements.length} out of {ACHIEVEMENT_DEFS.length} Unlocked
                          </span>
                        </div>
                      </div>

                      {/* Quick launch onboarding button */}
                      <button
                        onClick={onOpenTour}
                        className="w-full py-2.5 border border-[#d4af37]/30 bg-[#d4af37]/5 hover:bg-[#d4af37]/15 rounded text-white text-[10px] uppercase font-semibold font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Restart Onboarding Walkthrough</span>
                      </button>
                    </div>
                  )}

                  {/* ACTIVE TAB 2: ACHIEVEMENTS MEDALS */}
                  {activeTab === 'achievements' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono text-white/50 mb-1">
                        <span>Total Achievements Points Unlocked:</span>
                        <span className="text-[#d4af37] font-bold">
                          {activeProfile.achievements.length * 100} / 810 XP
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                        {ACHIEVEMENT_DEFS.map((def) => {
                          const userUnlockInfo = activeProfile.achievements.find(
                            (a) => a.id === def.id
                          );
                          const isUnlocked = !!userUnlockInfo;

                          return (
                            <div
                              key={def.id}
                              className={`p-3 rounded border transition-all ${
                                isUnlocked
                                  ? 'bg-emerald-500/[0.03] border-emerald-500/30 text-white'
                                  : 'bg-white/[0.01] border-white/5 text-white/35'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className={`w-9 h-9 rounded flex items-center justify-center border text-base ${
                                      isUnlocked
                                        ? 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#d4af37]'
                                        : 'bg-[#070708] border-white/10 opacity-40'
                                    }`}
                                  >
                                    {isUnlocked ? def.badgeSymbol : <Lock className="w-4 h-4" />}
                                  </span>
                                  <div>
                                    <h4 className="text-xs font-semibold font-mono">
                                      {def.title}
                                    </h4>
                                    <p className="text-[10px] leading-relaxed mt-0.5 opacity-80 font-mono">
                                      {def.description}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`text-[10px] font-mono font-bold block ${isUnlocked ? 'text-[#d4af37]' : 'text-white/20'}`}>
                                    +{def.xpReward} XP
                                  </span>
                                  {isUnlocked && (
                                    <span className="text-[8px] text-emerald-400 font-mono block mt-1 uppercase">
                                      UNLOCKED
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ACTIVE TAB 3: SETTINGS EDITOR */}
                  {activeTab === 'settings' && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">Operational Callsign</label>
                        <input
                          type="text"
                          value={editedCallsign}
                          onChange={(e) => setEditedCallsign(e.target.value)}
                          className="w-full bg-[#070708] border border-white/10 rounded p-2.5 text-xs text-white font-mono focus:border-[#d4af37]/60 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">Assigned CubeSat Sector Name</label>
                        <input
                          type="text"
                          value={editedSector}
                          onChange={(e) => setEditedSector(e.target.value)}
                          className="w-full bg-[#070708] border border-white/10 rounded p-2.5 text-xs text-white font-mono focus:border-[#d4af37]/60 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between border-t border-b border-white/5 py-3">
                        <div>
                          <span className="text-[10px] font-semibold text-white/80 font-mono block">Anchor 3D Center Camera</span>
                          <span className="text-[9px] text-white/30 font-mono block">Dynamically reset angles upon changing mesh structures</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={editedAutoCenter}
                          onChange={(e) => setEditedAutoCenter(e.target.checked)}
                          className="w-4 h-4 rounded text-[#d4af37] accent-[#d4af37] bg-black/60 border-white/20 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">Mesh Wireframe Opacity</span>
                          <span className="font-mono text-white font-bold">{editedGridOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          step="10"
                          value={editedGridOpacity}
                          onChange={(e) => setEditedGridOpacity(Number(e.target.value))}
                          className="w-full h-1 bg-white/5 hover:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                        />
                      </div>

                      <button
                        onClick={handleSaveSettings}
                        className="w-full h-10 bg-[#d4af37] text-black font-bold uppercase text-[10px] tracking-widest rounded hover:opacity-95 transition-opacity mt-4 cursor-pointer"
                      >
                        Commit Hardware Changes
                      </button>
                    </div>
                  )}

                  {/* Operational signoff/logout button */}
                  <div className="border-t border-white/10 pt-4 flex gap-2">
                    <button
                      onClick={handleLogout}
                      className="flex-1 py-2 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-[10px] uppercase font-semibold font-mono tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Purge Terminal Session</span>
                    </button>
                  </div>

                </div>
              )}

            </div>

            {/* Bottom System Logs Signature */}
            <div className="border-t border-white/10 pt-4 mt-4 text-[9px] tracking-widest text-[#94a3b8]/30 uppercase font-mono relative z-10">
              <div className="flex justify-between flex-wrap gap-2">
                <span className="flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  PERSISTENCE STATE: LOCALSTORAGE
                </span>
                <span>SECURE KEY AUTH</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
