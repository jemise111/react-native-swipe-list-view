/**
 * TEMPORARY (Phase 6 only — removed in Phase 8 together with components/).
 *
 * Runtime switch between the v4 library (../src) and the frozen v3 reference
 * implementation (../components) so every example can be compared
 * side-by-side on-device. Metro resolves the package name
 * 'react-native-swipe-list-view' to this file (see metro.config.js), so the
 * example files import the library normally and don't know about the switch.
 *
 * TypeScript still checks the examples against the v4 types: the example
 * tsconfig maps 'react-native-swipe-list-view' to ../src/index.ts.
 *
 * Both SwipeListViews attach bookkeeping props AND a ref to the element
 * returned from renderItem when no hidden item is given (the standalone
 * SwipeRow path), so the shims must forward refs to the real implementation.
 */
import { forwardRef } from 'react';
import type { ComponentType } from 'react';

import {
    SwipeListView as V4SwipeListView,
    SwipeRow as V4SwipeRow,
} from '../src';

// v3 is plain untyped JS (class components, PanResponder + RN Animated).
/* eslint-disable @typescript-eslint/no-require-imports */
const V3SwipeListView: ComponentType<Record<string, unknown>> =
    require('../components/SwipeListView').default;
const V3SwipeRow: ComponentType<Record<string, unknown>> =
    require('../components/SwipeRow').default;
/* eslint-enable @typescript-eslint/no-require-imports */

export type LibraryVersion = 'v4' | 'v3';

let currentVersion: LibraryVersion = 'v4';

/**
 * Switch implementations. Callers must remount the example tree afterwards
 * (the App toggle re-keys the active example) — the shims read the version
 * at render time and the two implementations cannot share state.
 */
export function setLibraryVersion(version: LibraryVersion) {
    currentVersion = version;
}

export function getLibraryVersion(): LibraryVersion {
    return currentVersion;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const SwipeListView: any = forwardRef<any, any>(
    function SwipeListView(props, ref) {
        const Impl: any =
            currentVersion === 'v4' ? V4SwipeListView : V3SwipeListView;
        return <Impl ref={ref} {...props} />;
    }
);

export const SwipeRow: any = forwardRef<any, any>(
    function SwipeRow(props, ref) {
        const Impl: any = currentVersion === 'v4' ? V4SwipeRow : V3SwipeRow;
        return <Impl ref={ref} {...props} />;
    }
);
/* eslint-enable @typescript-eslint/no-explicit-any */
