
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext();
export const useUser = () => useContext(AppContext); 

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null); // persists to localStorage
  const [reports, setReports] = useState([]); // optional: sto

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Store user in localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  return (
    <AppContext.Provider value={{ user, setUser, reports, setReports }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

