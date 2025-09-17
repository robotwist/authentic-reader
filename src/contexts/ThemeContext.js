import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useState, useContext, useEffect } from 'react';
const ThemeContext = createContext(undefined);
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('dark');
    const [isDarkMode, setIsDarkMode] = useState(true);
    // Initialize theme from localStorage if available
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
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
        }
        else {
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
    return (_jsx(ThemeContext.Provider, { value: value, children: children }));
};
// Custom hook to use the theme context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
