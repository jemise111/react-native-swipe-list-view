# `<SwipeListView />` API

A List that renders `<SwipeRow />`s

### Props

| Prop | Notes | Type | Signature (func) | Default |
|---|---|---|---|---|
| `useSectionList` | Render list using React Native's `SectionList` | `bool` || `false`
| `renderItem` | How to render a row in a FlatList. Should return a valid React Element. | `func` | `{ rowData: any, rowMap: { string: SwipeRowRef } } : ReactElement`
| `renderHiddenItem` | How to render a hidden row in a FlatList (renders behind the row). Should return a valid React Element. This is required unless `renderItem` returns a `<SwipeRow>` (see [Per Row Behavior](https://github.com/jemise111/react-native-swipe-list-view/blob/master/docs/per-row-behavior.md)). | `func` | `{ rowData: any, rowMap: { string: SwipeRowRef } } : ReactElement`
| `leftOpenValue` | TranslateX value for opening the row to the left (positive number) | `number` || `0`
| `rightOpenValue` | TranslateX value for opening the row to the right (negative number) | `number` || `0`
| `closeOnRowPress` | Should open rows be closed when a row is pressed | `bool` || `true`
| `closeOnRowOpen` | Should open rows be closed when another row is opened | `bool` || `true`
| `closeOnRowBeginSwipe` | Should open rows be closed when a row begins to swipe open | `bool` || `false`
| `closeOnScroll` | Should open rows be closed when the listView begins scrolling | `bool` || `true`
| `disableLeftSwipe` | Disable ability to swipe the row left | `bool` || `false`
| `disableRightSwipe` | Disable ability to swipe the row right | `bool` || `false`
| `stopLeftSwipe` | TranslateX value for stop the row to the left (positive number). This number is the stop value corresponding to the `leftOpenValue` (while the row is swiping in the right direction) | `number`
| `stopRightSwipe` | TranslateX value for stop the row to the right (negative number). This number is the stop value corresponding to the `rightOpenValue` (while the row is swiping in the left direction) | `number`
| `directionalDistanceChangeThreshold` | Change the sensitivity of the row | `number` || `2`
| `swipeToOpenPercent` | What % of the left/right openValue does the user need to swipe past to trigger the row opening. | `number` || `50`
| `swipeToClosePercent` | What % of the left/right openValue does the user need to swipe past to trigger the row closing. | `number` || `50`
| `swipeToOpenVelocityContribution` | Describes how much the ending velocity of the gesture affects whether the swipe will result in the item being closed or open. A velocity factor of 0 (the default) means that the velocity will have no bearing on whether the swipe settles on a closed or open position and it'll just take into consideration the swipeToOpenPercent. Ideal values for this prop tend to be between 5 and 15. | `number` || `0`
| `recalculateHiddenLayout` | Enable hidden row onLayout calculations to run always. By default, hidden row size calculations are only done on the first onLayout event for performance reasons. Passing ```true``` here will cause calculations to run on every onLayout event. You may want to do this if your rows' sizes can change. One case is a SwipeListView with rows of different heights and an options to delete rows. | `bool` || `false`
| `swipeGestureBegan` | Called when a swipe row is animating swipe | `func` | `{ rowKey: string } : void`
| `onRowClose` | Called when a swipe row is animating closed | `func` | `{ rowKey: string, rowMap: { string: SwipeRowRef } } : void`
| `onRowDidClose` | Called when a swipe row has animated closed | `func` | `{ rowKey: string, rowMap: { string: SwipeRowRef } } : void`
| `onRowOpen` | Called when a swipe row is animating open. This has a param of `toValue` which is the new X value the row (after it has opened). This can be used to calculate which direction the row has been swiped open. | `func` | `{ rowKey: string, rowMap: { string: SwipeRowRef }, toValue: number } : void`
| `onRowDidOpen` | Called when a swipe row has animated open | `func` | `{ rowKey: string, rowMap: { string: SwipeRowRef }, toValue: number } : void`
| `onScrollEnabled` | Called when scrolling has been enabled/disabled | `func` | `{ isEnabled: bool } : void`
| `swipeRowStyle` | Styles for the parent wrapper View of the SwipeRow | `object`
| `listViewRef` | Called when the ListView ref is set and passes a ref to the ListView. e.g. `listViewRef={ ref => this._swipeListViewRef = ref }` | `func` | `{ ref: ListView | FlatList | SectionList } : void`
| `previewRowKey` | Should the row with this key do a slide out preview to show that the list is swipeable | `string`
| `previewDuration` | Duration of the slide out preview animation | `number`
| `previewRepeat` | Should the animation repeat | `bool` || `false`
| `previewRepeatDelay` | Delay between each preview repeat in milliseconds | `number` || `1000`
| `previewOpenValue` | TranslateX value for the slide out preview animation. | `number` || `0.5 * props.rightOpenValue`
| `previewOpenDelay` | Add some delay before opening the preview row. Can be useful when you have enter animation. | `number`
| `friction` | Friction for the open / close animation. Controls "bounciness"/overshoot. https://facebook.github.io/react-native/docs/animated#spring | `number` || `7`  
| `tension` | Tension for the open / close animation. Controls speed. https://facebook.github.io/react-native/docs/animated#spring | `number` || `40`  
| `restSpeedThreshold` | RestSpeedThreshold for the open / close animation. Controls speed. https://facebook.github.io/react-native/docs/animated#spring | `number` || `0.001` 
| `restDisplacementThreshold` | RestDisplacementThreshold for the open / close animation. Controls speed. https://facebook.github.io/react-native/docs/animated#spring | `number` || `0.001` 
| `onSwipeValueChange` | Callback invoked any time the translateX value of a row changes | `func` | <code>{ swipeData: { key: string, value: number, direction: 'left' &#124; 'right', isOpen: bool } } : void</code>
| `renderListView` | To render a custom ListView component, if you don't want to use ReactNative one. Note: This will call `renderRow`, not `renderItem` | `func` | `{ props, setRefCallback, onScrollCallback, renderItemCallback } : ReactElement (ListView)`
| `previewFirstRow` [DEPRECATED] | Should the first SwipeRow do a slide out preview to show that the list is swipeable | `bool` || `false`
| `previewRowIndex` [DEPRECATED] | Should the specified rowId do a slide out preview to show that the list is swipeable. ***Note***: This ID will be passed to this function to get the correct row index. https://facebook.github.io/react-native/docs/listviewdatasource.html#getrowidforflatindex | `number`
| `shouldItemUpdate` | Callback to determine whether component should update | `func` | `{ currentItem: any, newItem: any }`
| `useNativeDriver` | useNativeDriver: `true` for all animations | `bool` | `true` |
