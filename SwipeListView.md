`SwipeListView` (component)
===========================

ListView that renders SwipeRows.

Props
-----

### `closeOnRowPress`

Should open rows be closed when a row is pressed

type: `bool`
defaultValue: `true`


### `closeOnScroll`

Should open rows be closed when the listView begins scrolling

type: `bool`
defaultValue: `true`


### `disableLeftSwipe`

Disable ability to swipe rows left

type: `bool`
defaultValue: `false`


### `disableRightSwipe`

Disable ability to swipe rows right

type: `bool`
defaultValue: `false`


### `leftOpenValue`

TranslateX value for opening the row to the left (positive number)

type: `number`
defaultValue: `0`


### `onRowClose`

Called when a swipe row is animating closed

type: `func`


### `onRowOpen`

Called when a swipe row is animating open

type: `func`


### `recalculateHiddenLayout`

Enable hidden row onLayout calculations to run always.

By default, hidden row size calculations are only done on the first onLayout event
for performance reasons.
Passing ```true``` here will cause calculations to run on every onLayout event.
You may want to do this if your rows' sizes can change.
One case is a SwipeListView with rows of different heights and an options to delete rows.

type: `bool`
defaultValue: `false`


### `renderHiddenRow` (required)

How to render a hidden row (renders behind the row). Should return a valid React Element.

type: `func`


### `renderRow` (required)

How to render a row. Should return a valid React Element.

type: `func`


### `rightOpenValue`

TranslateX value for opening the row to the right (negative number)

type: `number`
defaultValue: `0`

