// lib/data.js
export const leagueData = { /* ... your original leagueData object ... */ };
export const leagueMatches = [ /* ... */ ];
export const cupPools = { /* ... */ };
export const shieldPools = { /* ... */ };
export const cupMatches = [ /* ... */ ];
export const shieldMatches = [ /* ... */ ];

export const originalData = {
  leagueData,
  leagueMatches,
  cupPools,
  shieldPools,
  cupMatches,
  shieldMatches,
};

// Helper to load from localStorage or fallback to original
export function loadAppData() {
  if (typeof window === 'undefined') return originalData; // server
  try {
    const saved = localStorage.getItem('rugbyData');
    return saved ? JSON.parse(saved) : originalData;
  } catch {
    return originalData;
  }
}

// Helper to save to localStorage
export function saveAppData(data) {
  localStorage.setItem('rugbyData', JSON.stringify(data));
}s