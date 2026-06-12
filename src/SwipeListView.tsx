import React, {
    cloneElement,
    forwardRef,
    memo,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';
import { Platform, SectionList } from 'react-native';
import type {
    DefaultSectionT,
    LayoutChangeEvent,
    ListRenderItemInfo,
    NativeScrollEvent,
    NativeSyntheticEvent,
    SectionListProps,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { warnOnce } from './deprecations';
import SwipeRow from './SwipeRow';
import type {
    ActionStatusChangeData,
    RowMap,
    SwipeGestureEndedData,
    SwipeListViewBaseProps,
    SwipeListViewProps,
    SwipeListViewRef,
    SwipeRowRef,
    SwipeValueChangeData,
} from './types';

// Module-level so the list component identity is stable across renders.
// Double cast per Known pitfalls — Animated.createAnimatedComponent(SectionList)
// does not typecheck directly.
const AnimatedSectionList = Animated.createAnimatedComponent(
    SectionList
) as unknown as React.ComponentType<SectionListProps<unknown>>;

/**
 * Internal flattened view of the public props union: SwipeListView renders a
 * FlatList or a SectionList from one code path (C12), so internally we only
 * care about the common shape.
 */
type InternalSwipeListViewProps = SwipeListViewBaseProps<unknown> & {
    useSectionList?: boolean;
    renderItem: (
        rowData: ListRenderItemInfo<unknown>,
        rowMap: RowMap<unknown>
    ) => React.ReactElement | null;
    keyExtractor?: (item: unknown, index: number) => string;
    listViewRef?:
        | ((instance: unknown) => void)
        | React.MutableRefObject<unknown>;
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onLayout?: (event: LayoutChangeEvent) => void;
    onContentSizeChange?: (w: number, h: number) => void;
    scrollEnabled?: boolean;
    refreshing?: boolean | null;
};

/**
 * Per-row overrides SwipeListView reads off the row's `item` data, exactly the
 * set v3 read in renderCell. Falsy values fall back to the list-level prop
 * (v3 used `||` — preserved).
 */
type ItemOverrides = {
    leftOpenValue?: number;
    rightOpenValue?: number;
    leftActivationValue?: number;
    rightActivationValue?: number;
    leftActionValue?: number;
    rightActionValue?: number;
    initialLeftActionState?: boolean;
    initialRightActionState?: boolean;
    stopLeftSwipe?: number;
    stopRightSwipe?: number;
    closeOnRowPress?: boolean;
    disableLeftSwipe?: boolean;
    disableRightSwipe?: boolean;
    onLeftAction?: () => void;
    onRightAction?: () => void;
};

/** The subset of the underlying list instance SwipeListView touches. */
type ListInstance = {
    setNativeProps?: (nativeProps: { scrollEnabled: boolean }) => void;
    getScrollResponder?: () =>
        | { setNativeProps?: (nativeProps: { scrollEnabled: boolean }) => void }
        | null
        | undefined;
    scrollToEnd?: () => void;
};

/**
 * ListView that renders SwipeRows.
 */
const SwipeListViewInner = forwardRef<
    SwipeListViewRef,
    SwipeListViewProps<unknown>
>(function SwipeListView(props, ref) {
    const {
        useSectionList,
        renderItem,
        renderHiddenItem,
        keyExtractor,
        closeOnScroll = true,
        closeOnRowPress = true,
        closeOnRowBeginSwipe = false,
        closeOnRowOpen = true,
        previewRowKey,
        swipeRowStyle,
        listViewRef,
        onRowOpen,
        onRowDidOpen,
        onRowClose,
        onRowDidClose,
        onScrollEnabled,
        swipeGestureBegan,
        swipeGestureEnded,
        onSwipeValueChange,
        onLeftAction,
        onRightAction,
        onLeftActionStatusChange,
        onRightActionStatusChange,
        shouldItemUpdate,
        onPreviewEnd,
        leftOpenValue,
        rightOpenValue,
        leftActivationValue,
        rightActivationValue,
        leftActionValue,
        rightActionValue,
        initialLeftActionState,
        initialRightActionState,
        stopLeftSwipe,
        stopRightSwipe,
        friction,
        tension,
        restSpeedThreshold,
        restDisplacementThreshold,
        disableLeftSwipe,
        disableRightSwipe,
        recalculateHiddenLayout,
        disableHiddenLayoutCalculation,
        directionalDistanceChangeThreshold,
        swipeToOpenPercent,
        swipeToOpenVelocityContribution,
        swipeToClosePercent,
        previewDuration,
        previewRepeat,
        previewRepeatDelay,
        previewOpenValue,
        previewOpenDelay,
        onScroll,
        onLayout,
        onContentSizeChange,
        scrollEnabled,
        refreshing,
        ...passThroughProps
    } = props as unknown as InternalSwipeListViewProps;

    const rowMapRef = useRef<RowMap<unknown>>({});
    const openCellKey = useRef<string | null>(null);
    const listRef = useRef<ListInstance | null>(null);
    // iOS only: scroll offset + layout height tracking for the over-scroll
    // close fix (https://github.com/jemise111/react-native-swipe-list-view/issues/109)
    const yScrollOffset = useRef(0);
    const layoutHeight = useRef(0);

    // C4: tolerated-but-removed and hard-removed props
    useEffect(() => {
        const raw = props as unknown as Record<string, unknown>;
        const tolerated: Array<[string, string]> = [
            [
                'useFlatList',
                'was removed in v4 — FlatList is the only list implementation; ' +
                    'the prop is ignored. Remove it.',
            ],
            [
                'useAnimatedList',
                'was removed in v4 — the list is always a Reanimated animated ' +
                    'component; the prop is ignored. Remove it.',
            ],
            [
                'useNativeDriver',
                'was removed in v4. All animations run on the UI thread via ' +
                    'Reanimated; the prop is ignored. Remove it.',
            ],
        ];
        tolerated.forEach(([name, message]) => {
            if (raw[name] !== undefined) {
                warnOnce(name, message);
            }
        });
        const removed = [
            'dataSource',
            'renderRow',
            'renderHiddenRow',
            'renderListView',
            'previewFirstRow',
            'previewRowIndex',
        ];
        removed.forEach(name => {
            if (raw[name] !== undefined) {
                warnOnce(
                    name,
                    'was removed in v4 along with the rest of the ListView-era ' +
                        'API and no longer works. See docs/MIGRATION.md.'
                );
            }
        });
        if (raw.onScroll && typeof raw.onScroll !== 'function') {
            warnOnce(
                'onScroll',
                'must be a plain function in v4 — Animated.event / animated ' +
                    'scroll handler objects are no longer supported and will ' +
                    'be ignored. See docs/MIGRATION.md.'
            );
        }
        // one-time check, intentionally not reactive
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- scroll-enabled plumbing (rows disable parent scroll mid-gesture) ---

    const setRowScrollEnabled = (enable: boolean) => {
        if (scrollEnabled === false) {
            return;
        }
        // Due to multiple issues reported across different versions of RN
        // we do this in the safest way possible (v3 behavior preserved)
        const list = listRef.current;
        if (list?.setNativeProps) {
            list.setNativeProps({ scrollEnabled: enable });
        } else if (list?.getScrollResponder) {
            const scrollResponder = list.getScrollResponder();
            scrollResponder?.setNativeProps?.({ scrollEnabled: enable });
        }
        onScrollEnabled?.(enable);
    };

    // --- open-row bookkeeping ---

    const safeCloseOpenRow = () => {
        const key = openCellKey.current;
        const row = key !== null ? rowMapRef.current[key] : undefined;
        if (row?.closeRow) {
            row.closeRow();
        }
    };

    const handleRowSwipeGestureBegan = (key: string) => {
        if (
            closeOnRowBeginSwipe &&
            openCellKey.current &&
            openCellKey.current !== key
        ) {
            safeCloseOpenRow();
        }
        swipeGestureBegan?.(key);
    };

    const handleRowSwipeGestureEnded = (
        key: string,
        data: SwipeGestureEndedData
    ) => {
        swipeGestureEnded?.(key, data);
    };

    const handleRowOpen = (key: string, toValue: number) => {
        if (
            openCellKey.current &&
            openCellKey.current !== key &&
            closeOnRowOpen &&
            !closeOnRowBeginSwipe
        ) {
            safeCloseOpenRow();
        }
        openCellKey.current = key;
        onRowOpen?.(key, rowMapRef.current, toValue);
    };

    const handleRowPress = () => {
        if (openCellKey.current && closeOnRowPress) {
            safeCloseOpenRow();
            openCellKey.current = null;
        }
    };

    // v3 componentDidUpdate: close the open row while pull-to-refresh is active
    useEffect(() => {
        if (refreshing) {
            safeCloseOpenRow();
        }
    });

    // --- list events ---

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (Platform.OS === 'ios') {
            yScrollOffset.current = event.nativeEvent.contentOffset.y;
        }
        if (openCellKey.current && closeOnScroll) {
            safeCloseOpenRow();
            openCellKey.current = null;
        }
        if (typeof onScroll === 'function') {
            onScroll(event);
        }
    };

    const handleLayout = (event: LayoutChangeEvent) => {
        if (Platform.OS === 'ios') {
            layoutHeight.current = event.nativeEvent.layout.height;
        }
        onLayout?.(event);
    };

    // When deleting rows on iOS, the list may end up being over-scrolled,
    // which will prevent swiping any of the remaining rows. This triggers a
    // scrollToEnd when that happens, which will make sure the list is kept in
    // bounds. See: https://github.com/jemise111/react-native-swipe-list-view/issues/109
    const handleContentSizeChange = (w: number, h: number) => {
        if (Platform.OS === 'ios') {
            const height = h - layoutHeight.current;
            if (yScrollOffset.current >= height && height > 0) {
                listRef.current?.scrollToEnd?.();
            }
        }
        onContentSizeChange?.(w, h);
    };

    const setRefs = (instance: unknown) => {
        listRef.current = instance as ListInstance | null;
        if (typeof listViewRef === 'function') {
            listViewRef(instance);
        } else if (listViewRef && typeof listViewRef === 'object') {
            if ('current' in listViewRef) {
                listViewRef.current = instance;
            }
        }
    };

    // --- imperative API ---

    const closeAllOpenRows = () => {
        Object.keys(rowMapRef.current).forEach(rowKey => {
            const row = rowMapRef.current[rowKey];
            if (row?.closeRow) {
                const rowTranslateX = Math.round(
                    row.swipeAnimatedValue.value || 0
                );
                if (rowTranslateX !== 0) {
                    row.closeRow();
                }
            }
        });
    };

    const manuallyOpenAllRows = (toValue: number) => {
        Object.keys(rowMapRef.current).forEach(rowKey => {
            const row = rowMapRef.current[rowKey];
            row?.manuallySwipeRow?.(toValue);
        });
    };

    useImperativeHandle(ref, () => ({
        closeAllOpenRows,
        manuallyOpenAllRows,
    }));

    // --- row rendering (single pipeline, C12) ---

    const setRowRef = (key: string) => (row: SwipeRowRef<unknown> | null) => {
        if (row) {
            rowMapRef.current[key] = row;
        } else {
            delete rowMapRef.current[key];
        }
    };

    const renderCell = (
        VisibleComponent: React.ReactElement,
        HiddenComponent: React.ReactElement | null | undefined,
        key: string,
        item: unknown,
        shouldPreviewRow: boolean
    ) => {
        if (!HiddenComponent) {
            // C2 compat path: renderItem returned a user-supplied <SwipeRow>.
            // Attach the list's bookkeeping via cloneElement. Deprecated in
            // docs — removal planned for v5.
            const visibleProps = (
                VisibleComponent as React.ReactElement<Record<string, unknown>>
            ).props;
            return cloneElement(VisibleComponent, {
                ...visibleProps,
                ref: setRowRef(key),
                swipeKey: visibleProps.swipeKey ?? key,
                onRowOpen: (toValue: number) => handleRowOpen(key, toValue),
                onRowDidOpen: (toValue: number) =>
                    onRowDidOpen?.(key, rowMapRef.current, toValue),
                onRowClose: () => onRowClose?.(key, rowMapRef.current),
                onRowDidClose: () => onRowDidClose?.(key, rowMapRef.current),
                onRowPress: () => handleRowPress(),
                setScrollEnabled: (enable: boolean) =>
                    setRowScrollEnabled(enable),
                swipeGestureBegan: () => handleRowSwipeGestureBegan(key),
                swipeGestureEnded: (
                    _: string | undefined,
                    data: SwipeGestureEndedData
                ) => handleRowSwipeGestureEnded(key, data),
            });
        }

        const overrides = (item ?? {}) as ItemOverrides;
        return (
            <SwipeRow
                ref={setRowRef(key)}
                swipeKey={key}
                onSwipeValueChange={
                    onSwipeValueChange
                        ? data =>
                              onSwipeValueChange({
                                  ...data,
                                  key,
                              } as SwipeValueChangeData)
                        : undefined
                }
                swipeGestureBegan={() => handleRowSwipeGestureBegan(key)}
                swipeGestureEnded={(_, data) =>
                    handleRowSwipeGestureEnded(key, data)
                }
                onRowOpen={toValue => handleRowOpen(key, toValue)}
                onRowDidOpen={toValue =>
                    onRowDidOpen?.(key, rowMapRef.current, toValue)
                }
                onRowClose={() => onRowClose?.(key, rowMapRef.current)}
                onRowDidClose={() => onRowDidClose?.(key, rowMapRef.current)}
                onRowPress={() => handleRowPress()}
                leftActivationValue={
                    overrides.leftActivationValue || leftActivationValue
                }
                rightActivationValue={
                    overrides.rightActivationValue || rightActivationValue
                }
                leftActionValue={
                    overrides.leftActionValue || leftActionValue || 0
                }
                rightActionValue={
                    overrides.rightActionValue || rightActionValue || 0
                }
                initialLeftActionState={
                    overrides.initialLeftActionState || initialLeftActionState
                }
                initialRightActionState={
                    overrides.initialRightActionState ||
                    initialRightActionState
                }
                onLeftAction={
                    overrides.onLeftAction || onLeftAction
                        ? () => {
                              // item-level callback wins over the list-level
                              // one (v3 intent; v3 had a bug and never invoked
                              // the item-level fn — fixed here)
                              if (overrides.onLeftAction) {
                                  overrides.onLeftAction();
                              } else {
                                  onLeftAction?.(key, rowMapRef.current);
                              }
                          }
                        : undefined
                }
                onRightAction={
                    overrides.onRightAction || onRightAction
                        ? () => {
                              if (overrides.onRightAction) {
                                  overrides.onRightAction();
                              } else {
                                  onRightAction?.(key, rowMapRef.current);
                              }
                          }
                        : undefined
                }
                onLeftActionStatusChange={
                    onLeftActionStatusChange
                        ? data =>
                              onLeftActionStatusChange({
                                  ...data,
                                  key,
                              } as ActionStatusChangeData)
                        : undefined
                }
                onRightActionStatusChange={
                    onRightActionStatusChange
                        ? data =>
                              onRightActionStatusChange({
                                  ...data,
                                  key,
                              } as ActionStatusChangeData)
                        : undefined
                }
                shouldItemUpdate={shouldItemUpdate}
                setScrollEnabled={enable => setRowScrollEnabled(enable)}
                leftOpenValue={overrides.leftOpenValue || leftOpenValue}
                rightOpenValue={overrides.rightOpenValue || rightOpenValue}
                closeOnRowPress={overrides.closeOnRowPress || closeOnRowPress}
                disableLeftSwipe={
                    overrides.disableLeftSwipe || disableLeftSwipe
                }
                disableRightSwipe={
                    overrides.disableRightSwipe || disableRightSwipe
                }
                stopLeftSwipe={overrides.stopLeftSwipe || stopLeftSwipe}
                stopRightSwipe={overrides.stopRightSwipe || stopRightSwipe}
                recalculateHiddenLayout={recalculateHiddenLayout}
                disableHiddenLayoutCalculation={disableHiddenLayoutCalculation}
                style={swipeRowStyle}
                preview={shouldPreviewRow}
                previewDuration={previewDuration}
                previewOpenDelay={previewOpenDelay}
                previewOpenValue={previewOpenValue}
                previewRepeat={previewRepeat}
                previewRepeatDelay={previewRepeatDelay}
                tension={tension}
                friction={friction}
                restSpeedThreshold={restSpeedThreshold}
                restDisplacementThreshold={restDisplacementThreshold}
                directionalDistanceChangeThreshold={
                    directionalDistanceChangeThreshold
                }
                swipeToOpenPercent={swipeToOpenPercent}
                swipeToOpenVelocityContribution={
                    swipeToOpenVelocityContribution
                }
                swipeToClosePercent={swipeToClosePercent}
                item={item} // used for should item update comparisons
                onPreviewEnd={onPreviewEnd}
            >
                {HiddenComponent}
                {VisibleComponent}
            </SwipeRow>
        );
    };

    const internalRenderItem = (rowData: ListRenderItemInfo<unknown>) => {
        const VisibleComponent = renderItem(rowData, rowMapRef.current);
        if (!VisibleComponent) {
            return null;
        }
        const HiddenComponent = renderHiddenItem
            ? renderHiddenItem(rowData, rowMapRef.current)
            : null;
        const { item, index } = rowData;
        let key = (item as { key?: string } | null | undefined)?.key;
        if (keyExtractor) {
            key = keyExtractor(item, index);
        }
        const shouldPreviewRow =
            typeof key !== 'undefined' && previewRowKey === key;

        return renderCell(
            VisibleComponent,
            HiddenComponent,
            key as string,
            item,
            shouldPreviewRow
        );
    };

    // --- render: the only FlatList/SectionList fork (C12) ---

    const ListComponent = (
        useSectionList ? AnimatedSectionList : Animated.FlatList
    ) as unknown as React.ComponentType<Record<string, unknown>>;

    return (
        <ListComponent
            scrollEnabled={scrollEnabled}
            refreshing={refreshing}
            keyExtractor={keyExtractor}
            {...passThroughProps}
            ref={setRefs}
            onScroll={handleScroll}
            onLayout={handleLayout}
            onContentSizeChange={handleContentSizeChange}
            renderItem={internalRenderItem}
        />
    );
});

// v3 SwipeListView was a PureComponent
const MemoSwipeListView = memo(SwipeListViewInner);
MemoSwipeListView.displayName = 'SwipeListView';

type SwipeListViewComponent = (<T = unknown, SectionT = DefaultSectionT>(
    props: SwipeListViewProps<T, SectionT> & {
        ref?: React.Ref<SwipeListViewRef>;
    }
) => React.ReactElement | null) & { displayName?: string };

export default MemoSwipeListView as unknown as SwipeListViewComponent;
