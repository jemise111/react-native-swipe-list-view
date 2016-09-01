'use strict';

import React, {
	Component,
	PropTypes,
} from 'react';
import {
	ListView,
	Text,
	View,
} from 'react-native';

import SwipeRow from './SwipeRow';

/**
 * ListView that renders SwipeRows.
 */
class SwipeListView extends Component {

	constructor(props){
		super(props);
		this._rows = {};
		this.openCellId = null;
	}

	setScrollEnabled(enable) {
		this._listView.setNativeProps({scrollEnabled: enable});
	}

	safeCloseOpenRow() {
		// if the openCellId is stale due to deleting a row this could be undefined
		if (this._rows[this.openCellId]) {
			this._rows[this.openCellId].closeRow();
		}
	}

	onRowOpen(secId, rowId, rowMap) {
		const cellIdentifier = `${secId}${rowId}`;
		if (this.openCellId && this.openCellId !== cellIdentifier) {
			this.safeCloseOpenRow();
		}
		this.openCellId = cellIdentifier;
		this.props.onRowOpen && this.props.onRowOpen(secId, rowId, rowMap);
	}

	onRowPress(id) {
		if (this.openCellId) {
			if (this.props.closeOnRowPress) {
				this.safeCloseOpenRow();
				this.openCellId = null;
			}
		}
	}

	onScroll(e) {
		if (this.openCellId) {
			if (this.props.closeOnScroll) {
				this.safeCloseOpenRow();
				this.openCellId = null;
			}
		}
		this.props.onScroll && this.props.onScroll(e);
	}

	setRefs(ref) {
		this._listView = ref;
		this.props.listViewRef && this.props.listViewRef(ref);
	}

	renderRow(rowData, secId, rowId, rowMap) {
		const Component = this.props.renderRow(rowData, secId, rowId, rowMap);
		if (!this.props.renderHiddenRow) {
			return React.cloneElement(
				Component,
				{
					...Component.props,
					ref: row => this._rows[`${secId}${rowId}`] = row,
					onRowOpen: _ => this.onRowOpen(secId, rowId, this._rows),
					onRowClose: _ => this.props.onRowClose && this.props.onRowClose(secId, rowId, this._rows),
					onRowPress: _ => this.onRowPress(`${secId}${rowId}`),
					setScrollEnabled: enable => this.setScrollEnabled(enable)
				}
			);
		} else {
			const firstRowId = this.props.dataSource && this.props.dataSource.getRowIDForFlatIndex(0);
			return (
				<SwipeRow
					ref={row => this._rows[`${secId}${rowId}`] = row}
					onRowOpen={ _ => this.onRowOpen(secId, rowId, this._rows) }
					onRowClose={ _ => this.props.onRowClose && this.props.onRowClose(secId, rowId, this._rows) }
					onRowPress={ _ => this.onRowPress(`${secId}${rowId}`) }
					setScrollEnabled={ (enable) => this.setScrollEnabled(enable) }
					leftOpenValue={this.props.leftOpenValue}
					rightOpenValue={this.props.rightOpenValue}
					closeOnRowPress={this.props.closeOnRowPress}
					disableLeftSwipe={this.props.disableLeftSwipe}
					disableRightSwipe={this.props.disableRightSwipe}
					recalculateHiddenLayout={this.props.recalculateHiddenLayout}
					style={this.props.swipeRowStyle}
					preview={this.props.previewFirstRow && rowId === firstRowId}
					previewDuration={this.props.previewDuration}
					previewOpenValue={this.props.previewOpenValue}
				>
					{this.props.renderHiddenRow(rowData, secId, rowId, this._rows)}
					{this.props.renderRow(rowData, secId, rowId, this._rows)}
				</SwipeRow>
			);
		}
	}

	render() {
		return (
			<ListView
				{...this.props}
				ref={ c => this.setRefs(c) }
				onScroll={ e => this.onScroll(e) }
				renderRow={(rowData, secId, rowId) => this.renderRow(rowData, secId, rowId, this._rows)}
			/>
		)
	}

}

SwipeListView.propTypes = {
	/**
	 * How to render a row. Should return a valid React Element.
	 */
	renderRow: PropTypes.func.isRequired,
	/**
	 * How to render a hidden row (renders behind the row). Should return a valid React Element.
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
	 * Should open rows be closed when the listView begins scrolling
	 */
	closeOnScroll: PropTypes.bool,
	/**
	 * Should open rows be closed when a row is pressed
	 */
	closeOnRowPress: PropTypes.bool,
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
	 * Called when a swipe row is animating open
	 */
	onRowOpen: PropTypes.func,
	/**
	 * Called when a swipe row is animating closed
	 */
	onRowClose: PropTypes.func,
	/**
	 * Styles for the parent wrapper View of the SwipeRow
	 */
	swipeRowStyle: PropTypes.object,
	/**
	 * Called when the ListView ref is set and passes a ref to the ListView
	 * e.g. listViewRef={ ref => this._swipeListViewRef = ref }
	 */
	listViewRef: PropTypes.func,
	/**
	 * Should the first SwipeRow do a slide out preview to show that the list is swipeable
	 */
	previewFirstRow: PropTypes.bool,
	/**
	 * Duration of the slide out preview animation
	 */
	previewDuration: PropTypes.number,
	/**
	 * TranslateX value for the slide out preview animation
	 * Default: 0.5 * props.rightOpenValue
	 */
	previewOpenValue: PropTypes.number
}

SwipeListView.defaultProps = {
	leftOpenValue: 0,
	rightOpenValue: 0,
	closeOnScroll: true,
	closeOnRowPress: true,
	disableLeftSwipe: false,
	disableRightSwipe: false,
	recalculateHiddenLayout: false,
	previewFirstRow: false
}

export default SwipeListView;
