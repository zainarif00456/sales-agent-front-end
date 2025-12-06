import { NavLink } from 'react-router-dom';
import { Home, Users, MessageSquare, LogOut, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';

const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/agents', icon: Users, label: 'Agents' },
    { to: '/conversations', icon: MessageSquare, label: 'Conversations' },
    { to: '/documentation', icon: FileText, label: 'Documentation' },
];

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: (collapsed: boolean) => void;
}

export const Sidebar = ({ collapsed: controlledCollapsed, onToggle }: SidebarProps = {}) => {
    const { user, logout } = useAuthStore();
    const [internalCollapsed, setInternalCollapsed] = useState(false);

    const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

    const handleToggle = () => {
        const newState = !isCollapsed;
        if (onToggle) {
            onToggle(newState);
        } else {
            setInternalCollapsed(newState);
        }
    };

    return (
        <motion.aside
            initial={{ x: -300 }}
            animate={{
                x: 0,
                width: isCollapsed ? '80px' : '256px'
            }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="h-screen bg-[var(--bg-secondary)] border-r border-[var(--border-color)] 
                 flex flex-col fixed left-0 top-0 z-50"
        >
            {/* Logo & Toggle */}
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-2xl font-bold gradient-text"
                        >
                            Sales Assistant
                        </motion.h1>
                    )}
                </AnimatePresence>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggle}
                    className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--accent-primary)] 
                             hover:text-white transition-all duration-200"
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </motion.button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-all duration-300
               ${isActive
                                ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                            }`
                        }
                        title={isCollapsed ? item.label : undefined}
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <AnimatePresence mode="wait">
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium whitespace-nowrap"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </NavLink>
                ))}
            </nav>

            {/* User Info & Actions */}
            <div className="p-4 border-t border-[var(--border-color)] space-y-4">
                {!isCollapsed ? (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                    {user?.full_name || user?.username}
                                </p>
                                <p className="text-xs text-[var(--text-secondary)] truncate">{user?.email}</p>
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
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <ThemeToggle />
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={logout}
                            className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white 
                                     transition-all duration-300"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </motion.button>
                    </div>
                )}
            </div>
        </motion.aside>
    );
};
