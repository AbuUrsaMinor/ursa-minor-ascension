import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useDomain } from '../context/DomainContext';

export function ViewerLayout() {
    const { setDomain } = useDomain();
    const location = useLocation();

    // Set domain to viewer when this layout is mounted
    useEffect(() => {
        setDomain('viewer');
    }, [setDomain]);

    // Determine if a nav link is active
    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with viewer-specific navigation */}
            <header className="bg-green-600 text-white shadow-md">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <h1 className="text-xl font-semibold">Study Mode</h1>
                        </div>                        <nav className="flex items-center space-x-4">                            <Link
                            to="/viewer/dashboard"
                            className={`px-3 py-2 rounded-md ${isActive('/viewer/dashboard') ? 'bg-green-700' : 'hover:bg-green-700'}`}
                        >
                            Study Packs
                        </Link>
                            <Link
                                to="/"
                                className="px-3 py-2 rounded-md hover:bg-green-700"
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
