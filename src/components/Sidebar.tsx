import { NavLink } from 'react-router-dom';
import { Home, Users, MessageSquare, LogOut, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { motion } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/agents', icon: Users, label: 'Agents' },
    { to: '/conversations', icon: MessageSquare, label: 'Conversations' },
    { to: '/documentation', icon: FileText, label: 'Documentation' },
];

export const Sidebar = () => {
    const { user, logout } = useAuthStore();

    return (
        <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            className="w-64 h-screen bg-[var(--bg-secondary)] border-r border-[var(--border-color)] 
                 flex flex-col fixed left-0 top-0 z-50"
        >
            {/* Logo */}
            <div className="p-6 border-b border-[var(--border-color)]">
                <h1 className="text-2xl font-bold gradient-text">Sales Assistant</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
               ${isActive
                                ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User Info & Actions */}
            <div className="p-4 border-t border-[var(--border-color)] space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {user?.full_name || user?.username}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">{user?.email}</p>
                    </div>
                    <ThemeToggle />
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 
                     bg-red-500 hover:bg-red-600 text-white rounded-lg 
                     transition-all duration-300"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </motion.button>
            </div>
        </motion.aside>
    );
};
