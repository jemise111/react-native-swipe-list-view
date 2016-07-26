'use strict';

import React, {
	Component,
	PropTypes,
} from 'react';
import {
	Animated,
	PanResponder,
	Platform,
	StyleSheet,
	TouchableOpacity,
	View
} from 'react-native';

const DIRECTIONAL_DISTANCE_CHANGE_THRESHOLD = 2;
function elastic(value, elasticity = 30) {
	return elasticity * Math.log(value + elasticity) - elasticity * Math.log(elasticity);
}

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
		this.state = {
			dimensionsSet: false,
			hiddenHeight: 0,
			hiddenWidth: 0,
			translateX: new Animated.Value(0)
		};
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

	onContentLayout(e) {
		this.setState({
			dimensionsSet: !this.props.recalculateHiddenLayout,
			hiddenHeight: e.nativeEvent.layout.height,
			hiddenWidth: e.nativeEvent.layout.width,
		});
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
		return Math.abs(dx) > DIRECTIONAL_DISTANCE_CHANGE_THRESHOLD;
	}

	handlePanResponderMove(e, gestureState) {
		const { dx, dy, vx } = gestureState;
		const absDx = Math.abs(dx);
		const absDy = Math.abs(dy);

		// this check may not be necessary because we don't capture the move until we pass the threshold
		// just being extra safe here
		if (absDx > DIRECTIONAL_DISTANCE_CHANGE_THRESHOLD || absDy > DIRECTIONAL_DISTANCE_CHANGE_THRESHOLD) {
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
				this.swipeInitialX = this.state.translateX._value
			}
			this.horizontalSwipeGestureBegan = true;

			let newDX = this.swipeInitialX + dx;
			// Disabled swipe
			if (this.props.disableLeftSwipe  && newDX < 0) { newDX = 0; }
			else if (this.props.disableRightSwipe && newDX > 0) { newDX = 0; }
			// Maximum swipe distance
			else if (this.props.maxLeftSwipeDistance && newDX > this.props.maxLeftSwipeDistance) {
				if (this.props.elasticOverscroll) {
					newDX = this.props.maxLeftSwipeDistance + elastic(newDX - this.props.maxLeftSwipeDistance);
				}
				else {
					newDX = this.props.maxLeftSwipeDistance;
				}
			}
			else if (this.props.maxRightSwipeDistance && newDX < this.props.maxRightSwipeDistance) {
				if (this.props.elasticOverscroll) {
					newDX = this.props.maxRightSwipeDistance - elastic(this.props.maxRightSwipeDistance - newDX);
				}
				else {
					newDX = this.props.maxRightSwipeDistance;
				}
			}
			// Fast swipe
			if (this.props.onFastSwipeLeft && newDX < 0 && vx >= this.props.fastSwipeVelocity) {
				this.props.onFastSwipeLeft()
			}
			else if (this.props.onFastSwipeRight && newDX > 0 && vx >= this.props.fastSwipeVelocity) {
				this.props.onFastSwipeRight()
			}

			// elasticOverscroll
			// let scale = 200;
			// newDX = scale * Math.log(newDX + scale) - scale * Math.log(scale);

			this.setState({
				translateX: new Animated.Value(newDX)
			});

		}
	}

	handlePanResponderEnd(e, gestureState) {
		// re-enable scrolling on listView parent
		if (!this.parentScrollEnabled) {
			this.parentScrollEnabled = true;
			this.props.setScrollEnabled && this.props.setScrollEnabled(true);
		}

		// finish up the animation
		let toValue = 0;
		if (this.state.translateX._value >= 0) {
			// trying to open right
			if (this.state.translateX._value > this.props.leftOpenValue / 2) {
				// we're more than halfway
				toValue = this.props.leftOpenValue;
			}
		} else {
			// trying to open left
			if (this.state.translateX._value < this.props.rightOpenValue / 2) {
				// we're more than halfway
				toValue = this.props.rightOpenValue
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
		Animated.spring(this.state.translateX,
			{
				toValue,
				friction: this.props.friction,
				tension: this.props.tension
			}
		).start();

		if (toValue === 0) {
			this.props.onRowClose && this.props.onRowClose();
		} else {
			this.props.onRowOpen && this.props.onRowOpen();
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
						transform: [
							{translateX: this.state.translateX}
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
						transform: [
							{translateX: this.state.translateX}
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
	 * Called when a swipe row is animating open. Used by the SwipeListView
	 * to keep references to open rows.
	 */
	onRowOpen: PropTypes.func,
	/**
	 * TranslateX value for opening the row to the left (positive number)
	 */
	leftOpenValue: PropTypes.number,
	/**
	 * TranslateX value for opening the row to the right (negative number)
	 */
	rightOpenValue: PropTypes.number,
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
	 * Maximum distance row can be swiped
	 */
	maxLeftSwipeDistance: PropTypes.number,
	/**
	 * Disable ability to swipe the row left
	 */
	disableLeftSwipe: PropTypes.bool,
	/**
	 * Maximum distance row can be swiped
	 */
	maxRightSwipeDistance: PropTypes.number,
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
	 * Styles for the parent wrapper View of the SwipeRow
	 */
	style: PropTypes.object
};

SwipeRow.defaultProps = {
	closeOnRowPress: true,
	disableLeftSwipe: false,
	disableRightSwipe: false,
	elasticOverscroll: true,
	fastSwipeVelocity: 2.5,
	leftOpenValue: 0,
	recalculateHiddenLayout: false,
	rightOpenValue: 0
};

export default SwipeRow;
