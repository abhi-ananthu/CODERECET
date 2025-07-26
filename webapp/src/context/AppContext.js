'use client';

import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { name: 'Kevin', role: 'ngo' }
  const [reports, setReports] = useState([]);

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

