// Pure functions ported from v3 components/SwipeRow.js. All are worklets so the
// gesture-release path can run them on the UI thread; they behave identically
// when called from JS (tests).
import { MAX_VELOCITY_CONTRIBUTION } from './constants';

/**
 * Maps v3 Animated.spring params to a Reanimated withSpring config.
 * Animated.spring defaults: friction 7, tension 40, rest thresholds 0.001.
 * Mapping: stiffness = tension, damping = friction * 2 * sqrt(tension).
 */
export function springConfigFromV3(
    friction: number = 7,
    tension: number = 40,
    restSpeedThreshold: number = 0.001,
    restDisplacementThreshold: number = 0.001
) {
    'worklet';
    return {
        stiffness: tension,
        damping: friction * 2 * Math.sqrt(tension),
        restSpeedThreshold,
        restDisplacementThreshold,
    };
}

/**
 * v3 handlePanResponderEnd velocity projection. `vx` must be in px/ms (the
 * PanResponder unit) — RNGH reports px/s, so divide by 1000 before calling.
 */
export function projectedExtraPixels(
    rightOpenValue: number,
    swipeToOpenVelocityContribution: number,
    vx: number
): number {
    'worklet';
    const possibleExtraPixels = rightOpenValue * swipeToOpenVelocityContribution;
    const clampedVelocity = Math.min(vx, MAX_VELOCITY_CONTRIBUTION);
    return possibleExtraPixels * (clampedVelocity / MAX_VELOCITY_CONTRIBUTION);
}

export interface ReleaseTargetInput {
    currentTranslateX: number;
    swipeInitialX: number;
    projectedExtraPixels: number;
    isForceClosing: boolean;
    leftOpenValue: number;
    rightOpenValue: number;
    swipeToOpenPercent: number;
    swipeToClosePercent: number;
    leftActivationValue?: number;
    rightActivationValue?: number;
    leftActionValue?: number;
    rightActionValue?: number;
}

export interface ReleaseTarget {
    toValue: number;
    actionSide?: 'left' | 'right';
}

/**
 * v3 handleRightSwipe — release while translateX >= 0. The asymmetry between
 * the opening branch (swiping further right) and the closing branch (swiping
 * back) is v3 behavior, ported verbatim.
 */
export function rightSwipeReleaseTarget(input: ReleaseTargetInput): ReleaseTarget {
    'worklet';
    let toValue = 0;
    let actionSide: 'left' | 'right' | undefined;
    const leftActionValue = input.leftActionValue || 0;
    const projected = input.currentTranslateX - input.projectedExtraPixels;
    if (input.swipeInitialX < input.currentTranslateX) {
        if (
            projected >
            input.leftOpenValue * (input.swipeToOpenPercent / 100)
        ) {
            toValue = input.isForceClosing ? 0 : input.leftOpenValue;
        }
        if (
            input.leftActivationValue !== undefined &&
            projected > input.leftActivationValue
        ) {
            toValue = input.isForceClosing ? 0 : leftActionValue;
            actionSide = 'left';
        }
    } else {
        if (
            projected >
            input.leftOpenValue * (1 - input.swipeToClosePercent / 100)
        ) {
            toValue = input.isForceClosing ? 0 : input.leftOpenValue;
        }
        if (
            input.leftActivationValue !== undefined &&
            projected > input.leftActivationValue
        ) {
            toValue = input.isForceClosing ? 0 : leftActionValue;
            actionSide = 'left';
        }
    }
    return { toValue, actionSide };
}

/**
 * v3 handleLeftSwipe — release while translateX < 0. Ported verbatim,
 * including the v3 asymmetries (closing branch compares against the raw
 * rightOpenValue, and the activation threshold is scaled by
 * swipeToClosePercent only on that branch).
 */
export function leftSwipeReleaseTarget(input: ReleaseTargetInput): ReleaseTarget {
    'worklet';
    let toValue = 0;
    let actionSide: 'left' | 'right' | undefined;
    const rightActionValue = input.rightActionValue || 0;
    const projected = input.currentTranslateX - input.projectedExtraPixels;
    if (input.swipeInitialX > input.currentTranslateX) {
        if (
            projected <
            input.rightOpenValue * (input.swipeToOpenPercent / 100)
        ) {
            toValue = input.isForceClosing ? 0 : input.rightOpenValue;
        }
        if (
            input.rightActivationValue !== undefined &&
            projected < input.rightActivationValue
        ) {
            toValue = input.isForceClosing ? 0 : rightActionValue;
            actionSide = 'right';
        }
    } else {
        if (projected < input.rightOpenValue) {
            toValue = input.isForceClosing ? 0 : input.rightOpenValue;
        }
        if (
            input.rightActivationValue !== undefined &&
            projected <
                input.rightActivationValue *
                    (1 - input.swipeToClosePercent / 100)
        ) {
            toValue = input.isForceClosing ? 0 : rightActionValue;
            actionSide = 'right';
        }
    }
    return { toValue, actionSide };
}
