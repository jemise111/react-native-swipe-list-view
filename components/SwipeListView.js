'use strict';

import React, {
	Component,
	ListView,
	PropTypes,
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

	onRowOpen(id) {
		if (this.openCellId && this.openCellId !== id) {
			this._rows[this.openCellId].closeRow();
		}
		this.openCellId = id;
	}

	onRowPress(id) {
		if (this.openCellId) {
			if (this.props.closeOnRowPress) {
				this._rows[this.openCellId].closeRow();
				this.openCellId = null;
			}
		}
	}

	onScroll() {
		if (this.openCellId) {
			if (this.props.closeOnScroll) {
				this._rows[this.openCellId].closeRow();
				this.openCellId = null;
			}
		}
		this.props.onScoll && this.props.onScroll();
	}

	render() {
		return (
			<ListView
				{...this.props}
				ref={ c => this._listView = c}
				onScroll={ _ => this.onScroll() }
				renderRow={(rowData, secId, rowId) => (
					<SwipeRow
						ref={row => this._rows[rowId] = row}
						onRowOpen={ _ => this.onRowOpen(rowId) }
						onRowPress={ _ => this.onRowPress(rowId) }
						setScrollEnabled={ (enable) => this.setScrollEnabled(enable) }
						leftOpenValue={this.props.leftOpenValue}
						rightOpenValue={this.props.rightOpenValue}
						closeOnRowPress={this.props.closeOnRowPress}
						disableLeftSwipe={this.props.disableLeftSwipe}
						disableRightSwipe={this.props.disableRightSwipe}
					>
						{this.props.renderHiddenRow(rowData, secId, rowId, this._rows)}
						{this.props.renderRow(rowData, secId, rowId, this._rows)}
					</SwipeRow>
				)}
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
	 */
	renderHiddenRow: PropTypes.func.isRequired,
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
	disableRightSwipe: PropTypes.bool
}

SwipeListView.defaultProps = {
	leftOpenValue: 0,
	rightOpenValue: 0,
	closeOnScroll: true,
	closeOnRowPress: true,
	disableLeftSwipe: false,
	disableRightSwipe: false
}

export default SwipeListView;
