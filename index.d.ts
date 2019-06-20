import { Component } from 'react';
import { StyleProp, ViewStyle, Animated, LayoutChangeEvent, GestureResponderEvent, PanResponderGestureState } from 'react-native';

interface IStateSwipeRow {
	dimensionsSet: boolean;
	hiddenHeight: number;
	hiddenWidth: number;
}

interface IPropsSwipeRow {
	/**
	 * Used by the SwipeListView to close rows on scroll events.
	 * You shouldn't need to use this prop explicitly.
	 */
	setScrollEnabled?: (boolean) => void;
	/**
	 * Called when it has been detected that a row should be swiped open.
	 */
	swipeGestureBegan?: () => void;
	/**
	 * Called when a swipe row is animating open. Used by the SwipeListView
	 * to keep references to open rows.
	 */
	onRowOpen?: (toValue: number) => void;
	/**
	 * Called when a swipe row has animated open.
	 */
	onRowDidOpen?: (toValue: number) => void;

	onRowPress?: () => void;

	/**
	 * TranslateX value for opening the row to the left (positive number)
	 */
	leftOpenValue: number;
	/**
	 * TranslateX value for opening the row to the right (negative number)
	 */
	rightOpenValue: number;
	/**
	 * TranslateX value for stop the row to the left (positive number)
	 */
	stopLeftSwipe: number;
	/**
	 * TranslateX value for stop the row to the right (negative number)
	 */
	stopRightSwipe: number;
	/**
	 * Friction for the open / close animation
	 */
	friction?: number;
	/**
	 * Tension for the open / close animation
	 */
	tension?: number;
	/**
	 * Should the row be closed when it is tapped
	 */
	closeOnRowPress?: boolean;
	/**
	 * Disable ability to swipe the row left
	 */
	disableLeftSwipe?: boolean;
	/**
	 * Disable ability to swipe the row right
	 */
	disableRightSwipe?: boolean;
	/**
	 * Enable hidden row onLayout calculations to run always
	 */
	recalculateHiddenLayout?: boolean;
	/**
	 * Disable hidden row onLayout calculations
	 */
	disableHiddenLayoutCalculation?: boolean;
	/**
	 * Called when a swipe row is animating closed
	 */
	onRowClose?: () => void;
	/**
	 * Called when a swipe row has animated closed
	 */
	onRowDidClose?: () => void;
	/**
	 * Styles for the parent wrapper View of the SwipeRow
	 */
	style?: StyleProp<ViewStyle>;
	/**
	 * Should the row do a slide out preview to show that it is swipeable
	 */
	preview: boolean;
	/**
	 * Duration of the slide out preview animation
	 */
	previewDuration?: number;
	/**
	 * TranslateX value for the slide out preview animation
	 * Default: 0.5 * props.rightOpenValue
	 */
	previewOpenValue?: number;
	/**
	 * The dx value used to detect when a user has begun a swipe gesture
	 */
	directionalDistanceChangeThreshold?: number;
	/**
	 * What % of the left/right openValue does the user need to swipe
	 * past to trigger the row opening.
	 */
	swipeToOpenPercent?: number;
	/**
	 * Describes how much the ending velocity of the gesture contributes to whether the swipe will result in the item being closed or open.
	 * A velocity factor of 0 means that the velocity will have no bearing on whether the swipe settles on a closed or open position
	 * and it'll just take into consideration the swipeToOpenPercent.
	 */
	swipeToOpenVelocityContribution?: number;
	/**
	 * What % of the left/right openValue does the user need to swipe
	 * past to trigger the row closing.
	 */
	swipeToClosePercent?: number;
	/**
	 * callback to determine whether component should update (currentItem, newItem)
	 */
	// shouldItemUpdate?: func;
	/**
	 * Callback invoked any time the swipe value of the row is changed
	 * {
		swipeData: {
			value: number;
			direction: 'left' | 'right';
			isOpen: boolean;
		}
	}
	 */
	onSwipeValueChange?: (isOpen: boolean, direction: 'left' | 'right', value: number) => void;
	item?: unknown;
};

type SwipeRowOptions = IStateSwipeRow & IPropsSwipeRow;

export class SwipeRow extends Component<SwipeRowOptions> {
	item: string;
	isOpen: boolean;
	previousTrackedTranslateX: number;
	previousTrackedDirection: 'right' | 'left';
	horizontalSwipeGestureBegan: boolean;
	swipeInitialX: number;
	parentScrollEnabled: boolean;
	ranPreview: boolean;
	_ensureScrollEnabledTimer: number;
	_translateX: Animated;
	constructor(props: SwipeRowOptions);
	componentWillMount: () => void;
	componentWillUnmount: () => void;
	// shouldComponentUpdate
	getPreviewAnimation: (toValue: number, delay: number) => Animated.CompositeAnimation;
	onContentLayout: (e: LayoutChangeEvent) => void;
	onRowPress: () => void;
	handleOnMoveShouldSetPanResponder: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => void;
	handlePanResponderMove: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => void;
	ensureScrollEnabled: () => void;
	handlePanResponderEnd: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => void;
	closeRow: () => void;
	closeRowWithoutAnimation: () => void;
	manuallySwipeRow(toValue: number): void;
	renderVisibleContent(): void;
	renderRowContent(): void;
	render(): JSX.Element;
}

interface IStateSwipeListView {

}

interface IPropsSwipeListView {
	/**
	 * To render a custom ListView component, if you don't want to use ReactNative one.
	 * Note: This will call `renderRow`, not `renderItem`
	 */
	renderListView(param: { props: IPropsSwipeListView; setRefCallback: unknown; onScrollCallback: unknown; renderItemCallback: JSX.Element }): ListView;
	/**
	 * How to render a row in a FlatList. Should return a valid React Element.
	 */
	renderItem(param: { rowData: any; rowMap: { string: SwipeRowRef } }): JSX.Element;
	/**
	 * How to render a hidden row in a FlatList (renders behind the row). Should return a valid React Element.
	 * This is required unless renderItem is passing a SwipeRow.
	 */
	renderHiddenItem(param: { rowData: any; rowMap: { string: SwipeRowRef } }): JSX.Element;
	/**
	 * [DEPRECATED] How to render a row in a ListView. Should return a valid React Element.
	 */
	renderRow(param: { rowData: unknown; secId: string; rowId: string; rowMap: SwipeRow[] }): JSX.Element;
	/**
	 * [DEPRECATED] How to render a hidden row in a ListView (renders behind the row). Should return a valid React Element.
	 * This is required unless renderRow is passing a SwipeRow.
	 */
	renderHiddenRow(param: { rowData: unknown; secId: string; rowId: string; rowMap: SwipeRow[] }): JSX.Element;
	/**
	 * TranslateX value for opening the row to the left (positive number)
	 */
	leftOpenValue: number;
	/**
	 * TranslateX value for opening the row to the right (negative number)
	 */
	rightOpenValue: number;
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
	swipeGestureBegan(param: { rowKey: string }): void;
	/**
	 * Called when a swipe row is animating open
	 */
	onRowOpen(param: { rowKey: string; rowMap: { string: SwipeRowRef }; toValue: number }): void;
	/**
	 * Called when a swipe row has animated open
	 */
	onRowDidOpen(param: { rowKey: string; rowMap: { string: SwipeRowRef }; toValue: number }): void;
	/**
	 * Called when a swipe row is animating closed
	 */
	onRowClose(param: { rowKey: string; rowMap: { string: SwipeRowRef }; toValue: number }): void;
	/**
	 * Called when a swipe row has animated closed
	 */
	onRowDidClose(param: { rowKey: string; rowMap: { string: SwipeRowRef }; toValue: number }): void;
	/**
	 * Called when scrolling on the SwipeListView has been enabled/disabled
	 */
	onScrollEnabled(param: { isEnabled: bool }): void;
	/**
	 * Styles for the parent wrapper View of the SwipeRow
	 */
	swipeRowStyle: StyleProp<ViewStyle>;
	/**
	 * Called when the ListView (or FlatList) ref is set and passes a ref to the ListView (or FlatList)
	 * e.g. listViewRef={ ref => this._swipeListViewRef = ref }
	 */
	listViewRef(ref: React.LegacyRef<React.Component<SectionListProps<any>, any, any>>): void;
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
	 * Delay of the slide out preview animation (milliseconds) // default 700ms
	 */
	prewiewOpenDelay: number;
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
	shouldItemUpdate(param: { currentItem: unknown; newItem: unknown }): void;
	/**
	 * Callback invoked any time the swipe value of a SwipeRow is changed
	 */
	onSwipeValueChange(param: { swipeData: { key: string; value: number; direction: 'left' | 'right'; isOpen: boolean; } }): void;
}

type SwipeListViewOptions = IStateSwipeListView & IPropsSwipeListView;

export class SwipeListView extends React.Component<SwipeListViewOptions> {
	_rows: { [key: string]: SwipeRow }
	openCellKey: string;
	listViewProps: {
		onLayout(e: LayoutChangeEvent): void;
		onContentSizeChange(w: number, h: number): void;
	}
	constructor(props: SwipeListViewOptions);
	setScrollEnabled({ isEnabled: bool }): void;
	safeCloseOpenRow(): void;
	rowSwipeGestureBegan(key: string): void;
	onRowOpen(key: string, toValue: number): void;
	onRowPress(): void;
	onScroll(e: LayoutChangeEvent): void;
	onLayout(e: LayoutChangeEvent): void;
	onContentSizeChange(w: number, h: number): void;
	setRefs(ref: SwipeListView): void;
	renderCell(VisibleComponent: Component, HiddenComponent: Component, key: string, item: unknown, shouldPreviewRow: boolean): JSX.Element;
	renderRow(rowData: unknown, secId: string, rowId: string, rowMap: SwipeRow[]): JSX.Element;
	renderItem(rowData: unknown, rowMap: SwipeRow[]): JSX.Element;
	render(): JSX.Element;
}
