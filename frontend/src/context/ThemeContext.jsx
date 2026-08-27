import React, { createContext, useState, useLayoutEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('affiliate_theme') || 'dark';
  });

  useLayoutEffect(() => {
    if (document.documentElement.dataset.theme !== theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('affiliate_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
