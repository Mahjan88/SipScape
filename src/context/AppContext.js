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
  const [xp, setXP] = useState(INITIAL_STATE.xp);
  const [stamps, setStamps] = useState(INITIAL_STATE.stamps);
  const [bingo, setBingo] = useState(INITIAL_STATE.bingo);
  const [spinHistory, setSpinHistory] = useState(INITIAL_STATE.spinHistory);
  const [streak, setStreak] = useState(INITIAL_STATE.streak);

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

  const stampCount = stamps.filter(Boolean).length;

  const getTierInfo = useCallback(() => {
    const count = stamps.filter(Boolean).length;
    if (count >= 9) return { name: 'Coffee Legend', emoji: '👑', next: null, needed: 9 };
    if (count >= 6) return { name: 'Neighborhood Barista', emoji: '☕', next: 'Coffee Legend', needed: 9 };
    if (count >= 3) return { name: 'Caffeine Explorer', emoji: '🌟', next: 'Neighborhood Barista', needed: 6 };
    return { name: 'Ballard Beginner', emoji: '🌱', next: 'Caffeine Explorer', needed: 3 };
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
