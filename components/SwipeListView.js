'use strict';

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Animated, Platform, ViewPropTypes } from 'react-native';

import SwipeRow from './SwipeRow';

/**
 * ListView that renders SwipeRows.
 */
class SwipeListView extends PureComponent {
    constructor(props) {
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
        if (typeof this.props.onScroll === 'object') {
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

    setScrollEnabled(enable) {
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

    onScroll(e) {
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

    onLayout(e) {
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
            if (this._listView instanceof Animated.FlatList) {
                this._listView.scrollToEnd && this._listView.scrollToEnd();
            }
        }
        this.props.onContentSizeChange && this.props.onContentSizeChange(w, h);
    }

    setRefs(ref) {
        this._listView = ref;
        this.props.listViewRef && this.props.listViewRef(ref);
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
        if (!key && this.props.keyExtractor) {
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
            return (
                <Animated.SectionList
                    {...props}
                    {...this.listViewProps}
                    ref={this._onRef}
                    onScroll={this._onScroll}
                    renderItem={this._renderItem}
                />
            );
        }

        return (
            <Animated.FlatList
                {...props}
                {...this.listViewProps}
                ref={this._onRef}
                onScroll={this._onScroll}
                renderItem={this._renderItem}
            />
        );
    }
}

SwipeListView.propTypes = {
    /**
     * To render a custom ListView component, if you don't want to use ReactNative one.
     * Note: This will call `renderRow`, not `renderItem`
     */
    renderListView: PropTypes.func,
    /**
     * How to render a row in a FlatList. Should return a valid React Element.
     */
    renderItem: PropTypes.func,
    /**
     * How to render a hidden row in a FlatList (renders behind the row). Should return a valid React Element.
     * This is required unless renderItem is passing a SwipeRow.
     */
    renderHiddenItem: PropTypes.func,
    /**
     * TranslateX value for opening the row to the left (positive number)
     */
    leftOpenValue: PropTypes.number,
    /**
     * TranslateX value for opening the row to the right (negative number)
     */
    rightOpenValue: PropTypes.number,
    /**
     * TranslateX value for stop the row to the left (positive number)
     */
    stopLeftSwipe: PropTypes.number,
    /**
     * TranslateX value for stop the row to the right (negative number)
     */
    stopRightSwipe: PropTypes.number,
    /**
     * Should open rows be closed when the listView begins scrolling
     */
    closeOnScroll: PropTypes.bool,
    /**
     * Should open rows be closed when a row is pressed
     */
    closeOnRowPress: PropTypes.bool,
    /**
     * Should open rows be closed when a row begins to swipe open
     */
    closeOnRowBeginSwipe: PropTypes.bool,
    /**
     * Should open rows be closed when another row is opened
     */
    closeOnRowOpen: PropTypes.bool,
    /**
     * Disable ability to swipe rows left
     */
    disableLeftSwipe: PropTypes.bool,
    /**
     * Disable ability to swipe rows right
     */
    disableRightSwipe: PropTypes.bool,
    /**
     * Enable hidden row onLayout calculations to run always.
     *
     * By default, hidden row size calculations are only done on the first onLayout event
     * for performance reasons.
     * Passing ```true``` here will cause calculations to run on every onLayout event.
     * You may want to do this if your rows' sizes can change.
     * One case is a SwipeListView with rows of different heights and an options to delete rows.
     */
    recalculateHiddenLayout: PropTypes.bool,
    /**
     * Disable hidden row onLayout calculations
     *
     * Instead, {width: '100%', height: '100%'} will be used.
     * Improves performance by avoiding component updates, while still working with orientation changes.
     */
    disableHiddenLayoutCalculation: PropTypes.bool,
    /**
     * Called when a swipe row is animating swipe
     */
    swipeGestureBegan: PropTypes.func,
    /**
     * Called when a swipe row is animating open
     */
    onRowOpen: PropTypes.func,
    /**
     * Called when a swipe row has animated open
     */
    onRowDidOpen: PropTypes.func,
    /**
     * Called when a swipe row is animating closed
     */
    onRowClose: PropTypes.func,
    /**
     * Called when a swipe row has animated closed
     */
    onRowDidClose: PropTypes.func,
    /**
     * Called when scrolling on the SwipeListView has been enabled/disabled
     */
    onScrollEnabled: PropTypes.func,
    /**
     * Called when a scroll event is emitted
     */
    onScroll: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    /**
     * Styles for the parent wrapper View of the SwipeRow
     */
    swipeRowStyle: ViewPropTypes.style,
    /**
     * Called when the FlatList ref is set and passes a ref to the FlatList
     * e.g. listViewRef={ ref => this._swipeListViewRef = ref }
     */
    listViewRef: PropTypes.func,
    /**
     * Should the row with this key do a slide out preview to show that the list is swipeable
     */
    previewRowKey: PropTypes.string,
    /**
     * [DEPRECATED] Should the first SwipeRow do a slide out preview to show that the list is swipeable
     */
    previewFirstRow: PropTypes.bool,
    /**
     * [DEPRECATED] Should the specified rowId do a slide out preview to show that the list is swipeable
     * Note: This ID will be passed to this function to get the correct row index
     * https://facebook.github.io/react-native/docs/listviewdatasource.html#getrowidforflatindex
     */
    previewRowIndex: PropTypes.number,
    /**
     * Duration of the slide out preview animation (milliseconds)
     */
    previewDuration: PropTypes.number,
    /**
     * Should the animation repeat until false is provided
     */
    previewRepeat: PropTypes.bool,
    /**
     * Time between each full completed animation in milliseconds
     * Default: 1000 (1 second)
     */
    previewRepeatDelay: PropTypes.number,
    /**
     * Delay of the slide out preview animation (milliseconds) // default 700ms
     */
    previewOpenDelay: PropTypes.number,
    /**
     * TranslateX value for the slide out preview animation
     * Default: 0.5 * props.rightOpenValue
     */
    previewOpenValue: PropTypes.number,
    /**
     * Friction for the open / close animation
     */
    friction: PropTypes.number,
    /**
     * Tension for the open / close animation
     */
    tension: PropTypes.number,
    /**
     * RestSpeedThreshold for the open / close animation
     */
    restSpeedThreshold: PropTypes.number,
    /**
     * RestDisplacementThreshold for the open / close animation
     */
    restDisplacementThreshold: PropTypes.number,
    /**
     * The dx value used to detect when a user has begun a swipe gesture
     */
    directionalDistanceChangeThreshold: PropTypes.number,
    /**
     * What % of the left/right openValue does the user need to swipe
     * past to trigger the row opening.
     */
    swipeToOpenPercent: PropTypes.number,
    /**
     * Describes how much the ending velocity of the gesture affects whether the swipe will result in the item being closed or open.
     * A velocity factor of 0 means that the velocity will have no bearing on whether the swipe settles on a closed or open position
     * and it'll just take into consideration the swipeToOpenPercent.
     */
    swipeToOpenVelocityContribution: PropTypes.number,
    /**
     * What % of the left/right openValue does the user need to swipe
     * past to trigger the row closing.
     */
    swipeToClosePercent: PropTypes.number,
    /**
     * callback to determine whether component should update (currentItem, newItem)
     */
    shouldItemUpdate: PropTypes.func,
    /**
     * Callback invoked any time the swipe value of a SwipeRow is changed
     */
    onSwipeValueChange: PropTypes.func,
    /**
     * useNativeDriver: true for all animations where possible
     */
    useNativeDriver: PropTypes.bool,
};

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
};

export default SwipeListView;
