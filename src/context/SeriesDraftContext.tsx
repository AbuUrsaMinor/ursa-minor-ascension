import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Page, SeriesDraft } from '../types';

interface SeriesDraftContextType {
    draft: SeriesDraft | null;
    initializeDraft: () => void;
    addPage: (page: Omit<Page, 'id'>) => string;
    updatePage: (id: string, updates: Partial<Omit<Page, 'id'>>) => void;
    removePage: (id: string) => void;
    setSeriesName: (name: string) => void;
    clearDraft: () => void;
}

const SeriesDraftContext = createContext<SeriesDraftContextType>({
    draft: null,
    initializeDraft: () => { },
    addPage: () => '',
    updatePage: () => { },
    removePage: () => { },
    setSeriesName: () => { },
    clearDraft: () => { }
});

export function SeriesDraftProvider({ children }: { children: ReactNode }) {
    const [draft, setDraft] = useState<SeriesDraft | null>(null);

    const initializeDraft = useCallback(() => {
        setDraft({
            pages: []
        });
    }, []);

    const addPage = useCallback((page: Omit<Page, 'id'>) => {
        const id = uuidv4();
        setDraft(current => {
            if (!current) return { pages: [{ ...page, id }] };
            return {
                ...current,
                pages: [...current.pages, { ...page, id }]
            };
        });
        return id;
    }, []); const updatePage = useCallback((id: string, updates: Partial<Omit<Page, 'id'>>) => {
        console.log('Updating page:', id, 'with data:', updates);
        setDraft(current => {
            if (!current) {
                console.error('Cannot update page: draft is null');
                return null;
            }

            const pageExists = current.pages.some(p => p.id === id);
            if (!pageExists) {
                console.error(`Cannot update page: page with ID ${id} not found`);
                console.log('Available pages:', current.pages.map(p => p.id));
                return current;
            }

            const updatedDraft = {
                ...current,
                pages: current.pages.map(page => {
                    if (page.id === id) {
                        const updatedPage = { ...page, ...updates };
                        console.log('Page updated from:', page, 'to:', updatedPage);
                        return updatedPage;
                    }
                    return page;
                })
            };
            return updatedDraft;
        });
    }, []);

    const removePage = useCallback((id: string) => {
        setDraft(current => {
            if (!current) return null;
            return {
                ...current,
                pages: current.pages.filter(page => page.id !== id)
            };
        });
    }, []);

    const setSeriesName = useCallback((name: string) => {
        setDraft(current => {
            if (!current) return null;
            return {
                ...current,
                name
            };
        });
    }, []);

    const clearDraft = useCallback(() => {
        setDraft(null);
    }, []);

    return (
        <SeriesDraftContext.Provider
            value={{
                draft,
                initializeDraft,
                addPage,
                updatePage,
                removePage,
                setSeriesName,
                clearDraft
            }}
        >
            {children}
        </SeriesDraftContext.Provider>
    );
}

export function useSeriesDraft() {
    return useContext(SeriesDraftContext);
}
