import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MUIThemeProvider, type Theme } from '@mui/material/styles';
import { getTheme } from '../theme';

interface ThemeContextType {
      mode: 'light' | 'dark';
      toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
      mode: 'light',
      toggleTheme: () => { },
});

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const [mode, setMode] = useState<'light' | 'dark'>('light');

      useEffect(() => {
            const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark';
            if (savedMode) {
                  setMode(savedMode);
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  setMode('dark');
            }
      }, []);

      const toggleTheme = () => {
            const newMode = mode === 'light' ? 'dark' : 'light';
            setMode(newMode);
            localStorage.setItem('themeMode', newMode);
      };

      const theme: Theme = getTheme(mode);

      return (
            <ThemeContext.Provider value={{ mode, toggleTheme }}>
                  <MUIThemeProvider theme={theme}>
                        {children}
                  </MUIThemeProvider>
            </ThemeContext.Provider>
      );
};
