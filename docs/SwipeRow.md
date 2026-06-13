# `<SwipeRow />` API

Row that is generally used in a `<SwipeListView/>`.
If you are rendering a `<SwipeRow/>` explicitly you must pass the `<SwipeRow/>` exactly two children.
The first will be rendered behind the second.
e.g.
```javascript
<SwipeRow>
    <View style={hiddenRowStyle} />
    <View style={visibleRowStyle} />
</SwipeRow>
```

### Props

| Prop | Notes | Type | (func) Signature | Default |
| --- | --- | --- | --- | --- |
| `closeOnRowPress` | Should the row be closed when it is tapped | `bool` | | `true` |
| `directionalDistanceChangeThreshold` | Change the sensitivity of the row | `number` | | `2` |
| `friction` | Friction for the open / close animation. Controls "bounciness"/overshoot. Same scale as v3 — mapped to the Reanimated spring through React Native's Origami conversion, so the feel is unchanged. | `number` | | `7` |
| `tension` | Tension for the open / close animation. Controls speed. Same scale as v3 (see `friction`). | `number` | | `40` |
| `restSpeedThreshold` | Rest speed threshold for the open / close spring. | `number` | | `0.001` |
| `restDisplacementThreshold` | Rest displacement threshold for the open / close spring. | `number` | | `0.001` |
| `leftOpenValue` | TranslateX value for opening the row to the left (positive number) | `number` | | `0` |
| `rightOpenValue` | TranslateX value for opening the row to the right (negative number) | `number` | | `0` |
| `leftActivationValue` | TranslateX value for firing onLeftActionStatusChange (positive number) | `number` | | |
| `rightActivationValue` | TranslateX value for firing onRightActionStatusChange (negative number) | `number` | | |
| `initialLeftActionState` | Initial value for left action state (default is false) | `bool` | | |
| `initialRightActionState` | Initial value for right action state (default is false) | `bool` | | |
| `leftActionValue` | TranslateX value for left action to which the row will be shifted after gesture release | `number` | | |
| `rightActionValue` | TranslateX value for right action to which the row will be shifted after gesture release | `number` | | |
| `stopLeftSwipe` | TranslateX value for stop the row to the left (positive number). This number is the stop value corresponding to the `leftOpenValue` (while the row is swiping in the right direction) | `number` |
| `stopRightSwipe` | TranslateX value for stop the row to the right (negative number). This number is the stop value corresponding to the `rightOpenValue` (while the row is swiping in the left direction) | `number` |
| `onRowPress` | Called when row is pressed. | `func` | `{ } : void` |
| `onRowOpen` | Called when row is animating open. Used by the SwipeListView to keep references to open rows. | `func` | `{ toValue: number } : void` |
| `onRowDidOpen` | Called when row has animated open | `func` | `{ toValue: number } : void` |
| `onRowClose` | Called when row is animating closed | `func` | `{ } : void` |
| `onRowDidClose` | Called when a swipe row has animated closed | `func` | `{ } : void` |
| `onLeftActionStatusChange` | Called once when swipe value crosses the leftActivationValue | `func` | <code>{ data: { isActivated: boolean, value: number, key: string } } : void</code> |
| `onRightActionStatusChange` | Called once when swipe value crosses the rightActivationValue | `func` | <code>{ data: { isActivated: boolean, value: number, key: string } } : void</code> |
| `onLeftAction` | Called when row shifted to leftActivationValue | `func` | `{ } : void` |
| `onRightAction` | Called when row shifted to rightActivationValue | `func` | `{ } : void` |
| `swipeToOpenPercent` | What % of the left/right openValue does the user need to swipe past to trigger the row opening. | `number` | | `50` |
| `swipeToClosePercent` | What % of the left/right openValue does the user need to swipe past to trigger the row closing. | `number` | | `50` |
| `setScrollEnabled` | Used by the SwipeListView to close rows on scroll events. You shouldn't need to use this prop explicitly. | `func` |
| `disableLeftSwipe` | Disable ability to swipe the row left | `bool` | | `false` |
| `disableRightSwipe` | Disable ability to swipe the row right | `bool` | | `false` |
| `recalculateHiddenLayout` | Enable hidden row onLayout calculations to run always | `bool` | | `false` |
| `style` | Styles for the parent wrapper View of the SwipeRow | `object` |
| `preview` | Should the row do a slide out preview to show that it is swipeable | `bool` | | `false` |
| `previewDuration` | Duration of the slide out preview animation | `number` | | `300` |
| `previewRepeat` | Should the animation repeat | `bool` | | `false` |
| `previewRepeatDelay` | Delay between each preview repeat in milliseconds | `number` | | `1000` |
| `previewOpenValue` | TranslateX value for the slide out preview animation | `number` | | 0.5 * props.rightOpenValue |
| `onSwipeValueChange` | Callback invoked any time the translateX value of the row changes. Crosses to the JS thread every frame — prefer `swipeAnimatedValue` (see below). | `func` | <code>{ swipeData: { key: string, value: number, direction: 'left' &#124; 'right', isOpen: bool } } : void</code> |
| `swipeGestureBegan` | Called when the row is animating swipe | `func` | `{ } : void` |
| `swipeGestureEnded` | Called when user has ended their swipe gesture. **v4:** `event` is now an RNGH `GestureStateChangeEvent<PanGestureHandlerEventPayload>`; the v3 `gestureState` field is removed (velocity/translation live on `event`, with `velocityX` in px/s). | `func` | <code>{ rowKey: string; data: { translateX: number; direction: 'left' &#124; 'right'; event: GestureStateChangeEvent } } : void</code> |
| `swipeToOpenVelocityContribution` | Describes how much the ending velocity of the gesture affects whether the swipe will result in the item being closed or open. A velocity factor of 0 (the default) means that the velocity will have no bearing on whether the swipe settles on a closed or open position and it'll just take into consideration the swipeToOpenPercent. Ideal values for this prop tend to be between 5 and 15. | `number` | | `0` |
| `shouldItemUpdate` | Callback to determine whether component should update | `func` | `{ currentItem: any, newItem: any }` |
| `forceCloseToLeftThreshold` | TranslateX amount(not value!) threshold that triggers force-closing the row to the Left End (positive number) | `number` |
| `forceCloseToRightThreshold` | TranslateX amount(not value!) threshold that triggers force-closing the row to the Right End (positive number) | `number` |
| `onForceCloseToLeft` | Callback invoked when row is force closing to the Left End | `func` |
| `onForceCloseToRight` | Callback invoked when row is force closing to the Right End | `func` |
| `onForceCloseToLeftEnd` | Callback invoked when row has finished force closing to the Left End | `func` |
| `onForceCloseToRightEnd` | Callback invoked when row has finished force closing to the Right End | `func` |
| `swipeKey` | Optional key to identify a standalone row, used in the `onSwipeValueChange` callback | `string` |
| `onPreviewEnd` | Callback that runs after row swipe preview is finished | `func` | `{ } : void` |
| `accessible` | Whether the row is an accessibility element exposing swipe actions to screen readers. Set `false` to opt out of the built-in accessibility actions. | `bool` | | `true` |
| `accessibilityActions` | Override the default accessibility actions (`swipeleft` when `rightOpenValue` is set, `swiperight` when `leftOpenValue` is set). | `array` |
| `onAccessibilityAction` | Override the default handler that opens/closes the row in response to an accessibility action. | `func` |

### `swipeAnimatedValue` (v4)

Each row exposes its translateX as a Reanimated `SharedValue<number>`. It is the
recommended replacement for `onSwipeValueChange` — read it inside
`useAnimatedStyle` and your UI updates on the UI thread with no per-frame JS call.

It is available two ways:

- **Injected into both children.** Type your child props with
  `SwipeRowChildInjectedProps` and read `props.swipeAnimatedValue?.value` inside a
  worklet.
- **On the row ref / `rowMap` entry** as `swipeAnimatedValue`.

See the [migration guide](./MIGRATION.md#5-onswipevaluechange--swipeanimatedvalue-recommended)
for a before/after example.

### Removed props

| Removed prop | Notes |
| --- | --- |
| `useNativeDriver` | Everything runs on the UI thread under Reanimated. Tolerated with a one-time dev warning, then ignored. |

### Imperative handle

A ref to a `SwipeRow` (and each `rowMap` entry in `SwipeListView`) is a typed
handle, not a class instance:

| Member | Notes |
| --- | --- |
| `closeRow()` | Animate the row closed. |
| `closeRowWithoutAnimation()` | Snap the row closed with no animation. |
| `manuallySwipeRow(toValue, onAnimationEnd?)` | Animate the row to a translateX value. |
| `isOpen` | Whether the row is currently open. |
| `swipeAnimatedValue` | The row's translateX `SharedValue` (see above). |
