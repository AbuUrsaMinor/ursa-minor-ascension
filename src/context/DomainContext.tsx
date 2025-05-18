import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type Domain = 'creator' | 'viewer';

interface DomainContextType {
    domain: Domain;
    setDomain: (domain: Domain) => void;
    isCreator: boolean;
    isViewer: boolean;
}

const DomainContext = createContext<DomainContextType>({
    domain: 'viewer',
    setDomain: () => { },
    isCreator: false,
    isViewer: true
});

export function DomainProvider({ children }: { children: ReactNode }) {
    const [domain, setDomain] = useState<Domain>('viewer');
    const location = useLocation();

    // Automatically update domain based on current route
    useEffect(() => {
        // Creator domain routes
        const creatorRoutes = [
            '/creator',
            '/capture',
            '/creator/dashboard',
            '/creator/series',
            '/review'
        ];
        // Viewer domain routes
        const viewerRoutes = [
            '/viewer',
            '/viewer/dashboard',
            '/viewer/series',
            '/studypacks',
            '/studypack',
            '/viewer/studypacks',
            '/viewer/studypack'
        ];

        // Default to current domain
        let newDomain = domain;

        // Check if the current path starts with any of the creator paths
        if (creatorRoutes.some(route => location.pathname.startsWith(route))) {
            newDomain = 'creator';
        }
        // Check if the current path starts with any of the viewer paths
        else if (viewerRoutes.some(route => location.pathname.startsWith(route))) {
            newDomain = 'viewer';
        }
        // For series detail routes
        else if (location.pathname.includes('/series/')) {
            // Check if it's a creator or viewer series path
            if (location.pathname.includes('/creator/series/')) {
                newDomain = 'creator';
            } else if (location.pathname.includes('/viewer/series/')) {
                newDomain = 'viewer';
            }
        }

        if (newDomain !== domain) {
            setDomain(newDomain);
        }
    }, [location.pathname, domain]);

    // Computed properties for easier usage
    const isCreator = domain === 'creator';
    const isViewer = domain === 'viewer';

    return (
        <DomainContext.Provider value={{
            domain,
            setDomain,
            isCreator,
            isViewer
        }}>
            {children}
        </DomainContext.Provider>
    );
}

export function useDomain() {
    return useContext(DomainContext);
}
