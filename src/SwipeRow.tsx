import React, {
    Children,
    cloneElement,
    forwardRef,
    memo,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import type {
    AccessibilityActionEvent,
    AccessibilityActionInfo,
    LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    runOnUI,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import {
    DEFAULT_PREVIEW_OPEN_DELAY,
    PREVIEW_CLOSE_DELAY,
    SCROLL_LOCK_MILLISECONDS,
} from './constants';
import { warnOnce } from './deprecations';
import {
    leftSwipeReleaseTarget,
    projectedExtraPixels,
    rightSwipeReleaseTarget,
    springConfigFromV3,
} from './helpers';
import type {
    SwipeDirection,
    SwipeGestureEndedData,
    SwipeRowProps,
    SwipeRowRef,
} from './types';

type ActionSide = 'left' | 'right';
type ChildElement = React.ReactElement<
    Record<string, unknown> & {
        onPress?: (...args: unknown[]) => void;
    }
>;

/**
 * Row with a hidden layer behind a visible layer; a pan gesture reveals the
 * hidden layer. Pass exactly two children: the first renders behind the
 * second. Generally used via SwipeListView, but works standalone.
 */
const SwipeRowInner = forwardRef<SwipeRowRef, SwipeRowProps<unknown>>(
    function SwipeRow(props, ref) {
        const {
            children,
            leftOpenValue = 0,
            rightOpenValue = 0,
            leftActivationValue,
            rightActivationValue,
            leftActionValue,
            rightActionValue,
            initialLeftActionState = false,
            initialRightActionState = false,
            stopLeftSwipe,
            stopRightSwipe,
            friction,
            tension,
            restSpeedThreshold,
            restDisplacementThreshold,
            closeOnRowPress = true,
            disableLeftSwipe = false,
            disableRightSwipe = false,
            recalculateHiddenLayout = false,
            disableHiddenLayoutCalculation = false,
            preview = false,
            previewDuration = 300,
            previewOpenDelay = DEFAULT_PREVIEW_OPEN_DELAY,
            previewOpenValue,
            previewRepeat = false,
            previewRepeatDelay = 1000,
            directionalDistanceChangeThreshold = 2,
            swipeToOpenPercent = 50,
            swipeToOpenVelocityContribution = 0,
            swipeToClosePercent = 50,
            forceCloseToLeftThreshold,
            forceCloseToRightThreshold,
            swipeKey,
            style,
            accessible,
            accessibilityActions,
            onAccessibilityAction,
            setScrollEnabled,
            swipeGestureBegan,
            swipeGestureEnded,
            onRowOpen,
            onRowDidOpen,
            onRowClose,
            onRowDidClose,
            onRowPress,
            onLeftAction,
            onRightAction,
            onLeftActionStatusChange,
            onRightActionStatusChange,
            onSwipeValueChange,
            onPreviewEnd,
            onForceCloseToLeft,
            onForceCloseToRight,
            onForceCloseToLeftEnd,
            onForceCloseToRightEnd,
        } = props;

        const windowWidth = useWindowDimensions().width;

        // --- state mirrored into children via cloneElement (v3 setState) ---
        const [leftActionActivated, setLeftActionActivated] = useState(false);
        const [rightActionActivated, setRightActionActivated] =
            useState(false);
        const [leftActionState, setLeftActionState] = useState(
            initialLeftActionState
        );
        const [rightActionState, setRightActionState] = useState(
            initialRightActionState
        );
        const [dimensionsSet, setDimensionsSet] = useState(false);
        const [hiddenDimensions, setHiddenDimensions] = useState<{
            height: number | '100%';
            width: number | '100%';
        }>(() => ({
            height: disableHiddenLayoutCalculation ? '100%' : 0,
            width: disableHiddenLayoutCalculation ? '100%' : 0,
        }));

        // --- worklet-accessed mutable state: SharedValues, never useRef ---
        const translateX = useSharedValue(0);
        const isOpen = useSharedValue(false);
        const swipeInitialX = useSharedValue(0);
        const horizontalSwipeGestureBegan = useSharedValue(false);
        const isForceClosing = useSharedValue(false);
        const prevTrackedTranslateX = useSharedValue(0);
        const prevTrackedDirection = useSharedValue<SwipeDirection | null>(
            null
        );
        const leftActionActivatedSV = useSharedValue(false);
        const rightActionActivatedSV = useSharedValue(false);
        const parentScrollEnabled = useSharedValue(true);

        // --- JS-only mutable state ---
        const ensureScrollEnabledTimer = useRef<ReturnType<
            typeof setTimeout
        > | null>(null);
        const resetForceClosingTimer = useRef<ReturnType<
            typeof setTimeout
        > | null>(null);
        const ranPreview = useRef(false);
        const previewRepeatInterval = useRef<ReturnType<
            typeof setInterval
        > | null>(null);
        const pendingAnimationEnd = useRef<(() => void) | null>(null);

        const springConfig = useMemo(
            () =>
                springConfigFromV3(
                    friction,
                    tension,
                    restSpeedThreshold,
                    restDisplacementThreshold
                ),
            [friction, tension, restSpeedThreshold, restDisplacementThreshold]
        );

        // C4: tolerated-but-removed prop
        useEffect(() => {
            if (
                (props as unknown as Record<string, unknown>)
                    .useNativeDriver !== undefined
            ) {
                warnOnce(
                    'useNativeDriver',
                    'was removed in v4. All animations run on the UI thread ' +
                        'via Reanimated; the prop is ignored. Remove it.'
                );
            }
            // one-time check, intentionally not reactive
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        // --- JS-side helpers (called directly or through runOnJS) ---

        const ensureScrollEnabled = () => {
            if (!parentScrollEnabled.value) {
                parentScrollEnabled.value = true;
                setScrollEnabled?.(true);
            }
        };

        const disableParentScroll = () => {
            setScrollEnabled?.(false);
        };

        const fireSwipeGestureBegan = () => {
            swipeGestureBegan?.();
        };

        const fireSwipeGestureEnded = (data: SwipeGestureEndedData) => {
            swipeGestureEnded?.(swipeKey, data);
        };

        const fireBeginCallbacks = (toValue: number) => {
            if (toValue === 0) {
                onRowClose?.();
            } else {
                onRowOpen?.(toValue);
            }
        };

        const onAnimationSettled = (toValue: number, action?: ActionSide) => {
            ensureScrollEnabled();
            if (toValue === 0) {
                onRowDidClose?.();
            } else {
                onRowDidOpen?.(toValue);
            }
            if (action === 'left') {
                onLeftAction?.();
                setLeftActionState(state => !state);
            } else if (action === 'right') {
                onRightAction?.();
                setRightActionState(state => !state);
            }
            const callback = pendingAnimationEnd.current;
            pendingAnimationEnd.current = null;
            callback?.();
        };

        const afterGestureEnd = (wasForceClosing: boolean) => {
            if (wasForceClosing) {
                // 500ms ≈ default spring settle time used by v3 for this reset
                resetForceClosingTimer.current = setTimeout(() => {
                    isForceClosing.value = false;
                }, 500);
            }
            ensureScrollEnabledTimer.current = setTimeout(
                ensureScrollEnabled,
                SCROLL_LOCK_MILLISECONDS
            );
        };

        const fireSwipeValueChange = (
            value: number,
            direction: SwipeDirection | null,
            currentlyOpen: boolean
        ) => {
            onSwipeValueChange?.({
                isOpen: currentlyOpen,
                direction: (direction ?? 'left') as SwipeDirection,
                value,
                key: swipeKey,
            });
        };

        const fireLeftActionStatusChange = (
            isActivated: boolean,
            value: number
        ) => {
            onLeftActionStatusChange?.({ isActivated, value, key: swipeKey });
            setLeftActionActivated(isActivated);
        };

        const fireRightActionStatusChange = (
            isActivated: boolean,
            value: number
        ) => {
            onRightActionStatusChange?.({ isActivated, value, key: swipeKey });
            setRightActionActivated(isActivated);
        };

        // --- settle (shared by gesture release and imperative API) ---

        const settleRow = (toValue: number, action?: ActionSide) => {
            'worklet';
            runOnJS(fireBeginCallbacks)(toValue);
            translateX.value = withSpring(toValue, springConfig, () => {
                isOpen.value = toValue !== 0;
                runOnJS(onAnimationSettled)(toValue, action);
            });
            horizontalSwipeGestureBegan.value = false;
        };

        const manuallySwipeRow = (
            toValue: number,
            onAnimationEnd?: () => void
        ) => {
            if (onAnimationEnd) {
                pendingAnimationEnd.current = onAnimationEnd;
            }
            runOnUI(settleRow)(toValue, undefined);
        };

        const closeRow = () => {
            manuallySwipeRow(0);
        };

        const closeRowWithoutAnimation = () => {
            translateX.value = 0;
            ensureScrollEnabled();
            isOpen.value = false;
            // v3 fires did-close before close here — preserved
            onRowDidClose?.();
            onRowClose?.();
            horizontalSwipeGestureBegan.value = false;
        };

        const forceCloseRow = (direction: ActionSide) => {
            if (direction === 'right') {
                onForceCloseToRight?.();
            } else {
                onForceCloseToLeft?.();
            }
            manuallySwipeRow(0, () => {
                if (direction === 'right') {
                    onForceCloseToRightEnd?.();
                } else {
                    onForceCloseToLeftEnd?.();
                }
            });
        };

        useImperativeHandle(ref, () => ({
            closeRow,
            closeRowWithoutAnimation,
            manuallySwipeRow,
            get isOpen() {
                return isOpen.value;
            },
            swipeAnimatedValue: translateX,
        }));

        // --- gesture ---

        const panGesture = useMemo(
            () =>
                Gesture.Pan()
                    .activeOffsetX([
                        -directionalDistanceChangeThreshold,
                        directionalDistanceChangeThreshold,
                    ])
                    .failOffsetY([-10, 10])
                    .onStart(() => {
                        if (isForceClosing.value) {
                            return;
                        }
                        if (parentScrollEnabled.value) {
                            parentScrollEnabled.value = false;
                            runOnJS(disableParentScroll)();
                        }
                        swipeInitialX.value = translateX.value;
                        if (!horizontalSwipeGestureBegan.value) {
                            horizontalSwipeGestureBegan.value = true;
                            runOnJS(fireSwipeGestureBegan)();
                        }
                    })
                    .onUpdate(event => {
                        if (isForceClosing.value) {
                            return;
                        }
                        let newDX = swipeInitialX.value + event.translationX;
                        if (disableLeftSwipe && newDX < 0) {
                            newDX = 0;
                        }
                        if (disableRightSwipe && newDX > 0) {
                            newDX = 0;
                        }
                        if (stopLeftSwipe && newDX > stopLeftSwipe) {
                            newDX = stopLeftSwipe;
                        }
                        if (stopRightSwipe && newDX < stopRightSwipe) {
                            newDX = stopRightSwipe;
                        }
                        translateX.value = newDX;
                    })
                    .onEnd((event, success) => {
                        if (success) {
                            runOnJS(fireSwipeGestureEnded)({
                                translateX: translateX.value,
                                direction: (prevTrackedDirection.value ??
                                    'left') as SwipeDirection,
                                event,
                            });
                        }
                        runOnJS(afterGestureEnd)(isForceClosing.value);

                        // v3 vx is px/ms; RNGH velocityX is px/s
                        const projected = projectedExtraPixels(
                            rightOpenValue,
                            swipeToOpenVelocityContribution,
                            event.velocityX / 1000
                        );
                        const input = {
                            currentTranslateX: translateX.value,
                            swipeInitialX: swipeInitialX.value,
                            projectedExtraPixels: projected,
                            isForceClosing: isForceClosing.value,
                            leftOpenValue,
                            rightOpenValue,
                            swipeToOpenPercent,
                            swipeToClosePercent,
                            leftActivationValue,
                            rightActivationValue,
                            leftActionValue,
                            rightActionValue,
                        };
                        if (translateX.value >= 0) {
                            const target = rightSwipeReleaseTarget(input);
                            settleRow(target.toValue, target.actionSide);
                        } else {
                            if (disableLeftSwipe) {
                                return;
                            }
                            const target = leftSwipeReleaseTarget(input);
                            settleRow(target.toValue, target.actionSide);
                        }
                    }),
            // settleRow & friends are recreated each render with fresh props
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [props]
        );

        // --- per-frame reactions (v3 _translateX listeners) ---

        useAnimatedReaction(
            () => translateX.value,
            value => {
                // direction tracking (v4 always tracks; v3 only did when
                // onSwipeValueChange was set, leaving swipeGestureEnded's
                // direction null otherwise)
                let direction = prevTrackedDirection.value;
                if (Math.abs(value - prevTrackedTranslateX.value) > 0.5) {
                    direction =
                        value > prevTrackedTranslateX.value
                            ? 'right'
                            : 'left';
                }
                if (onSwipeValueChange) {
                    runOnJS(fireSwipeValueChange)(
                        value,
                        direction,
                        isOpen.value
                    );
                }
                prevTrackedTranslateX.value = value;
                prevTrackedDirection.value = direction;

                // force close (v3 had a copy-paste bug gating the left
                // listener on the *right* threshold — fixed here)
                if (
                    forceCloseToRightThreshold &&
                    forceCloseToRightThreshold > 0 &&
                    !isForceClosing.value &&
                    windowWidth + value < forceCloseToRightThreshold
                ) {
                    isForceClosing.value = true;
                    runOnJS(forceCloseRow)('right');
                }
                if (
                    forceCloseToLeftThreshold &&
                    forceCloseToLeftThreshold > 0 &&
                    !isForceClosing.value &&
                    windowWidth - value < forceCloseToLeftThreshold
                ) {
                    isForceClosing.value = true;
                    runOnJS(forceCloseRow)('left');
                }

                // activation status crossings
                if (
                    onLeftActionStatusChange &&
                    leftActivationValue &&
                    leftActivationValue > 0
                ) {
                    const isActivated =
                        Math.abs(value) > leftActivationValue;
                    if (
                        leftActionActivatedSV.value !== isActivated &&
                        value > 0
                    ) {
                        leftActionActivatedSV.value = isActivated;
                        runOnJS(fireLeftActionStatusChange)(
                            isActivated,
                            value
                        );
                    }
                }
                if (
                    onRightActionStatusChange &&
                    rightActivationValue &&
                    rightActivationValue < 0
                ) {
                    const isActivated =
                        Math.abs(value) > Math.abs(rightActivationValue);
                    if (
                        rightActionActivatedSV.value !== isActivated &&
                        value < 0
                    ) {
                        rightActionActivatedSV.value = isActivated;
                        runOnJS(fireRightActionStatusChange)(
                            isActivated,
                            value
                        );
                    }
                }
            }
        );

        // --- preview ---

        const doFullAnimation = () => {
            // v3 uses || so previewOpenValue: 0 falls back too
            const target = previewOpenValue || rightOpenValue * 0.5;
            translateX.value = withDelay(
                previewOpenDelay,
                withSequence(
                    withTiming(target, { duration: previewDuration }),
                    withDelay(
                        PREVIEW_CLOSE_DELAY,
                        withTiming(0, { duration: previewDuration }, () => {
                            if (onPreviewEnd) {
                                runOnJS(onPreviewEnd)();
                            }
                        })
                    )
                )
            );
        };

        const onContentLayout = (e: LayoutChangeEvent) => {
            setDimensionsSet(!recalculateHiddenLayout);
            if (!disableHiddenLayoutCalculation) {
                setHiddenDimensions({
                    height: e.nativeEvent.layout.height,
                    width: e.nativeEvent.layout.width,
                });
            }
            if (preview && !ranPreview.current) {
                ranPreview.current = true;
                doFullAnimation();
                if (previewRepeat) {
                    const timeBetweenPreviewRepeats =
                        previewDuration * 2 +
                        previewOpenDelay +
                        PREVIEW_CLOSE_DELAY +
                        previewRepeatDelay;
                    previewRepeatInterval.current = setInterval(
                        doFullAnimation,
                        timeBetweenPreviewRepeats
                    );
                }
            }
        };

        useEffect(() => {
            if (!previewRepeat && previewRepeatInterval.current) {
                clearInterval(previewRepeatInterval.current);
                previewRepeatInterval.current = null;
            }
        }, [previewRepeat]);

        useEffect(
            () => () => {
                if (ensureScrollEnabledTimer.current) {
                    clearTimeout(ensureScrollEnabledTimer.current);
                }
                if (resetForceClosingTimer.current) {
                    clearTimeout(resetForceClosingTimer.current);
                }
                if (previewRepeatInterval.current) {
                    clearInterval(previewRepeatInterval.current);
                }
            },
            []
        );

        // --- accessibility (C6) ---

        const defaultAccessibilityActions = useMemo(() => {
            const actions: AccessibilityActionInfo[] = [];
            if (rightOpenValue !== 0) {
                actions.push({ name: 'swipeleft' });
            }
            if (leftOpenValue !== 0) {
                actions.push({ name: 'swiperight' });
            }
            return actions;
        }, [leftOpenValue, rightOpenValue]);

        const mergedAccessibilityActions =
            accessibilityActions ?? defaultAccessibilityActions;

        const handleAccessibilityAction = (
            event: AccessibilityActionEvent
        ) => {
            const { actionName } = event.nativeEvent;
            if (actionName === 'swipeleft' && rightOpenValue !== 0) {
                if (isOpen.value) {
                    closeRow();
                } else {
                    manuallySwipeRow(rightOpenValue);
                }
            } else if (actionName === 'swiperight' && leftOpenValue !== 0) {
                if (isOpen.value) {
                    closeRow();
                } else {
                    manuallySwipeRow(leftOpenValue);
                }
            }
            onAccessibilityAction?.(event);
        };

        // --- render ---

        const handleRowPress = () => {
            if (onRowPress) {
                onRowPress();
            } else if (closeOnRowPress) {
                closeRow();
            }
        };

        const childArray = Children.toArray(children) as ChildElement[];
        const hiddenChild = childArray[0];
        const visibleChild = childArray[1];
        if (__DEV__ && (!hiddenChild || !visibleChild)) {
            console.warn(
                '[react-native-swipe-list-view] SwipeRow requires exactly ' +
                    'two children: the hidden layer first, the visible row second.'
            );
        }

        const injectedProps = {
            leftActionActivated,
            rightActionActivated,
            leftActionState,
            rightActionState,
            swipeAnimatedValue: translateX,
        };

        const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ translateX: translateX.value }],
        }));

        const renderVisibleContent = (visible: ChildElement) => {
            if (!closeOnRowPress) {
                return cloneElement(visible, {
                    ...visible.props,
                    ...injectedProps,
                });
            }

            const childOnPress = visible.props.onPress;
            if (childOnPress) {
                return cloneElement(visible, {
                    ...visible.props,
                    ...injectedProps,
                    onPress: (...args: unknown[]) => {
                        handleRowPress();
                        childOnPress(...args);
                    },
                });
            }

            return (
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleRowPress}
                    accessible={false}
                >
                    {cloneElement(visible, {
                        ...visible.props,
                        ...injectedProps,
                    })}
                </TouchableOpacity>
            );
        };

        return (
            <View
                style={style ?? styles.container}
                accessible={accessible}
                accessibilityActions={
                    accessible === false || !mergedAccessibilityActions.length
                        ? undefined
                        : mergedAccessibilityActions
                }
                onAccessibilityAction={
                    accessible === false ? undefined : handleAccessibilityAction
                }
            >
                <View
                    style={[
                        styles.hidden,
                        {
                            height: hiddenDimensions.height,
                            width: hiddenDimensions.width,
                        },
                    ]}
                >
                    {hiddenChild
                        ? cloneElement(hiddenChild, {
                              ...hiddenChild.props,
                              ...injectedProps,
                          })
                        : null}
                </View>
                <GestureDetector gesture={panGesture}>
                    <Animated.View
                        onLayout={dimensionsSet ? undefined : onContentLayout}
                        style={[styles.visible, animatedStyle]}
                    >
                        {visibleChild
                            ? renderVisibleContent(visibleChild)
                            : null}
                    </Animated.View>
                </GestureDetector>
            </View>
        );
    }
);

function arePropsEqual(
    prevProps: SwipeRowProps<unknown>,
    nextProps: SwipeRowProps<unknown>
): boolean {
    // v3 shouldComponentUpdate: without shouldItemUpdate, always re-render;
    // with it, re-render only when it returns true (internal state changes
    // bypass memo, like v3's state checks)
    if (!nextProps.shouldItemUpdate) {
        return false;
    }
    return !nextProps.shouldItemUpdate(prevProps.item, nextProps.item);
}

const MemoSwipeRow = memo(SwipeRowInner, arePropsEqual);
MemoSwipeRow.displayName = 'SwipeRow';

type SwipeRowComponent = (<T = unknown>(
    props: SwipeRowProps<T> & { ref?: React.Ref<SwipeRowRef<T>> }
) => React.ReactElement | null) & { displayName?: string };

export default MemoSwipeRow as unknown as SwipeRowComponent;

const styles = StyleSheet.create({
    container: {
        // As of RN 0.29 flex: 1 is causing all rows to be the same height
        // flex: 1
    },
    hidden: {
        zIndex: 1,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
        position: 'absolute',
        right: 0,
        top: 0,
    },
    visible: {
        zIndex: 2,
    },
});
