import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext();

const INITIAL_STATE = {
  xp: 120,
  stamps: [true, true, true, true, false, false, false, false, false],
  bingo: Array(16).fill(false).map((_, i) => [0, 2, 6].includes(i)),
  spinHistory: [],
  streak: 3,
};

export function AppProvider({ children }) {
  // Auth & profile state
  const [authState, setAuthState] = useState('welcome'); // welcome | phone | onboarding | authenticated
  const [profile, setProfile] = useState({
    phone: '',
    firstName: '',
    username: '',
    birthday: '',
    location: '',
    avatar: '😊',
    drinks: [],
    milk: '',
  });

  // Game state
  const [xp, setXP] = useState(INITIAL_STATE.xp);
  const [stamps, setStamps] = useState(INITIAL_STATE.stamps);
  const [bingo, setBingo] = useState(INITIAL_STATE.bingo);
  const [spinHistory, setSpinHistory] = useState(INITIAL_STATE.spinHistory);
  const [streak, setStreak] = useState(INITIAL_STATE.streak);
  // Hunt: Set of cafe IDs the user has collected a cup from (one-time per user)
  const [collectedCups, setCollectedCups] = useState(new Set());

  const addXP = useCallback((amount) => {
    setXP((prev) => prev + amount);
  }, []);

  const collectStamp = useCallback((index) => {
    setStamps((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    addXP(30);
  }, [addXP]);

  const completeBingo = useCallback((index) => {
    setBingo((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    addXP(15);
  }, [addXP]);

  const addSpin = useCallback((result) => {
    setSpinHistory((prev) => [result, ...prev].slice(0, 5));
    addXP(10);
  }, [addXP]);

  // Hunt: collect a cup at a cafe (one-time per user, awards points from cafe.points)
  const collectCup = useCallback((cafeId, points = 50) => {
    setCollectedCups((prev) => {
      if (prev.has(cafeId)) return prev; // already collected
      const next = new Set(prev);
      next.add(cafeId);
      return next;
    });
    addXP(points);
    // Also award a passport stamp if not already earned (maps cafe ID to stamp index)
    const stampIndex = cafeId - 1; // cafe IDs are 1-9, stamps array is 0-8
    setStamps((prev) => {
      if (prev[stampIndex]) return prev;
      const next = [...prev];
      next[stampIndex] = true;
      return next;
    });
  }, [addXP]);

  const stampCount = stamps.filter(Boolean).length;

  const getTierInfo = useCallback(() => {
    const count = stamps.filter(Boolean).length;
    if (count >= 9) return { name: 'Coffee Legend', emoji: '👑', next: null, needed: 9 };
    if (count >= 6) return { name: 'Neighborhood Regular', emoji: '☕', next: 'Coffee Legend', needed: 9 };
    if (count >= 3) return { name: 'Caffeine Explorer', emoji: '🌟', next: 'Neighborhood Regular', needed: 6 };
    return { name: 'First Sip', emoji: '🌱', next: 'Caffeine Explorer', needed: 3 };
  }, [stamps]);

  const checkBingoLine = useCallback(() => {
    for (let r = 0; r < 4; r++) {
      if (bingo[r * 4] && bingo[r * 4 + 1] && bingo[r * 4 + 2] && bingo[r * 4 + 3]) return true;
    }
    for (let c = 0; c < 4; c++) {
      if (bingo[c] && bingo[c + 4] && bingo[c + 8] && bingo[c + 12]) return true;
    }
    return false;
  }, [bingo]);

  const bingoCompletedCount = bingo.filter(Boolean).length;

  const bingoRowCount = (() => {
    let rows = 0;
    for (let r = 0; r < 4; r++) {
      if (bingo[r * 4] && bingo[r * 4 + 1] && bingo[r * 4 + 2] && bingo[r * 4 + 3]) rows++;
    }
    for (let c = 0; c < 4; c++) {
      if (bingo[c] && bingo[c + 4] && bingo[c + 8] && bingo[c + 12]) rows++;
    }
    return rows;
  })();

  return (
    <AppContext.Provider
      value={{
        // Auth & profile
        authState,
        setAuthState,
        profile,
        setProfile,
        // Game state
        xp,
        stamps,
        bingo,
        spinHistory,
        streak,
        stampCount,
        addXP,
        collectStamp,
        completeBingo,
        addSpin,
        getTierInfo,
        checkBingoLine,
        bingoCompletedCount,
        bingoRowCount,
        collectedCups,
        collectCup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
