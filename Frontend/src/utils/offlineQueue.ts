// Frontend/src/utils/offlineQueue.ts

export interface OfflineAction {
    id: string;
    endpoint: string;
    method: 'POST' | 'PUT' | 'DELETE';
    payload: any;
    timestamp: number;
    description: string;
}

const STORAGE_KEY = 'taller_offline_queue';

export const getOfflineQueue = (): OfflineAction[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const addOfflineAction = (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const queue = getOfflineQueue();
    const newAction: OfflineAction = {
        ...action,
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now()
    };
    queue.push(newAction);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return newAction;
};

export const removeOfflineAction = (actionId: string) => {
    const queue = getOfflineQueue().filter(a => a.id !== actionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

export const clearOfflineQueue = () => {
    localStorage.removeItem(STORAGE_KEY);
};
