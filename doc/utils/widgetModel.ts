export function createWidgetModel(initialData: any[] = []) {
    const listeners = new Map<string, Set<Function>>();
    const state: Record<string, any> = {
        data: initialData,
        selected_indices: [],
    };
    return {
        get: (k: string) => state[k],
        set: (k: string, v: any) => { state[k] = v; },
        save_changes: () => {
            for (const [key, subs] of listeners) {
                const change = { name: key, new: state[key] };
                subs.forEach((fn) => {
                    try { fn(change); } catch { }
                });
            }
        },
        on: (eventName: string, handler: Function) => {
            const key = eventName.startsWith('change:') ? eventName.slice(7) : eventName;
            const set = listeners.get(key) || new Set();
            set.add(handler);
            listeners.set(key, set);
        },
        off: (eventName: string, handler: Function) => {
            const key = eventName.startsWith('change:') ? eventName.slice(7) : eventName;
            const set = listeners.get(key);
            if (set) set.delete(handler);
        },
        observe: (handler: Function, names?: string | string[]) => {
            const keys = Array.isArray(names) ? names : names ? [names] : Object.keys(state);
            keys.forEach((k) => {
                const set = listeners.get(k) || new Set();
                set.add(handler);
                listeners.set(k, set);
            });
        },
    };
}
