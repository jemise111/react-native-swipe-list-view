import {
    leftSwipeReleaseTarget,
    projectedExtraPixels,
    rightSwipeReleaseTarget,
    springConfigFromV3,
} from '../helpers';
import type { ReleaseTargetInput } from '../helpers';

describe('springConfigFromV3', () => {
    // Expected values come from RN's SpringConfig.fromOrigamiTensionAndFriction:
    //   stiffness = (tension - 30) * 3.62 + 194
    //   damping   = (friction - 8) * 3 + 25
    it('maps v3 Animated.spring defaults (friction 7, tension 40) via Origami', () => {
        const config = springConfigFromV3();
        expect(config.stiffness).toBeCloseTo((40 - 30) * 3.62 + 194, 10);
        expect(config.damping).toBeCloseTo((7 - 8) * 3 + 25, 10);
        expect(config.mass).toBe(1);
        expect(config.restSpeedThreshold).toBe(0.001);
        expect(config.restDisplacementThreshold).toBe(0.001);
    });

    it('maps explicit friction/tension via Origami', () => {
        const config = springConfigFromV3(10, 100, 0.5, 0.25);
        expect(config.stiffness).toBeCloseTo((100 - 30) * 3.62 + 194, 10);
        expect(config.damping).toBeCloseTo((10 - 8) * 3 + 25, 10);
        expect(config.mass).toBe(1);
        expect(config.restSpeedThreshold).toBe(0.5);
        expect(config.restDisplacementThreshold).toBe(0.25);
    });
});

describe('projectedExtraPixels', () => {
    it('returns 0 when velocity contribution is 0 (v3 default)', () => {
        expect(projectedExtraPixels(-150, 0, 3)).toBeCloseTo(0, 10);
    });

    it('scales rightOpenValue by clamped velocity fraction', () => {
        // possible = -150 * 1; clamped vx 2.5/5 = 0.5 → -75
        expect(projectedExtraPixels(-150, 1, 2.5)).toBe(-75);
    });

    it('clamps velocity at MAX_VELOCITY_CONTRIBUTION (5 px/ms)', () => {
        expect(projectedExtraPixels(-150, 1, 50)).toBe(-150);
    });
});

const baseInput: ReleaseTargetInput = {
    currentTranslateX: 0,
    swipeInitialX: 0,
    projectedExtraPixels: 0,
    isForceClosing: false,
    leftOpenValue: 75,
    rightOpenValue: -150,
    swipeToOpenPercent: 50,
    swipeToClosePercent: 50,
};

describe('rightSwipeReleaseTarget (v3 handleRightSwipe)', () => {
    it('opens when swiped past swipeToOpenPercent of leftOpenValue', () => {
        // threshold = 75 * 0.5 = 37.5
        const target = rightSwipeReleaseTarget({
            ...baseInput,
            swipeInitialX: 0,
            currentTranslateX: 40,
        });
        expect(target).toEqual({ toValue: 75, actionSide: undefined });
    });

    it('snaps back closed below the open threshold', () => {
        const target = rightSwipeReleaseTarget({
            ...baseInput,
            swipeInitialX: 0,
            currentTranslateX: 30,
        });
        expect(target.toValue).toBe(0);
    });

    it('stays open when swiping back but not past swipeToClosePercent', () => {
        // closing branch threshold = 75 * (1 - 0.5) = 37.5
        const target = rightSwipeReleaseTarget({
            ...baseInput,
            swipeInitialX: 75,
            currentTranslateX: 50,
        });
        expect(target.toValue).toBe(75);
    });

    it('closes when swiped back past swipeToClosePercent', () => {
        const target = rightSwipeReleaseTarget({
            ...baseInput,
            swipeInitialX: 75,
            currentTranslateX: 30,
        });
        expect(target.toValue).toBe(0);
    });

    it('triggers the left action past leftActivationValue', () => {
        const target = rightSwipeReleaseTarget({
            ...baseInput,
            currentTranslateX: 110,
            leftActivationValue: 100,
            leftActionValue: 120,
        });
        expect(target).toEqual({ toValue: 120, actionSide: 'left' });
    });

    it('defaults the action landing value to 0 (v3 `|| 0`)', () => {
        const target = rightSwipeReleaseTarget({
            ...baseInput,
            currentTranslateX: 110,
            leftActivationValue: 100,
        });
        expect(target).toEqual({ toValue: 0, actionSide: 'left' });
    });

    it('velocity projection can push the row open', () => {
        // current 30 < 37.5, but projectedExtraPixels -10 → 30 - (-10) = 40
        const target = rightSwipeReleaseTarget({
            ...baseInput,
            currentTranslateX: 30,
            projectedExtraPixels: -10,
        });
        expect(target.toValue).toBe(75);
    });

    it('force-closing always lands on 0', () => {
        const target = rightSwipeReleaseTarget({
            ...baseInput,
            currentTranslateX: 110,
            leftActivationValue: 100,
            leftActionValue: 120,
            isForceClosing: true,
        });
        expect(target).toEqual({ toValue: 0, actionSide: 'left' });
    });
});

describe('leftSwipeReleaseTarget (v3 handleLeftSwipe)', () => {
    it('opens when swiped past swipeToOpenPercent of rightOpenValue', () => {
        // threshold = -150 * 0.5 = -75
        const target = leftSwipeReleaseTarget({
            ...baseInput,
            swipeInitialX: 0,
            currentTranslateX: -80,
        });
        expect(target).toEqual({ toValue: -150, actionSide: undefined });
    });

    it('snaps back closed below the open threshold', () => {
        const target = leftSwipeReleaseTarget({
            ...baseInput,
            swipeInitialX: 0,
            currentTranslateX: -70,
        });
        expect(target.toValue).toBe(0);
    });

    it('closing branch compares against raw rightOpenValue (v3 asymmetry)', () => {
        // swiping back from open: only stays open past the full open value
        const stillOpen = leftSwipeReleaseTarget({
            ...baseInput,
            swipeInitialX: -150,
            currentTranslateX: -160,
        });
        expect(stillOpen.toValue).toBe(-150);

        const closes = leftSwipeReleaseTarget({
            ...baseInput,
            swipeInitialX: -150,
            currentTranslateX: -100,
        });
        expect(closes.toValue).toBe(0);
    });

    it('closing-branch activation threshold scales by swipeToClosePercent (v3 asymmetry)', () => {
        // swiping back toward closed: threshold = -200 * (1 - 0.5) = -100
        const activates = leftSwipeReleaseTarget({
            ...baseInput,
            swipeInitialX: -250,
            currentTranslateX: -120,
            rightActivationValue: -200,
            rightActionValue: -250,
        });
        expect(activates).toEqual({ toValue: -250, actionSide: 'right' });

        const noAction = leftSwipeReleaseTarget({
            ...baseInput,
            swipeInitialX: -250,
            currentTranslateX: -90,
            rightActivationValue: -200,
            rightActionValue: -250,
        });
        expect(noAction).toEqual({ toValue: 0, actionSide: undefined });
    });

    it('triggers the right action past rightActivationValue', () => {
        const target = leftSwipeReleaseTarget({
            ...baseInput,
            currentTranslateX: -210,
            rightActivationValue: -200,
            rightActionValue: -250,
        });
        expect(target).toEqual({ toValue: -250, actionSide: 'right' });
    });

    it('force-closing always lands on 0', () => {
        const target = leftSwipeReleaseTarget({
            ...baseInput,
            currentTranslateX: -80,
            isForceClosing: true,
        });
        expect(target.toValue).toBe(0);
    });
});
