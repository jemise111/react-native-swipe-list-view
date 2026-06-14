const warned = new Set<string>();

/**
 * Emits a one-time dev-only console.warn for a deprecated/removed prop (C4).
 */
export function warnOnce(propName: string, message: string): void {
    if (__DEV__ && !warned.has(propName)) {
        warned.add(propName);
        console.warn(`[react-native-swipe-list-view] ${propName}: ${message}`);
    }
}
