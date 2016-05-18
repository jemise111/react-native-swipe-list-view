`SwipeRow` (component)
======================

Row that is generally used in a SwipeListView.
If you are rendering a SwipeRow explicitly you must pass the SwipeRow exactly two children.
The first will be rendered behind the second.
e.g.
  <SwipeRow>
      <View style={hiddenRowStyle} />
      <View style={visibleRowStyle} />
  </SwipeRow>

Props
-----

### `closeOnRowPress`

Should the row be closed when it is tapped

type: `bool`
defaultValue: `true`


### `disableLeftSwipe`

Disable ability to swipe the row left

type: `bool`
defaultValue: `false`


### `disableRightSwipe`

Disable ability to swipe the row right

type: `bool`
defaultValue: `false`


### `friction`

Friction for the open / close animation

type: `number`


### `leftOpenValue`

TranslateX value for opening the row to the left (positive number)

type: `number`
defaultValue: `0`


### `onRowClose`

Called when a swipe row is animating closed

type: `func`


### `onRowOpen`

Called when a swipe row is animating open. Used by the SwipeListView
to keep references to open rows.

type: `func`


### `recalculateHiddenLayout`

Enable hidden row onLayout calculations to run always

type: `bool`
defaultValue: `false`


### `rightOpenValue`

TranslateX value for opening the row to the right (negative number)

type: `number`
defaultValue: `0`


### `setScrollEnabled`

Used by the SwipeListView to close rows on scroll events.
You shouldn't need to use this prop explicitly.

type: `func`


### `tension`

Tension for the open / close animation

type: `number`

