# Actions

Actions allows you to make it easier to work with features such as "swipe to delete" or "swipe to cart". Also it makes easier to change the UI based on swipe state.
No need to manage a list of animated values for all rows. 
Behavior can be controlled more granular.  

With actions both visible and hidden component can react when you swipe a row for some value and show that some action is activated (i.e. expand delete button to full width or highlight button).

To configure actions you can use props below:
- `leftActivationValue` - TranslateX value for firing `onLeftActionStatusChange` (positive number)
- `rightActivationValue` - TranslateX value for firing - `onRightActionStatusChange` (negative number)
- `leftActionValue` - TranslateX value for left action to which the row will be shifted after gesture release
`rightActionValue` - TranslateX value for right action to which the row will be shifted after gesture release
- `initialLeftActionState` - initial value for left action state (default is false)
- `initialRightActionState` - initial value for right action state (default is false)

To react for actions use handlers:
- `onLeftAction` - fired when row shifted to - `leftActivationValue`
- `onRightAction` - fired when row shifted to - `rightActivationValue`
- `onLeftActionStatusChange` - fired once when swipe value reached the `leftActivationValue`
- `onRightActionStatusChange` - fired once when swipe value reached the `rightActivationValue`

Also there is an additional props will be passed to Visible and Hidden row components:
- `swipeAnimatedValue` - swipeRow `_translateX` animated value
- `leftActionActivated` - boolean value indicated that left action is currently activated/deactevated
- `rightActionActivated` - boolean value indicated that right action is currently activated/deactevated
- `leftActionState` - boolean value of left action state
- `rightActionState` - boolean value of right action state

See the [actions example](https://github.com/jemise111/react-native-swipe-list-view/blob/master/docs/actions.md) for reference.