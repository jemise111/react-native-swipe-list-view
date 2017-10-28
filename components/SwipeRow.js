'use strict';

import React, {
	Component,
} from 'react';
import PropTypes from 'prop-types';
import {
	Animated,
	PanResponder,
	Platform,
	StyleSheet,
	TouchableOpacity,
	ViewPropTypes,
	View
} from 'react-native';

const PREVIEW_OPEN_DELAY = 700;
const PREVIEW_CLOSE_DELAY = 300;
const MAX_VELOCITY_CONTRIBUTION = 5;
const SCROLL_LOCK_MILLISECONDS = 300;

/**
 * Row that is generally used in a SwipeListView.
 * If you are rendering a SwipeRow explicitly you must pass the SwipeRow exactly two children.
 * The first will be rendered behind the second.
 * e.g.
  <SwipeRow>
      <View style={hiddenRowStyle} />
      <View style={visibleRowStyle} />
  </SwipeRow>
 */
class SwipeRow extends Component {

	constructor(props) {
		super(props);
		this.horizontalSwipeGestureBegan = false;
		this.swipeInitialX = null;
		this.parentScrollEnabled = true;
		this.ranPreview = false;
		this._ensureScrollEnabledTimer = null;
		this.state = {
			dimensionsSet: false,
			hiddenHeight: 0,
			hiddenWidth: 0
		};
		this._translateX = new Animated.Value(0);
	}

	componentWillMount() {
		this._panResponder = PanResponder.create({
			onMoveShouldSetPanResponder: (e, gs) => this.handleOnMoveShouldSetPanResponder(e, gs),
			onPanResponderMove: (e, gs) => this.handlePanResponderMove(e, gs),
			onPanResponderRelease: (e, gs) => this.handlePanResponderEnd(e, gs),
			onPanResponderTerminate: (e, gs) => this.handlePanResponderEnd(e, gs),
			onShouldBlockNativeResponder: _ => false,
		});
	}

	componentWillUnmount() {
		clearTimeout(this._ensureScrollEnabledTimer)
	}

	getPreviewAnimation(toValue, delay) {
		return Animated.timing(
			this._translateX,
			{ duration: this.props.previewDuration, toValue, delay }
		);
	}

	onContentLayout(e) {
		this.setState({
			dimensionsSet: !this.props.recalculateHiddenLayout,
			hiddenHeight: e.nativeEvent.layout.height,
			hiddenWidth: e.nativeEvent.layout.width,
		});

		if (this.props.preview && !this.ranPreview) {
			this.ranPreview = true;
			let previewOpenValue = this.props.previewOpenValue || this.props.rightOpenValue * 0.5;
			this.getPreviewAnimation(previewOpenValue, PREVIEW_OPEN_DELAY)
			.start( _ => {
				this.getPreviewAnimation(0, PREVIEW_CLOSE_DELAY).start();
			});
		}
	}

	onRowPress() {
		if (this.props.onRowPress) {
			this.props.onRowPress();
		} else {
			if (this.props.closeOnRowPress) {
				this.closeRow();
			}
		}
	}

	handleOnMoveShouldSetPanResponder(e, gs) {
		const { dx } = gs;
		return Math.abs(dx) > this.props.directionalDistanceChangeThreshold;
	}

	handlePanResponderMove(e, gestureState) {
		const { dx, dy } = gestureState;
		const absDx = Math.abs(dx);
		const absDy = Math.abs(dy);

		// this check may not be necessary because we don't capture the move until we pass the threshold
		// just being extra safe here
		if (absDx > this.props.directionalDistanceChangeThreshold || absDy > this.props.directionalDistanceChangeThreshold) {
			// we have enough to determine direction
			if (absDy > absDx && !this.horizontalSwipeGestureBegan) {
				// user is moving vertically, do nothing, listView will handle
				return;
			}

			// user is moving horizontally
			if (this.parentScrollEnabled) {
				// disable scrolling on the listView parent
				this.parentScrollEnabled = false;
				this.props.setScrollEnabled && this.props.setScrollEnabled(false);
			}

			if (this.swipeInitialX === null) {
				// set tranlateX value when user started swiping
				this.swipeInitialX = this._translateX._value
			}
			if (!this.horizontalSwipeGestureBegan) {
				this.horizontalSwipeGestureBegan = true;
				this.props.swipeGestureBegan && this.props.swipeGestureBegan();
			}

			let newDX = this.swipeInitialX + dx;
			if (this.props.disableLeftSwipe  && newDX < 0) { newDX = 0; }
			if (this.props.disableRightSwipe && newDX > 0) { newDX = 0; }


			if (this.props.stopLeftSwipe && newDX > this.props.stopLeftSwipe) { newDX = this.props.stopLeftSwipe; }
			if (this.props.stopRightSwipe && newDX < this.props.stopRightSwipe) { newDX = this.props.stopRightSwipe; }

			this._translateX.setValue(newDX);

		}
	}

	ensureScrollEnabled = () => {
		if (!this.parentScrollEnabled) {
			this.parentScrollEnabled = true;
			this.props.setScrollEnabled && this.props.setScrollEnabled(true);
		}
	}

	handlePanResponderEnd(e, gestureState) {

		// decide how much the velocity will affect the final position that the list item settles in.
		const swipeToOpenVelocityContribution = this.props.swipeToOpenVelocityContribution;
		const possibleExtraPixels = this.props.rightOpenValue * (swipeToOpenVelocityContribution);
		const clampedVelocity = Math.min(gestureState.vx, MAX_VELOCITY_CONTRIBUTION);
		const projectedExtraPixels = possibleExtraPixels * (clampedVelocity / MAX_VELOCITY_CONTRIBUTION);

		// re-enable scrolling on listView parent
		this._ensureScrollEnabledTimer = setTimeout(this.ensureScrollEnabled, SCROLL_LOCK_MILLISECONDS);

		// finish up the animation
		let toValue = 0;
		if (this._translateX._value >= 0) {
			// trying to swipe right
			if (this.swipeInitialX < this._translateX._value) {
				if ((this._translateX._value - projectedExtraPixels) > this.props.leftOpenValue * (this.props.swipeToOpenPercent/100)) {
					// we're more than halfway
					toValue = this.props.leftOpenValue;
				}
			} else {
				if ((this._translateX._value - projectedExtraPixels) > this.props.leftOpenValue * (1 - (this.props.swipeToClosePercent/100))) {
					toValue = this.props.leftOpenValue;
				}
			}
		} else {
			// trying to swipe left
			if (this.swipeInitialX > this._translateX._value) {
				if ((this._translateX._value - projectedExtraPixels) < this.props.rightOpenValue * (this.props.swipeToOpenPercent/100)) {
					// we're more than halfway
					toValue = this.props.rightOpenValue;
				}
			} else {
				if ((this._translateX._value - projectedExtraPixels) < this.props.rightOpenValue * (1 - (this.props.swipeToClosePercent/100))) {
					toValue = this.props.rightOpenValue;
				}
			}
		}

		this.manuallySwipeRow(toValue);
	}

	/*
	 * This method is called by SwipeListView
	 */
	closeRow() {
		this.manuallySwipeRow(0);
	}

	manuallySwipeRow(toValue) {
		Animated.spring(
			this._translateX,
			{
				toValue,
				friction: this.props.friction,
				tension: this.props.tension,
			}
		).start( _ => {
			this.ensureScrollEnabled()
			if (toValue === 0) {
				this.props.onRowDidClose && this.props.onRowDidClose();
			} else {
				this.props.onRowDidOpen && this.props.onRowDidOpen();
			}
		});

		if (toValue === 0) {
			this.props.onRowClose && this.props.onRowClose();
		} else {
			this.props.onRowOpen && this.props.onRowOpen(toValue);
		}

		// reset everything
		this.swipeInitialX = null;
		this.horizontalSwipeGestureBegan = false;
	}

	renderVisibleContent() {
		// handle touchables
		const onPress = this.props.children[1].props.onPress;

		if (onPress) {
			const newOnPress = _ => {
				this.onRowPress();
				onPress();
			}
			return React.cloneElement(
				this.props.children[1],
				{
					...this.props.children[1].props,
					onPress: newOnPress
				}
			);
		}

		return (
			<TouchableOpacity
				activeOpacity={1}
				onPress={ _ => this.onRowPress() }
			>
				{this.props.children[1]}
			</TouchableOpacity>
		)

	}

	renderRowContent() {
		// We do this annoying if statement for performance.
		// We don't want the onLayout func to run after it runs once.
		if (this.state.dimensionsSet) {
			return (
				<Animated.View
					{...this._panResponder.panHandlers}
					style={{
						zIndex: 2,
						transform: [
							{translateX: this._translateX}
						]
					}}
				>
					{this.renderVisibleContent()}
				</Animated.View>
			);
		} else {
			return (
				<Animated.View
					{...this._panResponder.panHandlers}
					onLayout={ (e) => this.onContentLayout(e) }
					style={{
						zIndex: 2,
						transform: [
							{translateX: this._translateX}
						]
					}}
				>
					{this.renderVisibleContent()}
				</Animated.View>
			);
		}
	}

	render() {
		return (
			<View style={this.props.style ? this.props.style : styles.container}>
				<View style={[
					styles.hidden,
					{
						height: this.state.hiddenHeight,
						width: this.state.hiddenWidth,
					}
				]}>
					{this.props.children[0]}
				</View>
				{this.renderRowContent()}
			</View>
		);
	}

}

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
});

SwipeRow.propTypes = {
	/**
	 * Used by the SwipeListView to close rows on scroll events.
	 * You shouldn't need to use this prop explicitly.
	 */
	setScrollEnabled: PropTypes.func,
	/**
	 * Called when it has been detected that a row should be swiped open.
	 */
	swipeGestureBegan: PropTypes.func,
	/**
	 * Called when a swipe row is animating open. Used by the SwipeListView
	 * to keep references to open rows.
	 */
	onRowOpen: PropTypes.func,
	/**
	 * Called when a swipe row has animated open.
	 */
	onRowDidOpen: PropTypes.func,
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
	 * Friction for the open / close animation
	 */
	friction: PropTypes.number,
	/**
	 * Tension for the open / close animation
	 */
	tension: PropTypes.number,
	/**
	 * Should the row be closed when it is tapped
	 */
	closeOnRowPress: PropTypes.bool,
	/**
	 * Disable ability to swipe the row left
	 */
	disableLeftSwipe: PropTypes.bool,
	/**
	 * Disable ability to swipe the row right
	 */
	disableRightSwipe: PropTypes.bool,
	/**
	 * Enable hidden row onLayout calculations to run always
	 */
	recalculateHiddenLayout: PropTypes.bool,
	/**
	 * Called when a swipe row is animating closed
	 */
	onRowClose: PropTypes.func,
	/**
	 * Called when a swipe row has animated closed
	 */
	onRowDidClose: PropTypes.func,
	/**
	 * Styles for the parent wrapper View of the SwipeRow
	 */
	style: ViewPropTypes.style,
	/**
	 * Should the row do a slide out preview to show that it is swipeable
	 */
	preview: PropTypes.bool,
	/**
	 * Duration of the slide out preview animation
	 */
	previewDuration: PropTypes.number,
	/**
	 * TranslateX value for the slide out preview animation
	 * Default: 0.5 * props.rightOpenValue
	 */
	previewOpenValue: PropTypes.number,
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
	 * Describes how much the ending velocity of the gesture contributes to whether the swipe will result in the item being closed or open.
	 * A velocity factor of 0 means that the velocity will have no bearing on whether the swipe settles on a closed or open position
	 * and it'll just take into consideration the swipeToOpenPercent.
	 */
	swipeToOpenVelocityContribution: PropTypes.number,
	/**
	 * What % of the left/right openValue does the user need to swipe
	 * past to trigger the row closing.
	 */
	swipeToClosePercent: PropTypes.number
};

SwipeRow.defaultProps = {
	leftOpenValue: 0,
	rightOpenValue: 0,
	closeOnRowPress: true,
	disableLeftSwipe: false,
	disableRightSwipe: false,
	recalculateHiddenLayout: false,
	preview: false,
	previewDuration: 300,
	directionalDistanceChangeThreshold: 2,
	swipeToOpenPercent: 50,
	swipeToOpenVelocityContribution: 0,
	swipeToClosePercent: 50
};

export default SwipeRow;
