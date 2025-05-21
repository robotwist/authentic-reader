import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Initialize theme from localStorage if available
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    // Always initialize as dark mode based on your App.tsx preferences
    setIsDarkMode(true);
    document.documentElement.classList.add('dark-mode');
  }, []);

  // Update localStorage and apply theme when it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    // Since the App.tsx is forcing dark mode, we'll ensure it stays that way
    // but this logic is here for future flexibility
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
    }
  }, [theme, isDarkMode]);

  // Toggle dark mode 
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const value = {
    theme,
    setTheme,
    isDarkMode,
    toggleDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 