// context/DataContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { loadAppData, saveAppData, originalData } from '@/lib/data';

const DataContext = createContext({
  appData: originalData,
  updateAppData: () => {},
  resetToOriginal: () => {},
  clearAllData: () => {},
});

export function DataProvider({ children }) {
  const [appData, setAppData] = useState(originalData);

  // Defer browser data loading until after the first hydration render.
  useEffect(() => {
    const loadSavedData = window.setTimeout(() => {
      setAppData(loadAppData());
    }, 0);

    return () => window.clearTimeout(loadSavedData);
  }, []);

  // Save to localStorage whenever appData changes
  useEffect(() => {
    if (appData !== originalData) {
      saveAppData(appData);
    }
  }, [appData]);

  const updateAppData = (newData) => {
    setAppData(newData);
  };

  const resetToOriginal = () => {
    setAppData(originalData);
    saveAppData(originalData);
  };

  const clearAllData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rugbyData');
    }
    setAppData(originalData);
  };

  return (
    <DataContext.Provider value={{ appData, updateAppData, resetToOriginal, clearAllData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
