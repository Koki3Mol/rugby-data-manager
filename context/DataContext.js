// context/DataContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { loadAppData, saveAppData, originalData } from '@/lib/data';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [appData, setAppData] , useState(originalData); // initial dummy

  // Load from localStorage on mount
  useEffect(() => {
    setAppData(loadAppData());
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
    localStorage.setItem('rugbyData', JSON.stringify(originalData));
  };

  const clearAllData = () => {
    localStorage.removeItem('rugbyData');
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