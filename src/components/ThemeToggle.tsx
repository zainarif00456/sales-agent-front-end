import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';
import { motion } from 'framer-motion';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] 
                 hover:bg-[var(--bg-tertiary)] transition-all duration-300"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
            )}
        </motion.button>
    );
};
