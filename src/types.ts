import type { MutableRefObject, ReactElement, ReactNode } from 'react';
import type {
    AccessibilityActionEvent,
    AccessibilityActionInfo,
    DefaultSectionT,
    FlatList,
    FlatListProps,
    ListRenderItemInfo,
    SectionList,
    SectionListProps,
    SectionListRenderItemInfo,
    StyleProp,
    ViewStyle,
} from 'react-native';
import type {
    GestureStateChangeEvent,
    PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

export type SwipeDirection = 'left' | 'right';

/**
 * Data passed to `swipeGestureEnded`.
 *
 * Breaking change vs v3: `event` is a react-native-gesture-handler
 * `GestureStateChangeEvent` (was a PanResponder `GestureResponderEvent`) and
 * the PanResponder-specific `gestureState` field was removed.
 */
export type SwipeGestureEndedData = {
    translateX: number;
    direction: SwipeDirection;
    event: GestureStateChangeEvent<PanGestureHandlerEventPayload>;
};

/**
 * Data passed to SwipeRow's `onSwipeValueChange`.
 * `key` is the row's `swipeKey` — set when rendered by a SwipeListView,
 * undefined for a standalone SwipeRow.
 */
export interface RowSwipeValueChangeData {
    value: number;
    direction: SwipeDirection;
    isOpen: boolean;
    key?: string;
}

/** Data passed to SwipeListView's `onSwipeValueChange`. */
export interface SwipeValueChangeData extends RowSwipeValueChangeData {
    key: string;
}

/**
 * Data passed to SwipeRow's `onLeftActionStatusChange` / `onRightActionStatusChange`.
 * `key` is the row's `swipeKey` — set when rendered by a SwipeListView,
 * undefined for a standalone SwipeRow.
 */
export interface RowActionStatusChangeData {
    isActivated: boolean;
    value: number;
    key?: string;
}

/**
 * Data passed to SwipeListView's `onLeftActionStatusChange` /
 * `onRightActionStatusChange`.
 */
export interface ActionStatusChangeData extends RowActionStatusChangeData {
    key: string;
}

/**
 * Imperative handle exposed by SwipeRow (via ref, and as the values of the
 * `rowMap` passed to SwipeListView render callbacks).
 *
 * The generic parameter mirrors v3's `SwipeRow<T>` so existing `RowMap<T>`
 * annotations keep compiling; it is not otherwise used.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SwipeRowRef<T = unknown> {
    /** Close the row (spring animation). */
    closeRow: () => void;
    /** Close the row immediately, with no animation. */
    closeRowWithoutAnimation: () => void;
    /** Animate the row to an arbitrary translateX value. */
    manuallySwipeRow: (toValue: number, onAnimationEnd?: () => void) => void;
    /** Whether the row is currently open. */
    isOpen: boolean;
    /**
     * The row's translateX as a Reanimated SharedValue. Read it from
     * `useAnimatedStyle`/`useDerivedValue` to drive UI off the swipe position
     * on the UI thread. Preferred replacement for the per-frame JS callback
     * `onSwipeValueChange`.
     */
    swipeAnimatedValue: SharedValue<number>;
}

/**
 * Map of row key -> SwipeRow handle, passed to SwipeListView render callbacks
 * and row-level callbacks. Keys come from `keyExtractor` (or `item.key`).
 */
export type RowMap<T = unknown> = { [key: string]: SwipeRowRef<T> };

/**
 * Swipe-behavior props shared by SwipeRow and SwipeListView (SwipeListView
 * passes them down to every row it renders).
 */
export interface SharedSwipeProps {
    /**
     * TranslateX value for opening the row to the left (positive number)
     * @default 0
     */
    leftOpenValue?: number;
    /**
     * TranslateX value for opening the row to the right (negative number)
     * @default 0
     */
    rightOpenValue?: number;
    /**
     * TranslateX value for firing onLeftActionStatusChange (positive number)
     */
    leftActivationValue?: number;
    /**
     * TranslateX value for firing onRightActionStatusChange (negative number)
     */
    rightActivationValue?: number;
    /**
     * TranslateX value for left action to which the row will be shifted after gesture release
     * @default 0
     */
    leftActionValue?: number;
    /**
     * TranslateX value for right action to which the row will be shifted after gesture release
     * @default 0
     */
    rightActionValue?: number;
    /**
     * Initial value for left action state
     * @default false
     */
    initialLeftActionState?: boolean;
    /**
     * Initial value for right action state
     * @default false
     */
    initialRightActionState?: boolean;
    /**
     * TranslateX value for stop the row to the left (positive number)
     */
    stopLeftSwipe?: number;
    /**
     * TranslateX value for stop the row to the right (negative number)
     */
    stopRightSwipe?: number;
    /**
     * Friction for the open / close animation
     */
    friction?: number;
    /**
     * Tension for the open / close animation
     */
    tension?: number;
    /**
     * RestSpeedThreshold for the open / close animation
     */
    restSpeedThreshold?: number;
    /**
     * RestDisplacementThreshold for the open / close animation
     */
    restDisplacementThreshold?: number;
    /**
     * Disable ability to swipe the row left
     * @default false
     */
    disableLeftSwipe?: boolean;
    /**
     * Disable ability to swipe the row right
     * @default false
     */
    disableRightSwipe?: boolean;
    /**
     * Enable hidden row onLayout calculations to run always.
     *
     * By default, hidden row size calculations are only done on the first onLayout event
     * for performance reasons.
     * Passing `true` here will cause calculations to run on every onLayout event.
     * You may want to do this if your rows' sizes can change.
     * One case is a SwipeListView with rows of different heights and an options to delete rows.
     * @default false
     */
    recalculateHiddenLayout?: boolean;
    /**
     * Disable hidden row onLayout calculations
     *
     * Instead, `{width: '100%', height: '100%'}` will be used.
     * Improves performance by avoiding component updates, while still working with orientation changes.
     * @default false
     */
    disableHiddenLayoutCalculation?: boolean;
    /**
     * The dx value used to detect when a user has begun a swipe gesture
     * @default 2
     */
    directionalDistanceChangeThreshold?: number;
    /**
     * What % of the left/right openValue does the user need to swipe
     * past to trigger the row opening.
     * @default 50
     */
    swipeToOpenPercent?: number;
    /**
     * Describes how much the ending velocity of the gesture contributes to whether the swipe
     * will result in the item being closed or open. A velocity factor of 0 means that the
     * velocity will have no bearing on whether the swipe settles on a closed or open position
     * and it'll just take into consideration the swipeToOpenPercent.
     * @default 0
     */
    swipeToOpenVelocityContribution?: number;
    /**
     * What % of the left/right openValue does the user need to swipe
     * past to trigger the row closing.
     * @default 50
     */
    swipeToClosePercent?: number;
    /**
     * Duration of the slide out preview animation (milliseconds)
     * @default 300
     */
    previewDuration?: number;
    /**
     * Should the animation repeat until false is provided
     * @default false
     */
    previewRepeat?: boolean;
    /**
     * Time between each full completed animation in milliseconds
     * @default 1000
     */
    previewRepeatDelay?: number;
    /**
     * TranslateX value for the slide out preview animation
     * Default: 0.5 * props.rightOpenValue
     */
    previewOpenValue?: number;
    /**
     * Delay of the slide out preview animation (milliseconds)
     * @default 700
     */
    previewOpenDelay?: number;
    /**
     * Callback that runs after row swipe preview is finished
     */
    onPreviewEnd?: () => void;
    /**
     * @deprecated Removed in v4 — all animations run on the UI thread via
     * Reanimated, so there is nothing to opt in to. Passing it is a no-op
     * (one-time dev warning).
     */
    useNativeDriver?: never;
}

export interface SwipeRowProps<T = unknown> extends SharedSwipeProps {
    /**
     * Exactly two children: the first is the hidden layer rendered behind the
     * row, the second is the visible layer.
     */
    children: ReactNode;
    /**
     * Should the row be closed when it is tapped
     * @default true
     */
    closeOnRowPress?: boolean;
    /**
     * Should the row do a slide out preview to show that it is swipeable
     * @default false
     */
    preview?: boolean;
    /**
     * Styles for the parent wrapper View of the SwipeRow
     */
    style?: StyleProp<ViewStyle>;
    /**
     * The row's data item, used for shouldItemUpdate comparisons
     * @default {}
     */
    item?: T;
    /**
     * callback to determine whether component should update
     */
    shouldItemUpdate?: (currentItem: T, newItem: T) => boolean;
    /**
     * Used by the SwipeListView to close rows on scroll events.
     * You shouldn't need to use this prop explicitly.
     */
    setScrollEnabled?: (enable: boolean) => void;
    /**
     * Key used to identify rows on swipe value changes. Set by SwipeListView;
     * only needed explicitly on standalone rows that want `key` in callback
     * payloads.
     */
    swipeKey?: string;
    /**
     * Called when it has been detected that a row should be swiped open.
     */
    swipeGestureBegan?: () => void;
    /**
     * Called when user has ended their swipe gesture
     */
    swipeGestureEnded?: (
        swipeKey: string | undefined,
        data: SwipeGestureEndedData
    ) => void;
    /**
     * Called when a swipe row is animating open. Used by the SwipeListView
     * to keep references to open rows.
     */
    onRowOpen?: (toValue: number) => void;
    /**
     * Called when a swipe row has animated open.
     */
    onRowDidOpen?: (toValue: number) => void;
    /**
     * Called when a swipe row is animating closed
     */
    onRowClose?: () => void;
    /**
     * Called when a swipe row has animated closed
     */
    onRowDidClose?: () => void;
    /**
     * Called when the row is pressed
     */
    onRowPress?: () => void;
    /**
     * Called when row shifted to leftActivationValue
     */
    onLeftAction?: () => void;
    /**
     * Called when row shifted to rightActivationValue
     */
    onRightAction?: () => void;
    /**
     * Called once when swipe value crosses the leftActivationValue
     */
    onLeftActionStatusChange?: (data: RowActionStatusChangeData) => void;
    /**
     * Called once when swipe value crosses the rightActivationValue
     */
    onRightActionStatusChange?: (data: RowActionStatusChangeData) => void;
    /**
     * Callback invoked any time the swipe value of the row is changed.
     * Crosses to the JS thread every frame — prefer reading
     * `swipeAnimatedValue` from the row ref / rowMap entry instead.
     */
    onSwipeValueChange?: (data: RowSwipeValueChangeData) => void;
    /**
     * TranslateX amount (not value!) threshold that triggers force-closing
     * the row to the Left End (positive number)
     */
    forceCloseToLeftThreshold?: number;
    /**
     * TranslateX amount (not value!) threshold that triggers force-closing
     * the row to the Right End (positive number)
     */
    forceCloseToRightThreshold?: number;
    /**
     * Callback invoked when row is force closing to the Left End
     */
    onForceCloseToLeft?: () => void;
    /**
     * Callback invoked when row is force closing to the Right End
     */
    onForceCloseToRight?: () => void;
    /**
     * Callback invoked when row has finished force closing to the Left End
     */
    onForceCloseToLeftEnd?: () => void;
    /**
     * Callback invoked when row has finished force closing to the Right End
     */
    onForceCloseToRightEnd?: () => void;
    /**
     * NEW in v4 (C6). Set to false to opt out of the row's built-in
     * accessibility actions; forwarded to the row's wrapper View.
     */
    accessible?: boolean;
    /**
     * NEW in v4 (C6). Overrides the accessibility actions SwipeRow exposes by
     * default (`swipeleft` when rightOpenValue is set, `swiperight` when
     * leftOpenValue is set).
     */
    accessibilityActions?: ReadonlyArray<AccessibilityActionInfo>;
    /**
     * NEW in v4 (C6). Called after SwipeRow handles its built-in
     * `swipeleft`/`swiperight` actions (which open/close the row), and for any
     * custom actions supplied via `accessibilityActions`.
     */
    onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
}

/**
 * Props SwipeRow injects into both of its children via cloneElement
 * (v3 behavior, unchanged in v4 except `swipeAnimatedValue` is now a
 * Reanimated SharedValue rather than an Animated.Value).
 */
export interface SwipeRowChildInjectedProps {
    leftActionActivated?: boolean;
    rightActionActivated?: boolean;
    leftActionState?: boolean;
    rightActionState?: boolean;
    swipeAnimatedValue?: SharedValue<number>;
}

/** Props SwipeListView adds on top of the underlying list component's props. */
export interface SwipeListViewBaseProps<T> extends SharedSwipeProps {
    /**
     * How to render a hidden row (renders behind the row). Should return a
     * valid React Element. This is required unless renderItem returns a SwipeRow.
     */
    renderHiddenItem?: (
        rowData: ListRenderItemInfo<T>,
        rowMap: RowMap<T>
    ) => ReactElement | null;
    /**
     * Should open rows be closed when the listView begins scrolling
     * @default true
     */
    closeOnScroll?: boolean;
    /**
     * Should open rows be closed when a row is pressed
     * @default true
     */
    closeOnRowPress?: boolean;
    /**
     * Should open rows be closed when a row begins to swipe open
     * @default false
     */
    closeOnRowBeginSwipe?: boolean;
    /**
     * Should open rows be closed when another row is opened
     * @default true
     */
    closeOnRowOpen?: boolean;
    /**
     * Called when a swipe row is animating swipe
     */
    swipeGestureBegan?: (rowKey: string) => void;
    /**
     * Called when user has ended their swipe gesture
     */
    swipeGestureEnded?: (rowKey: string, data: SwipeGestureEndedData) => void;
    /**
     * Called when a swipe row is animating open
     */
    onRowOpen?: (rowKey: string, rowMap: RowMap<T>, toValue: number) => void;
    /**
     * Called when a swipe row has animated open
     */
    onRowDidOpen?: (
        rowKey: string,
        rowMap: RowMap<T>,
        toValue: number
    ) => void;
    /**
     * Called when a swipe row is animating closed
     */
    onRowClose?: (rowKey: string, rowMap: RowMap<T>) => void;
    /**
     * Called when a swipe row has animated closed
     */
    onRowDidClose?: (rowKey: string, rowMap: RowMap<T>) => void;
    /**
     * Called when row shifted to leftActivationValue
     */
    onLeftAction?: (rowKey: string, rowMap: RowMap<T>) => void;
    /**
     * Called when row shifted to rightActivationValue
     */
    onRightAction?: (rowKey: string, rowMap: RowMap<T>) => void;
    /**
     * Called once when swipe value crosses the leftActivationValue
     */
    onLeftActionStatusChange?: (data: ActionStatusChangeData) => void;
    /**
     * Called once when swipe value crosses the rightActivationValue
     */
    onRightActionStatusChange?: (data: ActionStatusChangeData) => void;
    /**
     * Called when scrolling on the SwipeListView has been enabled/disabled
     */
    onScrollEnabled?: (isEnabled: boolean) => void;
    /**
     * Styles for the parent wrapper View of the SwipeRow
     */
    swipeRowStyle?: StyleProp<ViewStyle>;
    /**
     * Should the row with this key do a slide out preview to show that the
     * list is swipeable
     */
    previewRowKey?: string;
    /**
     * callback to determine whether component should update
     */
    shouldItemUpdate?: (currentItem: T, newItem: T) => boolean;
    /**
     * Callback invoked any time the swipe value of a SwipeRow is changed.
     * Crosses to the JS thread every frame — prefer reading
     * `swipeAnimatedValue` from the rowMap entry instead.
     */
    onSwipeValueChange?: (data: SwipeValueChangeData) => void;
    /**
     * @deprecated Removed in v4 — FlatList has been the only ListView-era
     * alternative since v2. Passing it is a no-op (one-time dev warning).
     */
    useFlatList?: never;
    /**
     * @deprecated Removed in v4 — the list is always animated (Reanimated).
     * Passing it is a no-op (one-time dev warning).
     */
    useAnimatedList?: never;
}

export interface SwipeListViewFlatListProps<T>
    extends Omit<FlatListProps<T>, 'renderItem'>,
        SwipeListViewBaseProps<T> {
    /**
     * Render a FlatList row. Should return a valid React Element.
     */
    renderItem: (
        rowData: ListRenderItemInfo<T>,
        rowMap: RowMap<T>
    ) => ReactElement | null;
    useSectionList?: false;
    /**
     * Called when the FlatList ref is set and passes a ref to the FlatList
     * e.g. `listViewRef={ref => (this._swipeListViewRef = ref)}`
     */
    listViewRef?:
        | ((ref: FlatList<T> | null) => void)
        | MutableRefObject<FlatList<T> | null>;
}

export interface SwipeListViewSectionListProps<
    T,
    SectionT = DefaultSectionT,
> extends Omit<SectionListProps<T, SectionT>, 'renderItem'>,
        Omit<SwipeListViewBaseProps<T>, 'renderHiddenItem'> {
    /**
     * Render a SectionList row. Should return a valid React Element.
     */
    renderItem: (
        rowData: SectionListRenderItemInfo<T, SectionT>,
        rowMap: RowMap<T>
    ) => ReactElement | null;
    /**
     * How to render a hidden row in a SectionList (renders behind the row).
     * Receives the same SectionList rowData as renderItem. Should return a
     * valid React Element. This is required unless renderItem returns a
     * SwipeRow.
     */
    renderHiddenItem?: (
        rowData: SectionListRenderItemInfo<T, SectionT>,
        rowMap: RowMap<T>
    ) => ReactElement | null;
    /** Render with a SectionList instead of a FlatList. */
    useSectionList: true;
    /**
     * Called when the SectionList ref is set and passes a ref to the SectionList
     * e.g. `listViewRef={ref => (this._swipeListViewRef = ref)}`
     */
    listViewRef?:
        | ((ref: SectionList<T, SectionT> | null) => void)
        | MutableRefObject<SectionList<T, SectionT> | null>;
}

export type SwipeListViewProps<T, SectionT = DefaultSectionT> =
    | SwipeListViewFlatListProps<T>
    | SwipeListViewSectionListProps<T, SectionT>;

/** Imperative handle exposed by SwipeListView via ref. */
export interface SwipeListViewRef {
    /** Close all rows that are currently open. */
    closeAllOpenRows: () => void;
    /** Animate every row to the given translateX value. */
    manuallyOpenAllRows: (toValue: number) => void;
}
