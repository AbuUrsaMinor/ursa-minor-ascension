import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useDomain } from '../context/DomainContext';

export function CreatorLayout() {
    const { setDomain } = useDomain();
    const location = useLocation();

    // Set domain to creator when this layout is mounted
    useEffect(() => {
        setDomain('creator');
    }, [setDomain]);

    // Determine if a nav link is active
    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with creator-specific navigation */}
            <header className="bg-blue-600 text-white shadow-md">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <h1 className="text-xl font-semibold">Creator Mode</h1>
                        </div>                        <nav className="flex items-center space-x-4">
                            <Link
                                to="/creator/dashboard"
                                className={`px-3 py-2 rounded-md ${isActive('/creator/dashboard') ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/"
                                className="px-3 py-2 rounded-md hover:bg-blue-700"
                            >
                                Switch Mode
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-4 py-6">
                <Outlet />
            </main>
        </div>
    );
}
