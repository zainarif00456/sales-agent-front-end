import { useState } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-[var(--bg-primary)]">
            <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
            <main
                className="flex-1 p-4 transition-all duration-300"
                style={{
                    marginLeft: sidebarCollapsed ? '80px' : '256px'
                }}
            >
                {children}
            </main>
        </div>
    );
};
