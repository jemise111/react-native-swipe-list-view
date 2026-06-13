
# `<SwipeListView />` API

A List that renders `<SwipeRow />`s

### Props

| Prop | Notes | Type | Signature (func) | Default |
| --- | --- | --- | --- | --- |
| `data` | List of objects to be passed into the `renderItem` and `renderHiddenItem` functions. Each item must include a unique `key` property or `keyExtractor` must be implemented to ensure full functionality. | `array` ||
| `useSectionList` | Render list using React Native's `SectionList` | `bool` | | `false` |
| `renderItem` | How to render a row in a FlatList. Should return a valid React Element. | `func` | `{ rowData: any, rowMap: { string: SwipeRowRef } } : ReactElement` |
| `renderHiddenItem` | How to render a hidden row in a FlatList (renders behind the row). Should return a valid React Element. This is required unless `renderItem` returns a `<SwipeRow>` (see [Per Row Behavior](https://github.com/jemise111/react-native-swipe-list-view/blob/master/docs/per-row-behavior.md)). | `func` | `{ rowData: any, rowMap: { string: SwipeRowRef } } : ReactElement` |
| `leftOpenValue` | TranslateX value for opening the row to the left (positive number) | `number` | | `0` |
| `rightOpenValue` | TranslateX value for opening the row to the right (negative number) | `number` | | `0` |
| `leftActivationValue` | TranslateX value for firing onLeftActionStatusChange (positive number) | `number` | | |
| `rightActivationValue` | TranslateX value for firing onRightActionStatusChange (negative number) | `number` | | |
| `leftActionValue` | TranslateX value for left action to which the row will be shifted after gesture release | `number` | | |
| `rightActionValue` | TranslateX value for right action to which the row will be shifted after gesture release | `number` | | |
| `initialLeftActionState` | Initial value for left action state (default is false) | `bool` | | |
| `initialRightActionState` | Initial value for right action state (default is false) | `bool` | | |
| `closeOnRowPress` | Should open rows be closed when a row is pressed | `bool` | | `true` |
| `closeOnRowOpen` | Should open rows be closed when another row is opened | `bool` | | `true` |
| `closeOnRowBeginSwipe` | Should open rows be closed when a row begins to swipe open | `bool` | | `false` |
| `closeOnScroll` | Should open rows be closed when the listView begins scrolling | `bool` | | `true` |
| `disableLeftSwipe` | Disable ability to swipe the row left | `bool` | | `false` |
| `disableRightSwipe` | Disable ability to swipe the row right | `bool` | | `false` |
| `stopLeftSwipe` | TranslateX value for stop the row to the left (positive number). This number is the stop value corresponding to the `leftOpenValue` (while the row is swiping in the right direction) | `number` |
| `stopRightSwipe` | TranslateX value for stop the row to the right (negative number). This number is the stop value corresponding to the `rightOpenValue` (while the row is swiping in the left direction) | `number` |
| `directionalDistanceChangeThreshold` | Change the sensitivity of the row | `number` | | `2` |
| `swipeToOpenPercent` | What % of the left/right openValue does the user need to swipe past to trigger the row opening. | `number` | | `50` |
| `swipeToClosePercent` | What % of the left/right openValue does the user need to swipe past to trigger the row closing. | `number` | | `50` |
| `swipeToOpenVelocityContribution` | Describes how much the ending velocity of the gesture affects whether the swipe will result in the item being closed or open. A velocity factor of 0 (the default) means that the velocity will have no bearing on whether the swipe settles on a closed or open position and it'll just take into consideration the swipeToOpenPercent. Ideal values for this prop tend to be between 5 and 15. | `number` | | `0` |
| `recalculateHiddenLayout` | Enable hidden row onLayout calculations to run always. By default, hidden row size calculations are only done on the first onLayout event for performance reasons. Passing ```true``` here will cause calculations to run on every onLayout event. You may want to do this if your rows' sizes can change. One case is a SwipeListView with rows of different heights and an options to delete rows. | `bool` | | `false` |
| `swipeGestureBegan` | Called when a swipe row is animating swipe | `func` | `{ rowKey: string } : void` |
| `swipeGestureEnded` | Called when user has ended their swipe gesture. **v4:** `event` is now an RNGH `GestureStateChangeEvent<PanGestureHandlerEventPayload>`; the v3 `gestureState` field is removed (velocity/translation live on `event`, with `velocityX` in px/s). | `func` | <code>{ rowKey: string; data: { translateX: number; direction: 'left' &#124; 'right'; event: GestureStateChangeEvent } } : void</code> |
| `onRowOpen` | Called when a swipe row is animating open. This has a param of `toValue` which is the new X value the row (after it has opened). This can be used to calculate which direction the row has been swiped open. | `func` | `{ rowKey: string, rowMap: { string: SwipeRowRef }, toValue: number } : void` |
| `onRowDidOpen` | Called when a swipe row has animated open | `func` | `{ rowKey: string, rowMap: { string: SwipeRowRef }, toValue: number } : void` |
| `onRowClose` | Called when a swipe row is animating closed | `func` | `{ rowKey: string, rowMap: { string: SwipeRowRef } } : void` |
| `onRowDidClose` | Called when a swipe row has animated closed | `func` | `{ rowKey: string, rowMap: { string: SwipeRowRef } } : void` |
| `onLeftActionStatusChange` | Called once when swipe value crosses the leftActivationValue | `func` | <code>{ data: { isActivated: boolean, value: number, key: string } } : void</code> |
| `onRightActionStatusChange` | Called once when swipe value crosses the rightActivationValue | `func` | <code>{ data: { isActivated: boolean, value: number, key: string } } : void</code> |
| `onLeftAction` | Called when row shifted to leftActivationValue | `func` | `{ } : void` |
| `onRightAction` | Called when row shifted to rightActivationValue | `func` | `{ } : void` |
| `onScrollEnabled` | Called when scrolling has been enabled/disabled | `func` | `{ isEnabled: bool } : void` |
| `swipeRowStyle` | Styles for the parent wrapper View of the SwipeRow | `object` |
| `listViewRef` | Called when the underlying list ref is set and passes a ref to the `FlatList`/`SectionList`. e.g. `listViewRef={ ref => (this.listRef = ref) }` | `func` | <code>{ ref: FlatList &#124; SectionList } : void</code> |
| `previewRowKey` | Should the row with this key do a slide out preview to show that the list is swipeable | `string` |
| `previewDuration` | Duration of the slide out preview animation | `number` |
| `previewRepeat` | Should the animation repeat | `bool` | | `false` |
| `previewRepeatDelay` | Delay between each preview repeat in milliseconds | `number` | | `1000` |
| `previewOpenValue` | TranslateX value for the slide out preview animation. | `number` | | `0.5 * props.rightOpenValue` |
| `previewOpenDelay` | Add some delay before opening the preview row. Can be useful when you have enter animation. | `number` |
| `friction` | Friction for the open / close animation. Controls "bounciness"/overshoot. Same scale as v3 — mapped to the Reanimated spring through React Native's Origami conversion, so the feel is unchanged. | `number` | | `7` |
| `tension` | Tension for the open / close animation. Controls speed. Same scale as v3 (see `friction`). | `number` | | `40` |
| `restSpeedThreshold` | Rest speed threshold for the open / close spring. | `number` | | `0.001` |
| `restDisplacementThreshold` | Rest displacement threshold for the open / close spring. | `number` | | `0.001` |
| `onSwipeValueChange` | Callback invoked any time the translateX value of a row changes. Crosses to the JS thread every frame — prefer each row's `swipeAnimatedValue` (see [`<SwipeRow />`](./SwipeRow.md#swipeanimatedvalue-v4)). | `func` | <code>{ swipeData: { key: string, value: number, direction: 'left' &#124; 'right', isOpen: bool } } : void</code> |
| `shouldItemUpdate` | Callback to determine whether component should update | `func` | `{ currentItem: any, newItem: any }` |
| `onPreviewEnd` | Callback that runs after row swipe preview is finished | `func` | `{ } : void` |

See [FlatList](https://reactnative.dev/docs/flatlist) for all other inherited props.

### Imperative API

A ref to `SwipeListView` exposes:

| Method | Notes |
| --- | --- |
| `closeAllOpenRows()` | Animate every open row closed. |
| `manuallyOpenAllRows(toValue)` | Animate every row to the given translateX value. |

### Removed props

These were ListView-era or no-ops under Reanimated and are removed in v4. Passing
them logs a one-time dev warning. See the
[migration guide](./MIGRATION.md#3-listview-era-api-removed).

| Removed prop | Replacement |
| --- | --- |
| `dataSource` | `data` (FlatList) / `sections` (SectionList) |
| `renderRow` | `renderItem` |
| `renderHiddenRow` | `renderHiddenItem` |
| `renderListView` | none |
| `previewFirstRow` | `previewRowKey` |
| `previewRowIndex` | `previewRowKey` |
| `useFlatList` | none — FlatList is the default |
| `useAnimatedList` | none — the list is always animated |
| `useNativeDriver` | none — everything runs on the UI thread |
