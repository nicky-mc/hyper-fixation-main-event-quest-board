import { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = ['sci-fi', 'fantasy', 'wrestling', 'high-contrast'];

export const UI_TEXT = {
  'sci-fi': {
    feedLabel: 'Sector Scans',
    rollBtn: 'Engage Warp',
    rollingBtn: 'Warping...',
    mapBtn: 'Astrometrics',
    postBtn: 'Log Entry',
    postBtnGuest: 'Login to Log Entry 🦈',
    commentsLabel: 'Transmissions',
    noQuests: 'The Sector Awaits, Navigator...',
    noQuestsDesc: 'No signals detected. Even the sharks are waiting. Transmit the first!',
    selectedMsg: 'Coordinates locked! Nicky & Charlotte are on intercept course. 🦈⚔️',
    segmentMapTitle: '— SECTOR FREQUENCY MAP —',
  },
  'fantasy': {
    feedLabel: 'The Town Crier',
    rollBtn: 'Roll Initiative',
    rollingBtn: 'Rolling...',
    mapBtn: 'The Realm Map',
    postBtn: 'Post a Bounty',
    postBtnGuest: 'Login to Post Bounty 🦈',
    commentsLabel: 'Tavern Rumors',
    noQuests: 'The Board Awaits, Adventurer...',
    noQuestsDesc: 'No quests posted yet. Even the sharks are waiting. Be the first!',
    selectedMsg: 'Quest locked in for the episode! Nicky & Charlotte are on the case. 🦈⚔️',
    segmentMapTitle: '— EPISODE LORE MAP —',
  },
  'wrestling': {
    feedLabel: 'Backstage Pass',
    rollBtn: 'Ring the Bell!',
    rollingBtn: 'Bell\'s ringing...',
    mapBtn: 'The Squared Circle',
    postBtn: 'Cut a Promo',
    postBtnGuest: 'Login to Cut a Promo 🦈',
    commentsLabel: 'Promo Pipebombs',
    noQuests: 'The Ring Awaits, Superstar...',
    noQuestsDesc: 'No promos dropped yet. Even the sharks are waiting. Hit the mic first!',
    selectedMsg: 'The champ has been crowned for this episode! Nicky & Charlotte hit the ring. 🦈⚔️',
    segmentMapTitle: '— CARD SUBJECT TO CHANGE —',
  },
  'high-contrast': {
    feedLabel: 'Quest List',
    rollBtn: 'Select Quest',
    rollingBtn: 'Selecting...',
    mapBtn: 'Quest Map',
    postBtn: 'Submit',
    postBtnGuest: 'Login to Submit',
    commentsLabel: 'Comments',
    noQuests: 'No quests yet.',
    noQuestsDesc: 'No quests posted yet. Be the first to submit.',
    selectedMsg: 'Quest selected for the next episode.',
    segmentMapTitle: 'EPISODE SEGMENTS',
  },
};

const ThemeContext = createContext({ theme: 'sci-fi', setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hme-theme') || 'sci-fi';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hme-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}