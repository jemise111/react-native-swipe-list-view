'use strict'

import React, {
	Component,
} from 'react';
import PropTypes from 'prop-types';
import {
	FlatList,
	ListView,
	Text,
	ViewPropTypes,
	View,
	SectionList 
} from 'react-native';

import SwipeRow from './SwipeRow';

/**
 * ListView that renders SwipeRows.
 */
class SwipeListView extends Component {

	constructor(props){
		super(props);
		this._rows = {};
		this.openCellKey = null;
	}

	setScrollEnabled(enable) {
		// Due to multiple issues reported across different versions of RN
		// We do this in the safest way possible...
		if (this._listView && this._listView.setNativeProps) {
			this._listView.setNativeProps({scrollEnabled: enable});
		} else if (this._listView && this._listView.getScrollResponder) {
			const scrollResponder = this._listView.getScrollResponder();
			scrollResponder.setNativeProps && scrollResponder.setNativeProps({scrollEnabled: enable});
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
		if (this.props.closeOnRowBeginSwipe && this.openCellKey && this.openCellKey !== key) {
			this.safeCloseOpenRow();
		}

		if (this.props.swipeGestureBegan) {
			this.props.swipeGestureBegan(key);
		}
	}

	onRowOpen(key) {
		if (this.openCellKey && this.openCellKey !== key) {
			this.safeCloseOpenRow();
		}
		this.openCellKey = key;
		this.props.onRowOpen && this.props.onRowOpen(key, this._rows);
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
		if (this.openCellKey) {
			if (this.props.closeOnScroll) {
				this.safeCloseOpenRow();
				this.openCellKey = null;
			}
		}
		this.props.onScroll && this.props.onScroll(e);
	}

	setRefs(ref) {
		this._listView = ref;
		this.props.listViewRef && this.props.listViewRef(ref);
	}

	renderCell(VisibleComponent, HiddenComponent, key, item, shouldPreviewRow) {
		if (!HiddenComponent) {
			return React.cloneElement(
				VisibleComponent,
				{
					...VisibleComponent.props,
					ref: row => this._rows[key] = row,
					onRowOpen: _ => this.onRowOpen(key),
					onRowDidOpen: _ => this.props.onRowDidOpen && this.props.onRowDidOpen(key, this._rows),
					onRowClose: _ => this.props.onRowClose && this.props.onRowClose(key, this._rows),
					onRowDidClose: _ => this.props.onRowDidClose && this.props.onRowDidClose(key, this._rows),
					onRowPress: _ => this.onRowPress(),
					setScrollEnabled: enable => this.setScrollEnabled(enable),
					swipeGestureBegan: _ => this.rowSwipeGestureBegan(key)
				}
			);
		} else {
			return (
				<SwipeRow
					ref={row => this._rows[key] = row}
					swipeGestureBegan={ _ => this.rowSwipeGestureBegan(key) }
					onRowOpen={ _ => this.onRowOpen(key) }
					onRowDidOpen={ _ => this.props.onRowDidOpen && this.props.onRowDidOpen(key, this._rows)}
					onRowClose={ _ => this.props.onRowClose && this.props.onRowClose(key, this._rows) }
					onRowDidClose={ _ => this.props.onRowDidClose && this.props.onRowDidClose(key, this._rows) }
					onRowPress={ _ => this.onRowPress(key) }
					setScrollEnabled={ (enable) => this.setScrollEnabled(enable) }
					leftOpenValue={item.leftOpenValue || this.props.leftOpenValue}
					rightOpenValue={item.rightOpenValue || this.props.rightOpenValue}
					closeOnRowPress={item.closeOnRowPress || this.props.closeOnRowPress}
					disableLeftSwipe={item.disableLeftSwipe || this.props.disableLeftSwipe}
					disableRightSwipe={item.disableRightSwipe || this.props.disableRightSwipe}
					stopLeftSwipe={item.stopLeftSwipe || this.props.stopLeftSwipe}
					stopRightSwipe={item.stopRightSwipe || this.props.stopRightSwipe}
					recalculateHiddenLayout={this.props.recalculateHiddenLayout}
					style={this.props.swipeRowStyle}
					preview={shouldPreviewRow}
					previewDuration={this.props.previewDuration}
					previewOpenValue={this.props.previewOpenValue}
					tension={this.props.tension}
					friction={this.props.friction}
					directionalDistanceChangeThreshold={this.props.directionalDistanceChangeThreshold}
					swipeToOpenPercent={this.props.swipeToOpenPercent}
					swipeToOpenVelocityContribution={this.props.swipeToOpenVelocityContribution}
					swipeToClosePercent={this.props.swipeToClosePercent}
				>
					{HiddenComponent}
					{VisibleComponent}
				</SwipeRow>
			);
		}
	}

	renderRow(rowData, secId, rowId, rowMap) {
		const key = `${secId}${rowId}`;
		const Component = this.props.renderRow(rowData, secId, rowId, rowMap);
		const HiddenComponent = this.props.renderHiddenRow && this.props.renderHiddenRow(rowData, secId, rowId, rowMap);
		const previewRowId = this.props.dataSource && this.props.dataSource.getRowIDForFlatIndex(this.props.previewRowIndex || 0);
		const shouldPreviewRow = (this.props.previewFirstRow || this.props.previewRowIndex) && rowId === previewRowId;

		return this.renderCell(Component, HiddenComponent, key, rowData, shouldPreviewRow);
	}

	renderItem(rowData, rowMap) {
		const Component = this.props.renderItem(rowData, rowMap);
		const HiddenComponent = this.props.renderHiddenItem && this.props.renderHiddenItem(rowData, rowMap);
		let { item, index } = rowData;
		let { key } = item;
		if (!key && this.props.keyExtractor) {
			key = this.props.keyExtractor(item, index);
		}

		const shouldPreviewRow = this.props.previewRowKey === key;

		return this.renderCell(Component, HiddenComponent, key, item, shouldPreviewRow);
	}

	render() {
		const { useSectionList, useFlatList, renderListView, ...props } = this.props;

		if (renderListView) {
			return renderListView(
				props,
				this.setRefs.bind(this),
				this.onScroll.bind(this),
				useFlatList ? this.renderItem.bind(this) : this.renderRow.bind(this, this._rows),
				useSectionList ? this.renderItem.bind(this) : this.renderRow.bind(this, this._rows),		    
			);
		}
	   
		if (useSectionList) {
			return (
				<SectionList
					{...props}
					ref={ c => this.setRefs(c) }
					onScroll={ e => this.onScroll(e) }
					renderItem={(rowData) => this.renderItem(rowData, this._rows)}
				/>
			);
		}


		if (useFlatList) {
			return (
				<FlatList
					{...props}
					ref={ c => this.setRefs(c) }
					onScroll={ e => this.onScroll(e) }
					renderItem={(rowData) => this.renderItem(rowData, this._rows)}
				/>
			);
		}

		return (
			<ListView
				{...props}
				ref={ c => this.setRefs(c) }
				onScroll={ e => this.onScroll(e) }
				renderRow={(rowData, secId, rowId) => this.renderRow(rowData, secId, rowId, this._rows)}
			/>
		)
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
	 * [DEPRECATED] How to render a row in a ListView. Should return a valid React Element.
	 */
	renderRow: PropTypes.func,
	/**
	 * [DEPRECATED] How to render a hidden row in a ListView (renders behind the row). Should return a valid React Element.
	 * This is required unless renderRow is passing a SwipeRow.
	 */
	renderHiddenRow: PropTypes.func,
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
	 * Passing true here will cause calculations to run on every onLayout event.
	 * You may want to do this if your rows' sizes can change.
	 * One case is a SwipeListView with rows of different heights and an options to delete rows.
	 */
	recalculateHiddenLayout: PropTypes.bool,
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
	 * Styles for the parent wrapper View of the SwipeRow
	 */
	swipeRowStyle: ViewPropTypes.style,
	/**
	 * Called when the ListView (or FlatList) ref is set and passes a ref to the ListView (or FlatList)
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
	 * TranslateX value for the slide out preview animation
	  Default: 0.5  props.rightOpenValue
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
	swipeToClosePercent: PropTypes.number
}

SwipeListView.defaultProps = {
	leftOpenValue: 0,
	rightOpenValue: 0,
	closeOnRowBeginSwipe: false,
	closeOnScroll: true,
	closeOnRowPress: true,
	disableLeftSwipe: false,
	disableRightSwipe: false,
	recalculateHiddenLayout: false,
	previewFirstRow: false,
	directionalDistanceChangeThreshold: 2,
	swipeToOpenPercent: 50,
	swipeToOpenVelocityContribution: 0,
	swipeToClosePercent: 50
}

export default SwipeListView;
