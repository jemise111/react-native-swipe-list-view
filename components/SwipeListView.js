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

	onRowOpen(id) {
		if (this.openCellId && this.openCellId !== id) {
			this.safeCloseOpenRow();
		}
		this.openCellId = id;
		this.props.onRowOpen && this.props.onRowOpen();
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

	renderRow(rowData, secId, rowId, rowMap) {
		const Component = this.props.renderRow(rowData, secId, rowId, rowMap);
		if (Component.type.name === 'SwipeRow') {
			return React.cloneElement(
				Component,
				{
					...Component.props,
					ref: row => this._rows[`${secId}${rowId}`] = row,
					onRowOpen: _ => this.onRowOpen(`${secId}${rowId}`),
					onRowClose: _ => this.props.onRowClose && this.props.onRowClose(),
					onRowPress: _ => this.onRowPress(`${secId}${rowId}`),
					setScrollEnabled: enable => this.setScrollEnabled(enable)
				}
			);
		} else {
			return (
				<SwipeRow
					ref={row => this._rows[`${secId}${rowId}`] = row}
					onRowOpen={ _ => this.onRowOpen(`${secId}${rowId}`) }
					onRowClose={ _ => this.props.onRowClose && this.props.onRowClose() }
					onRowPress={ _ => this.onRowPress(`${secId}${rowId}`) }
					setScrollEnabled={ (enable) => this.setScrollEnabled(enable) }
					leftOpenValue={this.props.leftOpenValue}
					rightOpenValue={this.props.rightOpenValue}
					closeOnRowPress={this.props.closeOnRowPress}
					disableLeftSwipe={this.props.disableLeftSwipe}
					disableRightSwipe={this.props.disableRightSwipe}
					recalculateHiddenLayout={this.props.recalculateHiddenLayout}
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
				ref={ c => this._listView = c}
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
	onRowClose: PropTypes.func
}

SwipeListView.defaultProps = {
	leftOpenValue: 0,
	rightOpenValue: 0,
	closeOnScroll: true,
	closeOnRowPress: true,
	disableLeftSwipe: false,
	disableRightSwipe: false,
	recalculateHiddenLayout: false
}

export default SwipeListView;
