import type { DBSchema, IDBPDatabase } from 'idb';
import { openDB } from 'idb';
import type { Series } from '../types';

interface AscensionDB extends DBSchema {
    series: {
        key: string;
        value: Series;
        indexes: {
            'by-date': string;
        };
    }; settings: {
        key: string;
        value: {
            id?: string;
            connectionKey?: string;
        };
    };
}

const DB_NAME = 'ascension-db';
const DB_VERSION = 2;

async function initDB(): Promise<IDBPDatabase<AscensionDB>> {
    return openDB<AscensionDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
            if (oldVersion < 1) {
                // Create series store
                const seriesStore = db.createObjectStore('series', {
                    keyPath: 'id'
                });
                seriesStore.createIndex('by-date', 'createdAt');

                // Create settings store
                db.createObjectStore('settings', {
                    keyPath: 'id'
                });
            }

            // Version 2: Add flashcards support
            if (oldVersion < 2) {
                console.log('Upgrading database to version 2: Adding flashcards support');
                // No schema change needed as the flashcards will be stored within the Series object
                // The structure is handled at the application level
            }
        },
    });
}

let dbPromise: Promise<IDBPDatabase<AscensionDB>>;

function getDB() {
    if (!dbPromise) {
        dbPromise = initDB();
    }
    return dbPromise;
}

export async function saveSeries(series: Series): Promise<void> {
    const db = await getDB();
    await db.put('series', series);
}

export async function getAllSeries(): Promise<Series[]> {
    const db = await getDB();
    return db.getAllFromIndex('series', 'by-date');
}

export async function getSeries(id: string): Promise<Series | undefined> {
    const db = await getDB();
    return db.get('series', id);
}

export async function deleteSeries(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('series', id);
}

export async function saveConnectionKey(key: string): Promise<void> {
    const db = await getDB();
    await db.put('settings', { id: 'connection', connectionKey: key });
}

export async function getConnectionKey(): Promise<string | undefined> {
    const db = await getDB();
    const settings = await db.get('settings', 'connection');
    return settings?.connectionKey;
}

// Check if the app is in private mode (IndexedDB unavailable)
export async function isPrivateMode(): Promise<boolean> {
    try {
        await getDB();
        return false;
    } catch {
        return true;
    }
}
