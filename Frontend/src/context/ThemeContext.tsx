// Frontend/src/context/ThemeContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api/axios';

interface ThemeContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('taller_theme');
        return (saved === 'dark' || saved === 'light') ? saved : 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('taller_theme', theme);
    }, [theme]);

    const toggleTheme = async () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        try {
            await api.put('/usuarios/me/tema', { preferencia_tema: nextTheme });
        } catch {
            // Fallback silencioso
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
