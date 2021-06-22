'use strict';

import React, { PureComponent, Ref } from 'react';
import {
    Animated,
    FlatList,
    Platform,
    SectionList,
    FlatListProps,
    ListRenderItemInfo,
    GestureResponderEvent,
    PanResponderGestureState,
    StyleProp,
    ViewStyle,
    NativeSyntheticEvent,
    NativeScrollEvent,
    LayoutChangeEvent,
} from 'react-native';
import SwipeRow from './SwipeRow';

type RowRef = any; // <=== FIXME:
type RowData<Item> = ListRenderItemInfo<Item>;
type RowMap = { [key: string]: RowRef };
type SwipeDirection = 'left' | 'right';
type SwipeGestureData = {
    translateX: number;
    direction: SwipeDirection;
    event: GestureResponderEvent;
    gestureState: PanResponderGestureState;
};
type SwipeValueData = {
    key: string;
    value: number;
    direction: SwipeDirection;
    isOpen: boolean;
};
type ActionData = {
    isActivated: boolean;
    value: number;
    key: string;
};

type Props<Item> = FlatListProps<Item> & {
    /**
     * To render a custom ListView component, if you don't want to use ReactNative one.
     * Note: This will call `renderRow`, not `renderItem`
     */
    renderListView: any; // <=== FIXME:
    /**
     * How to render a row in a FlatList. Should return a valid React Element.
     */
    renderItem: (
        rowData: RowData<Item>,
        rowMap: RowMap
    ) => React.ReactElement | null;
    /**
     * How to render a hidden row in a FlatList (renders behind the row). Should return a valid React Element.
     * This is required unless renderItem is passing a SwipeRow.
     */
    renderHiddenItem: (
        rowData: RowData<Item>,
        rowMap: RowMap
    ) => React.ReactElement | null;
    /**
     * TranslateX value for opening the row to the left (positive number)
     */
    leftOpenValue: number;
    /**
     * TranslateX value for opening the row to the right (negative number)
     */
    rightOpenValue: number;
    /**
     * TranslateX value for firing onLeftActionStatusChange (positive number)
     */
    leftActivationValue: number;
    /**
     * TranslateX value for firing onRightActionStatusChange (negative number)
     */
    rightActivationValue: number;
    /**
     * TranslateX value for left action to which the row will be shifted after gesture release
     */
    leftActionValue: number;
    /**
     * TranslateX value for right action to which the row will be shifted after gesture release
     */
    rightActionValue: number;
    /**
     * Initial value for left action state (default is false)
     */
    initialLeftActionState: boolean;
    /**
     * Initial value for right action state (default is false)
     */
    initialRightActionState: boolean;
    /**
     * TranslateX value for stop the row to the left (positive number)
     */
    stopLeftSwipe: number;
    /**
     * TranslateX value for stop the row to the right (negative number)
     */
    stopRightSwipe: number;
    /**
     * Should open rows be closed when the listView begins scrolling
     */
    closeOnScroll: boolean;
    /**
     * Should open rows be closed when a row is pressed
     */
    closeOnRowPress: boolean;
    /**
     * Should open rows be closed when a row begins to swipe open
     */
    closeOnRowBeginSwipe: boolean;
    /**
     * Should open rows be closed when another row is opened
     */
    closeOnRowOpen: boolean;
    /**
     * Disable ability to swipe rows left
     */
    disableLeftSwipe: boolean;
    /**
     * Disable ability to swipe rows right
     */
    disableRightSwipe: boolean;
    /**
     * Enable hidden row onLayout calculations to run always.
     *
     * By default, hidden row size calculations are only done on the first onLayout event
     * for performance reasons.
     * Passing ```true``` here will cause calculations to run on every onLayout event.
     * You may want to do this if your rows' sizes can change.
     * One case is a SwipeListView with rows of different heights and an options to delete rows.
     */
    recalculateHiddenLayout: boolean;
    /**
     * Disable hidden row onLayout calculations
     *
     * Instead, {width: '100%', height: '100%'} will be used.
     * Improves performance by avoiding component updates, while still working with orientation changes.
     */
    disableHiddenLayoutCalculation: boolean;
    /**
     * Called when a swipe row is animating swipe
     */
    swipeGestureBegan: (rowKey: string) => void;
    /**
     * Called when user has ended their swipe gesture
     */
    swipeGestureEnded: (rowKey: string, data: SwipeGestureData) => void;
    /**
     * Called when a swipe row is animating open
     */
    onRowOpen: (rowKey: string, rowMap: RowMap, toValue: number) => void;
    /**
     * Called when a swipe row has animated open
     */
    onRowDidOpen: (rowKey: string, rowMap: RowMap, toValue: number) => void;
    /**
     * Called when a swipe row is animating closed
     */
    onRowClose: (rowKey: string, rowMap: RowMap) => void;
    /**
     * Called when a swipe row has animated closed
     */
    onRowDidClose: (rowKey: string, rowMap: RowMap) => void;
    /**
     * Called when row shifted to leftActivationValue
     */
    onLeftAction: () => void;
    /**
     * Called when row shifted to rightActivationValue
     */
    onRightAction: () => void;
    /**
     * Called once when swipe value crosses the leftActivationValue
     */
    onLeftActionStatusChange: (data: ActionData) => void;
    /**
     * Called once when swipe value crosses the rightActivationValue
     */
    onRightActionStatusChange: (data: ActionData) => void;
    /**
     * Called when scrolling on the SwipeListView has been enabled/disabled
     */
    onScrollEnabled: (isEnabled: boolean) => void;
    /**
     * Styles for the parent wrapper View of the SwipeRow
     */
    swipeRowStyle: StyleProp<ViewStyle>;
    /**
     * Called when the FlatList ref is set and passes a ref to the FlatList
     * e.g. listViewRef={ ref => this._swipeListViewRef = ref }
     */
    listViewRef: Ref<FlatList<Item> | SectionList<Item>>; //FIXME: Unsure about this one
    /**
     * Should the row with this key do a slide out preview to show that the list is swipeable
     */
    previewRowKey: string;
    /**
     * [DEPRECATED] Should the first SwipeRow do a slide out preview to show that the list is swipeable
     */
    previewFirstRow: boolean;
    /**
     * [DEPRECATED] Should the specified rowId do a slide out preview to show that the list is swipeable
     * Note: This ID will be passed to this function to get the correct row index
     * https://facebook.github.io/react-native/docs/listviewdatasource.html#getrowidforflatindex
     */
    previewRowIndex: number;
    /**
     * Duration of the slide out preview animation (milliseconds)
     */
    previewDuration: number;
    /**
     * Should the animation repeat until false is provided
     */
    previewRepeat: boolean;
    /**
     * Time between each full completed animation in milliseconds
     * Default: 1000 (1 second)
     */
    previewRepeatDelay: number;
    /**
     * Delay of the slide out preview animation (milliseconds) // default 700ms
     */
    previewOpenDelay: number;
    /**
     * TranslateX value for the slide out preview animation
     * Default: 0.5 * props.rightOpenValue
     */
    previewOpenValue: number;
    /**
     * Friction for the open / close animation
     */
    friction: number;
    /**
     * Tension for the open / close animation
     */
    tension: number;
    /**
     * RestSpeedThreshold for the open / close animation
     */
    restSpeedThreshold: number;
    /**
     * RestDisplacementThreshold for the open / close animation
     */
    restDisplacementThreshold: number;
    /**
     * The dx value used to detect when a user has begun a swipe gesture
     */
    directionalDistanceChangeThreshold: number;
    /**
     * What % of the left/right openValue does the user need to swipe
     * past to trigger the row opening.
     */
    swipeToOpenPercent: number;
    /**
     * Describes how much the ending velocity of the gesture affects whether the swipe will result in the item being closed or open.
     * A velocity factor of 0 means that the velocity will have no bearing on whether the swipe settles on a closed or open position
     * and it'll just take into consideration the swipeToOpenPercent.
     */
    swipeToOpenVelocityContribution: number;
    /**
     * What % of the left/right openValue does the user need to swipe
     * past to trigger the row closing.
     */
    swipeToClosePercent: number;
    /**
     * callback to determine whether component should update (currentItem, newItem)
     */
    shouldItemUpdate: (currentItem: Item, newItem: Item) => boolean;
    /**
     * Callback invoked any time the swipe value of a SwipeRow is changed
     */
    onSwipeValueChange: (swipeValueData: SwipeValueData) => void;
    /**
     * useNativeDriver: true for all animations where possible
     */
    useNativeDriver: boolean;
    /**
     * Use Animated.Flatlist or Animated.Sectionlist
     */
    useAnimatedList: boolean;
    /**
     * Callback that runs after row swipe preview is finished
     */
    onPreviewEnd: () => void;
};

class SwipeListView<Item> extends PureComponent<Props<Item>> {
    _rows: { [key: string]: RowRef };
    openCellKey: string | null;
    listViewProps: Pick<
        FlatListProps<Item>,
        'onLayout' | 'onContentSizeChange'
    >;
    yScrollOffset: number | undefined;
    layoutHeight: number | undefined;
    _onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;

    constructor(props: Props<Item>) {
        super(props);
        this._rows = {};
        this.openCellKey = null;
        this.listViewProps = {};
        if (Platform.OS === 'ios') {
            // Keep track of scroll offset and layout changes on iOS to be able to handle
            // https://github.com/jemise111/react-native-swipe-list-view/issues/109
            this.yScrollOffset = 0;
            this.layoutHeight = 0;
            this.listViewProps = {
                onLayout: e => this.onLayout(e),
                onContentSizeChange: (w, h) => this.onContentSizeChange(w, h),
            };
        }
        this._onScroll = this.onScroll.bind(this);
        if (this.props.onScroll && typeof this.props.onScroll === 'object') {
            // Animated.event
            this.props.onScroll.__addListener(this._onScroll);
            this._onScroll = this.props.onScroll;
        }
    }

    componentDidUpdate() {
        if (this.props.refreshing) {
            this.safeCloseOpenRow();
        }
    }

    setScrollEnabled(enable: boolean) {
        if (this.props.scrollEnabled === false) {
            return;
        }
        // Due to multiple issues reported across different versions of RN
        // We do this in the safest way possible...
        if (this._listView && this._listView.setNativeProps) {
            this._listView.setNativeProps({ scrollEnabled: enable });
        } else if (this._listView && this._listView.getScrollResponder) {
            const scrollResponder = this._listView.getScrollResponder();
            scrollResponder.setNativeProps &&
                scrollResponder.setNativeProps({ scrollEnabled: enable });
        }
        this.props.onScrollEnabled && this.props.onScrollEnabled(enable);
    }

    safeCloseOpenRow() {
        const rowRef = this._rows[this.openCellKey];
        if (rowRef && rowRef.closeRow) {
            this._rows[this.openCellKey].closeRow();
        }
    }

    rowSwipeGestureBegan(key) {
        if (
            this.props.closeOnRowBeginSwipe &&
            this.openCellKey &&
            this.openCellKey !== key
        ) {
            this.safeCloseOpenRow();
        }

        if (this.props.swipeGestureBegan) {
            this.props.swipeGestureBegan(key);
        }
    }

    rowSwipeGestureEnded(key, data) {
        if (this.props.swipeGestureEnded) {
            this.props.swipeGestureEnded(key, data);
        }
    }

    onRowOpen(key, toValue) {
        if (
            this.openCellKey &&
            this.openCellKey !== key &&
            this.props.closeOnRowOpen &&
            !this.props.closeOnRowBeginSwipe
        ) {
            this.safeCloseOpenRow();
        }
        this.openCellKey = key;
        this.props.onRowOpen && this.props.onRowOpen(key, this._rows, toValue);
    }

    onRowPress() {
        if (this.openCellKey) {
            if (this.props.closeOnRowPress) {
                this.safeCloseOpenRow();
                this.openCellKey = null;
            }
        }
    }

    onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
        if (Platform.OS === 'ios') {
            this.yScrollOffset = e.nativeEvent.contentOffset.y;
        }
        if (this.openCellKey) {
            if (this.props.closeOnScroll) {
                this.safeCloseOpenRow();
                this.openCellKey = null;
            }
        }
        typeof this.props.onScroll === 'function' && this.props.onScroll(e);
    }

    onLayout(e: LayoutChangeEvent) {
        this.layoutHeight = e.nativeEvent.layout.height;
        this.props.onLayout && this.props.onLayout(e);
    }

    // When deleting rows on iOS, the list may end up being over-scrolled,
    // which will prevent swiping any of the remaining rows. This triggers a scrollToEnd
    // when that happens, which will make sure the list is kept in bounds.
    // See: https://github.com/jemise111/react-native-swipe-list-view/issues/109
    onContentSizeChange(w, h) {
        const height = h - this.layoutHeight;
        if (this.yScrollOffset >= height && height > 0) {
            if (this._listView instanceof FlatList) {
                this._listView && this._listView.scrollToEnd();
            } else if (this._listView instanceof SectionList) {
                this._listView.scrollToEnd && this._listView.scrollToEnd();
            } else if (this._listView instanceof Animated.FlatList) {
                this._listView.scrollToEnd && this._listView.scrollToEnd();
            }
        }
        this.props.onContentSizeChange && this.props.onContentSizeChange(w, h);
    }

    setRefs(ref) {
        this._listView = ref;
        if (typeof this.props.listViewRef === 'function') {
            this.props.listViewRef && this.props.listViewRef(ref);
        } else if (typeof this.props.listViewRef === 'object') {
            if (Object.keys(this.props.listViewRef).includes('current')) {
                this.props.listViewRef.current = ref;
            }
        }
    }

    closeAllOpenRows() {
        Object.keys(this._rows).forEach(rowKey => {
            const row = this._rows[rowKey];
            if (row) {
                const rowTranslateX = Math.round(row.currentTranslateX || 0);
                if (row.closeRow && rowTranslateX !== 0) {
                    row.closeRow();
                }
            }
        });
    }

    manuallyOpenAllRows(toValue) {
        Object.keys(this._rows).forEach(rowKey => {
            const row = this._rows[rowKey];
            if (row && row.manuallySwipeRow) {
                row.manuallySwipeRow(toValue);
            }
        });
    }

    renderCell(VisibleComponent, HiddenComponent, key, item, shouldPreviewRow) {
        if (!HiddenComponent) {
            return React.cloneElement(VisibleComponent, {
                ...VisibleComponent.props,
                ref: row => (this._rows[key] = row),
                onRowOpen: toValue => this.onRowOpen(key, toValue),
                onRowDidOpen: toValue =>
                    this.props.onRowDidOpen &&
                    this.props.onRowDidOpen(key, this._rows, toValue),
                onRowClose: () =>
                    this.props.onRowClose &&
                    this.props.onRowClose(key, this._rows),
                onRowDidClose: () =>
                    this.props.onRowDidClose &&
                    this.props.onRowDidClose(key, this._rows),
                onRowPress: () => this.onRowPress(),
                setScrollEnabled: enable => this.setScrollEnabled(enable),
                swipeGestureBegan: () => this.rowSwipeGestureBegan(key),
                swipeGestureEnded: (_, data) =>
                    this.rowSwipeGestureEnded(key, data),
            });
        } else {
            return (
                <SwipeRow
                    onSwipeValueChange={
                        this.props.onSwipeValueChange
                            ? data =>
                                  this.props.onSwipeValueChange({
                                      ...data,
                                      key,
                                  })
                            : null
                    }
                    ref={row => (this._rows[key] = row)}
                    swipeGestureBegan={() => this.rowSwipeGestureBegan(key)}
                    swipeGestureEnded={(_, data) =>
                        this.rowSwipeGestureEnded(key, data)
                    }
                    onRowOpen={toValue => this.onRowOpen(key, toValue)}
                    onRowDidOpen={toValue =>
                        this.props.onRowDidOpen &&
                        this.props.onRowDidOpen(key, this._rows, toValue)
                    }
                    onRowClose={() =>
                        this.props.onRowClose &&
                        this.props.onRowClose(key, this._rows)
                    }
                    onRowDidClose={() =>
                        this.props.onRowDidClose &&
                        this.props.onRowDidClose(key, this._rows)
                    }
                    onRowPress={() => this.onRowPress(key)}
                    leftActivationValue={
                        item.leftActivationValue ||
                        this.props.leftActivationValue
                    }
                    rightActivationValue={
                        item.rightActivationValue ||
                        this.props.rightActivationValue
                    }
                    leftActionValue={
                        item.leftActionValue || this.props.leftActionValue || 0
                    }
                    rightActionValue={
                        item.rightActionValue ||
                        this.props.rightActionValue ||
                        0
                    }
                    initialLeftActionState={
                        item.initialLeftActionState ||
                        this.props.initialLeftActionState
                    }
                    initialRightActionState={
                        item.initialRightActionState ||
                        this.props.initialRightActionState
                    }
                    onLeftAction={() =>
                        item.onLeftAction ||
                        (this.props.onLeftAction &&
                            this.props.onLeftAction(key, this._rows))
                    }
                    onRightAction={() =>
                        item.onRightAction ||
                        (this.props.onRightAction &&
                            this.props.onRightAction(key, this._rows))
                    }
                    onLeftActionStatusChange={
                        this.props.onLeftActionStatusChange
                            ? data =>
                                  this.props.onLeftActionStatusChange({
                                      ...data,
                                      key,
                                  })
                            : null
                    }
                    onRightActionStatusChange={
                        this.props.onRightActionStatusChange
                            ? data =>
                                  this.props.onRightActionStatusChange({
                                      ...data,
                                      key,
                                  })
                            : null
                    }
                    shouldItemUpdate={
                        this.props.shouldItemUpdate
                            ? (currentItem, newItem) =>
                                  this.props.shouldItemUpdate(
                                      currentItem,
                                      newItem
                                  )
                            : null
                    }
                    setScrollEnabled={enable => this.setScrollEnabled(enable)}
                    leftOpenValue={
                        item.leftOpenValue || this.props.leftOpenValue
                    }
                    rightOpenValue={
                        item.rightOpenValue || this.props.rightOpenValue
                    }
                    closeOnRowPress={
                        item.closeOnRowPress || this.props.closeOnRowPress
                    }
                    disableLeftSwipe={
                        item.disableLeftSwipe || this.props.disableLeftSwipe
                    }
                    disableRightSwipe={
                        item.disableRightSwipe || this.props.disableRightSwipe
                    }
                    stopLeftSwipe={
                        item.stopLeftSwipe || this.props.stopLeftSwipe
                    }
                    stopRightSwipe={
                        item.stopRightSwipe || this.props.stopRightSwipe
                    }
                    recalculateHiddenLayout={this.props.recalculateHiddenLayout}
                    disableHiddenLayoutCalculation={
                        this.props.disableHiddenLayoutCalculation
                    }
                    style={this.props.swipeRowStyle}
                    preview={shouldPreviewRow}
                    previewDuration={this.props.previewDuration}
                    previewOpenDelay={this.props.previewOpenDelay}
                    previewOpenValue={this.props.previewOpenValue}
                    previewRepeat={this.props.previewRepeat}
                    previewRepeatDelay={this.props.previewRepeatDelay}
                    tension={this.props.tension}
                    restSpeedThreshold={this.props.restSpeedThreshold}
                    restDisplacementThreshold={
                        this.props.restDisplacementThreshold
                    }
                    friction={this.props.friction}
                    directionalDistanceChangeThreshold={
                        this.props.directionalDistanceChangeThreshold
                    }
                    swipeToOpenPercent={this.props.swipeToOpenPercent}
                    swipeToOpenVelocityContribution={
                        this.props.swipeToOpenVelocityContribution
                    }
                    swipeToClosePercent={this.props.swipeToClosePercent}
                    item={item} // used for should item update comparisons
                    useNativeDriver={this.props.useNativeDriver}
                    onPreviewEnd={this.props.onPreviewEnd}
                >
                    {HiddenComponent}
                    {VisibleComponent}
                </SwipeRow>
            );
        }
    }

    // In most use cases this is no longer used. Only in the case we are passed renderListView={true}
    // there may be legacy code that passes a this.props.renderRow func so we keep this for legacy purposes
    renderRow(rowData, secId, rowId, rowMap) {
        const key = `${secId}${rowId}`;
        const Component = this.props.renderRow(rowData, secId, rowId, rowMap);
        const HiddenComponent =
            this.props.renderHiddenRow &&
            this.props.renderHiddenRow(rowData, secId, rowId, rowMap);
        const previewRowId =
            this.props.dataSource &&
            this.props.dataSource.getRowIDForFlatIndex(
                this.props.previewRowIndex || 0
            );
        const shouldPreviewRow =
            (this.props.previewFirstRow || this.props.previewRowIndex) &&
            rowId === previewRowId;

        return this.renderCell(
            Component,
            HiddenComponent,
            key,
            rowData,
            shouldPreviewRow
        );
    }

    renderItem(rowData, rowMap) {
        const Component = this.props.renderItem(rowData, rowMap);
        const HiddenComponent =
            this.props.renderHiddenItem &&
            this.props.renderHiddenItem(rowData, rowMap);
        const { item, index } = rowData;
        let { key } = item;
        if (this.props.keyExtractor) {
            key = this.props.keyExtractor(item, index);
        }

        const shouldPreviewRow =
            typeof key !== 'undefined' && this.props.previewRowKey === key;

        return this.renderCell(
            Component,
            HiddenComponent,
            key,
            item,
            shouldPreviewRow
        );
    }

    _renderItem = rowData => this.renderItem(rowData, this._rows);

    _onRef = c => this.setRefs(c);

    render() {
        const { useSectionList, renderListView, ...props } = this.props;

        if (renderListView) {
            // Ideally renderRow should be deprecated. We do this check for
            // legacy purposes to not break certain renderListView cases
            const useRenderRow = !!this.props.renderRow;
            return renderListView(
                props,
                this.setRefs.bind(this),
                this.onScroll.bind(this),
                useRenderRow
                    ? this.renderRow.bind(this, this._rows)
                    : this.renderItem.bind(this)
            );
        }

        if (useSectionList) {
            const ListComponent = this.props.useAnimatedList
                ? Animated.SectionList
                : SectionList;
            return (
                <ListComponent
                    {...props}
                    {...this.listViewProps}
                    ref={this._onRef}
                    onScroll={this._onScroll}
                    renderItem={this._renderItem}
                />
            );
        }
        const ListComponent = this.props.useAnimatedList
            ? Animated.FlatList
            : FlatList;
        return (
            <ListComponent
                {...props}
                {...this.listViewProps}
                ref={this._onRef}
                onScroll={this._onScroll}
                renderItem={this._renderItem}
            />
        );
    }
}

SwipeListView.defaultProps = {
    leftOpenValue: 0,
    rightOpenValue: 0,
    closeOnRowBeginSwipe: false,
    closeOnScroll: true,
    closeOnRowPress: true,
    closeOnRowOpen: true,
    disableLeftSwipe: false,
    disableRightSwipe: false,
    recalculateHiddenLayout: false,
    disableHiddenLayoutCalculation: false,
    previewFirstRow: false,
    directionalDistanceChangeThreshold: 2,
    swipeToOpenPercent: 50,
    swipeToOpenVelocityContribution: 0,
    swipeToClosePercent: 50,
    useNativeDriver: true,
    previewRepeat: false,
    previewRepeatDelay: 1000,
    useAnimatedList: false,
};

// export default SwipeListView;
