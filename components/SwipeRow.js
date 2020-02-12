'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    Dimensions,
    Animated,
    PanResponder,
    StyleSheet,
    TouchableOpacity,
    ViewPropTypes,
    View,
} from 'react-native';

const DEFAULT_PREVIEW_OPEN_DELAY = 700;
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
        this.isOpen = false;
        this.previousTrackedTranslateX = 0;
        this.currentTranslateX = 0;
        this.previousTrackedDirection = null;
        this.horizontalSwipeGestureBegan = false;
        this.swipeInitialX = null;
        this.parentScrollEnabled = true;
        this.ranPreview = false;
        this._ensureScrollEnabledTimer = null;
        this.isForceClosing = false;
        this.state = {
            previewRepeatInterval: null,
            timeBetweenPreviewRepeats: null,
            dimensionsSet: false,
            hiddenHeight: this.props.disableHiddenLayoutCalculation
                ? '100%'
                : 0,
            hiddenWidth: this.props.disableHiddenLayoutCalculation ? '100%' : 0,
        };
        this._translateX = new Animated.Value(0);

        this._panResponder = PanResponder.create({
            onMoveShouldSetPanResponder: (e, gs) =>
                this.handleOnMoveShouldSetPanResponder(e, gs),
            onPanResponderMove: (e, gs) => this.handlePanResponderMove(e, gs),
            onPanResponderRelease: (e, gs) => this.handlePanResponderEnd(e, gs),
            onPanResponderTerminate: (e, gs) =>
                this.handlePanResponderEnd(e, gs),
            onShouldBlockNativeResponder: () => false,
        });

        this._translateX.addListener(({ value }) => {
            this.currentTranslateX = value;
            if (this.props.onSwipeValueChange) {
                let direction = this.previousTrackedDirection;
                if (value !== this.previousTrackedTranslateX) {
                    direction =
                        value > this.previousTrackedTranslateX
                            ? 'right'
                            : 'left';
                }
                this.props.onSwipeValueChange &&
                    this.props.onSwipeValueChange({
                        isOpen: this.isOpen,
                        direction,
                        value,
                        key: this.props.swipeKey,
                    });
                this.previousTrackedTranslateX = value;
                this.previousTrackedDirection = direction;
            }
        });

        if (
            this.props.forceCloseToRightThreshold &&
            this.props.forceCloseToRightThreshold > 0
        ) {
            this._translateX.addListener(({ value }) => {
                if (
                    !this.isForceClosing &&
                    Dimensions.get('window').width + value <
                        this.props.forceCloseToRightThreshold
                ) {
                    this.isForceClosing = true;
                    this.forceCloseRow('right');
                    if (this.props.onForceCloseToRight) {
                        this.props.onForceCloseToRight();
                    }
                }
            });
        }

        if (
            this.props.forceCloseToLeftThreshold &&
            this.props.forceCloseToRightThreshold > 0
        ) {
            this._translateX.addListener(({ value }) => {
                if (
                    !this.isForceClosing &&
                    Dimensions.get('window').width - value <
                        this.props.forceCloseToLeftThreshold
                ) {
                    this.isForceClosing = true;
                    this.forceCloseRow('left');
                    if (this.props.onForceCloseToLeft) {
                        this.props.onForceCloseToLeft();
                    }
                }
            });
        }
    }

    componentWillUnmount() {
        clearTimeout(this._ensureScrollEnabledTimer);
        this._translateX.removeAllListeners();
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (
            this.state.hiddenHeight !== nextState.hiddenHeight ||
            this.state.hiddenWidth !== nextState.hiddenWidth ||
            !this.props.shouldItemUpdate ||
            (this.props.shouldItemUpdate &&
                this.props.shouldItemUpdate(this.props.item, nextProps.item))
        ) {
            return true;
        }

        return false;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (!nextProps.previewRepeat) {
            clearInterval(prevState.previewRepeatInterval);
            prevState.previewRepeatInterval = null;
        }
        prevState.timeBetweenPreviewRepeats =
            nextProps.previewDuration * 2 +
            nextProps.previewOpenDelay +
            PREVIEW_CLOSE_DELAY +
            nextProps.previewRepeatDelay;
        return prevState;
    }

    getPreviewAnimation(toValue, delay) {
        return Animated.timing(this._translateX, {
            duration: this.props.previewDuration,
            toValue,
            delay,
            useNativeDriver: this.props.useNativeDriver,
        });
    }

    onContentLayout(e) {
        this.setState({
            dimensionsSet: !this.props.recalculateHiddenLayout,
            ...(!this.props.disableHiddenLayoutCalculation
                ? {
                      hiddenHeight: e.nativeEvent.layout.height,
                      hiddenWidth: e.nativeEvent.layout.width,
                  }
                : {}),
        });

        if (this.props.preview && !this.ranPreview) {
            this.ranPreview = true;
            this.doFullAnimation();
            if (this.props.previewRepeat) {
                this.setState({
                    previewRepeatInterval: setInterval(() => {
                        this.doFullAnimation();
                    }, this.state.timeBetweenPreviewRepeats),
                });
            }
        }
    }

    doFullAnimation() {
        const previewOpenValue =
            this.props.previewOpenValue || this.props.rightOpenValue * 0.5;
        return this.getPreviewAnimation(
            previewOpenValue,
            this.props.previewOpenDelay
        ).start(() => {
            this.getPreviewAnimation(0, PREVIEW_CLOSE_DELAY).start();
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
        return Math.abs(dx) > this.props.directionalDistanceChangeThreshold;
    }

    handlePanResponderMove(e, gestureState) {
        /* If the view is force closing, then ignore Moves. Return */
        if (this.isForceClosing) {
            return;
        }

        /* Else, do normal job */
        const { dx, dy } = gestureState;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // this check may not be necessary because we don't capture the move until we pass the threshold
        // just being extra safe here
        if (
            absDx > this.props.directionalDistanceChangeThreshold ||
            absDy > this.props.directionalDistanceChangeThreshold
        ) {
            // we have enough to determine direction
            if (absDy > absDx && !this.horizontalSwipeGestureBegan) {
                // user is moving vertically, do nothing, listView will handle
                return;
            }

            // user is moving horizontally
            if (this.parentScrollEnabled) {
                // disable scrolling on the listView parent
                this.parentScrollEnabled = false;
                this.props.setScrollEnabled &&
                    this.props.setScrollEnabled(false);
            }

            if (this.swipeInitialX === null) {
                // set tranlateX value when user started swiping
                this.swipeInitialX = this.currentTranslateX;
            }
            if (!this.horizontalSwipeGestureBegan) {
                this.horizontalSwipeGestureBegan = true;
                this.props.swipeGestureBegan && this.props.swipeGestureBegan();
            }

            let newDX = this.swipeInitialX + dx;
            if (this.props.disableLeftSwipe && newDX < 0) {
                newDX = 0;
            }
            if (this.props.disableRightSwipe && newDX > 0) {
                newDX = 0;
            }

            if (this.props.stopLeftSwipe && newDX > this.props.stopLeftSwipe) {
                newDX = this.props.stopLeftSwipe;
            }
            if (
                this.props.stopRightSwipe &&
                newDX < this.props.stopRightSwipe
            ) {
                newDX = this.props.stopRightSwipe;
            }

            this._translateX.setValue(newDX);
        }
    }

    ensureScrollEnabled = () => {
        if (!this.parentScrollEnabled) {
            this.parentScrollEnabled = true;
            this.props.setScrollEnabled && this.props.setScrollEnabled(true);
        }
    };

    handlePanResponderEnd(e, gestureState) {
        /* PandEnd will reset the force-closing state when it's true. */
        if (this.isForceClosing) {
            setTimeout(() => {
                this.isForceClosing = false;
            }, 500); // 500 is the default Animated.spring's duration used in manuallySwipeRow
        }
        // decide how much the velocity will affect the final position that the list item settles in.
        const swipeToOpenVelocityContribution = this.props
            .swipeToOpenVelocityContribution;
        const possibleExtraPixels =
            this.props.rightOpenValue * swipeToOpenVelocityContribution;
        const clampedVelocity = Math.min(
            gestureState.vx,
            MAX_VELOCITY_CONTRIBUTION
        );
        const projectedExtraPixels =
            possibleExtraPixels * (clampedVelocity / MAX_VELOCITY_CONTRIBUTION);

        // re-enable scrolling on listView parent
        this._ensureScrollEnabledTimer = setTimeout(
            this.ensureScrollEnabled,
            SCROLL_LOCK_MILLISECONDS
        );

        // finish up the animation
        let toValue = 0;
        if (this.currentTranslateX >= 0) {
            // trying to swipe right
            // if (this.props.disableRightSwipe) {
            //    return;
            // }

            if (this.swipeInitialX < this.currentTranslateX) {
                if (
                    this.currentTranslateX - projectedExtraPixels >
                    this.props.leftOpenValue *
                        (this.props.swipeToOpenPercent / 100)
                ) {
                    // we're more than halfway
                    toValue = this.isForceClosing
                        ? 0
                        : this.props.leftOpenValue;
                }
            } else {
                if (
                    this.currentTranslateX - projectedExtraPixels >
                    this.props.leftOpenValue *
                        (1 - this.props.swipeToClosePercent / 100)
                ) {
                    toValue = this.isForceClosing
                        ? 0
                        : this.props.leftOpenValue;
                }
            }
        } else {
            // trying to swipe left
            if (this.props.disableLeftSwipe) {
                return;
            }

            if (this.swipeInitialX > this.currentTranslateX) {
                if (
                    this.currentTranslateX - projectedExtraPixels <
                    this.props.rightOpenValue *
                        (this.props.swipeToOpenPercent / 100)
                ) {
                    // we're more than halfway
                    toValue = this.isForceClosing
                        ? 0
                        : this.props.rightOpenValue;
                }
            } else {
                if (
                    this.currentTranslateX - projectedExtraPixels <
                    this.props.rightOpenValue *
                        (1 - this.props.swipeToClosePercent / 100)
                ) {
                    toValue = this.isForceClosing
                        ? 0
                        : this.props.rightOpenValue;
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

    /**
     * Force close the row toward the end of the given direction.
     * @param  {String} direction The direction to force close.
     */
    forceCloseRow(direction) {
        this.manuallySwipeRow(0, () => {
            if (direction === 'right' && this.props.onForceCloseToRightEnd) {
                this.props.onForceCloseToRightEnd();
            } else if (
                direction === 'left' &&
                this.props.onForceCloseToLeftEnd
            ) {
                this.props.onForceCloseToLeftEnd();
            }
        });
    }

    closeRowWithoutAnimation() {
        this._translateX.setValue(0);

        this.ensureScrollEnabled();
        this.isOpen = false;
        this.props.onRowDidClose && this.props.onRowDidClose();

        this.props.onRowClose && this.props.onRowClose();

        this.swipeInitialX = null;
        this.horizontalSwipeGestureBegan = false;
    }

    manuallySwipeRow(toValue, onAnimationEnd) {
        Animated.spring(this._translateX, {
            toValue,
            friction: this.props.friction,
            tension: this.props.tension,
            useNativeDriver: this.props.useNativeDriver,
        }).start(() => {
            this.ensureScrollEnabled();
            if (toValue === 0) {
                this.isOpen = false;
                this.props.onRowDidClose && this.props.onRowDidClose();
            } else {
                this.isOpen = true;
                this.props.onRowDidOpen && this.props.onRowDidOpen(toValue);
            }
            if (onAnimationEnd) {
                onAnimationEnd();
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

    combinedOnPress = () => {
        const onPress = this.props.children[1].props.onPress;
        this.onRowPress();
        onPress && onPress();
    };

    renderVisibleContent() {
        if (!this.props.closeOnRowPress) {
            return this.props.children[1];
        }

        // handle touchables
        const onPress = this.props.children[1].props.onPress;

        if (onPress) {
            return React.cloneElement(this.props.children[1], {
                ...this.props.children[1].props,
                onPress: this.combinedOnPress,
            });
        }

        return (
            <TouchableOpacity
                activeOpacity={1}
                onPress={this.combinedOnPress}
                accessible={false}
            >
                {this.props.children[1]}
            </TouchableOpacity>
        );
    }

    renderRowContent() {
        // We do this annoying if statement for performance.
        // We don't want the onLayout func to run after it runs once.
        if (this.state.dimensionsSet) {
            return (
                <Animated.View
                    manipulationModes={['translateX']}
                    {...this._panResponder.panHandlers}
                    style={{
                        zIndex: 2,
                        transform: [{ translateX: this._translateX }],
                    }}
                >
                    {this.renderVisibleContent()}
                </Animated.View>
            );
        } else {
            return (
                <Animated.View
                    manipulationModes={['translateX']}
                    {...this._panResponder.panHandlers}
                    onLayout={e => this.onContentLayout(e)}
                    style={{
                        zIndex: 2,
                        transform: [{ translateX: this._translateX }],
                    }}
                >
                    {this.renderVisibleContent()}
                </Animated.View>
            );
        }
    }

    render() {
        return (
            <View
                style={this.props.style ? this.props.style : styles.container}
            >
                <View
                    style={[
                        styles.hidden,
                        {
                            height: this.state.hiddenHeight,
                            width: this.state.hiddenWidth,
                        },
                    ]}
                >
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
     * Disable hidden row onLayout calculations
     */
    disableHiddenLayoutCalculation: PropTypes.bool,
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
     * Should the animation repeat until false is provided
     */
    previewRepeat: PropTypes.bool,
    /**
     * Time between each full completed animation in milliseconds
     * Default: 1000 (1 second)
     */
    previewRepeatDelay: PropTypes.number,
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
    swipeToClosePercent: PropTypes.number,
    /**
     * callback to determine whether component should update (currentItem, newItem)
     */
    shouldItemUpdate: PropTypes.func,
    /**
     * Callback invoked any time the swipe value of the row is changed
     */
    onSwipeValueChange: PropTypes.func,
    /**
     * TranslateX amount(not value!) threshold that triggers force-closing the row to the Left End (positive number)
     */
    forceCloseToLeftThreshold: PropTypes.number,
    /**
     * TranslateX amount(not value!) threshold that triggers force-closing the row to the Right End (positive number)
     */
    forceCloseToRightThreshold: PropTypes.number,
    /**
     * Callback invoked when row is force closing to the Left End
     */
    onForceCloseToLeft: PropTypes.func,
    /**
     * Callback invoked when row is force closing to the Right End
     */
    onForceCloseToRight: PropTypes.func,
    /**
     * Callback invoked when row has finished force closing to the Left End
     */
    onForceCloseToLeftEnd: PropTypes.func,
    /**
     * Callback invoked when row has finished force closing to the Right End
     */
    onForceCloseToRightEnd: PropTypes.func,
    /**
     * useNativeDriver: true for all animations where possible
     */
    useNativeDriver: PropTypes.bool,
    /**
     * Children
     */
    children: PropTypes.node.isRequired,
    /**
     * Key used to identify rows on swipe value changes
     */
    swipeKey: PropTypes.string,
};

SwipeRow.defaultProps = {
    leftOpenValue: 0,
    rightOpenValue: 0,
    closeOnRowPress: true,
    disableLeftSwipe: false,
    disableRightSwipe: false,
    recalculateHiddenLayout: false,
    disableHiddenLayoutCalculation: false,
    preview: false,
    previewDuration: 300,
    previewOpenDelay: DEFAULT_PREVIEW_OPEN_DELAY,
    directionalDistanceChangeThreshold: 2,
    swipeToOpenPercent: 50,
    swipeToOpenVelocityContribution: 0,
    swipeToClosePercent: 50,
    item: {},
    useNativeDriver: true,
    previewRepeat: false,
    previewRepeatDelay: 1000,
};

export default SwipeRow;
