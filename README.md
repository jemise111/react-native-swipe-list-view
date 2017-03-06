[![npm](https://img.shields.io/npm/v/react-native-swipe-list-view.svg)](https://www.npmjs.com/package/react-native-swipe-list-view) [![npm](https://img.shields.io/npm/dm/react-native-swipe-list-view.svg)](https://www.npmjs.com/package/react-native-swipe-list-view)

# react-native-swipe-list-view

```<SwipeListView>``` is a ListView with rows that swipe open and closed. Handles default native behavior such as closing rows when ListView is scrolled or when other rows are opened.

Also includes ```<SwipeRow>``` if you want to use a swipeable row outside of the ```<SwipeListView>```

_**v0.1.0** introduced a breaking change if you had implemented the "Manually Closing Rows" functionality. See [Manually Closing Rows](https://github.com/jemise111/react-native-swipe-list-view#manually-closing-rows) or ```example.js``` for the new implementation._

# Example
![](http://i.imgur.com/6fTrdZa.gif) &nbsp;&nbsp;&nbsp;&nbsp; ![](http://i.imgur.com/3IdOA77.gif)

# Installation
```bash
npm install --save react-native-swipe-list-view
```

## Running the example

The application under ./SwipeListExample will produce the above example. To run execute the following:

* ```git clone https://github.com/jemise111/react-native-swipe-list-view.git```
* ```cd react-native-swipe-list-view```
* ```cd SwipeListExample```
* ```npm install```
* ```react-native run-ios | react-native run-android```

# Usage
```javascript
import { SwipeListView } from 'react-native-swipe-list-view';

render() {
	const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
	return (
		<SwipeListView
			dataSource={ds.cloneWithRows(dataSource)}
			renderRow={ data => (
				<View style={styles.rowFront}>
					<Text>I am {data} in a SwipeListView</Text>
				</View>
			)}
			renderHiddenRow={ data => (
				<View style={styles.rowBack}>
					<Text>Left</Text>
					<Text>Right</Text>
				</View>
			)}
			leftOpenValue={75}
			rightOpenValue={-75}
		/>
	)
}
```

*See ```example.js``` for full usage guide (including using ```<SwipeRow>``` by itself)*

#### Note:
If your row is touchable (TouchableOpacity, TouchableHighlight, etc.)  with an ```onPress``` function make sure ```renderRow``` returns the Touchable as the topmost element.

GOOD:
```javascript
renderRow={ data => (
	<TouchableHighlight onPress={this.doSomething.bind(this)}>
	    <View>
	        <Text>I am {data} in a SwipeListView</Text>
	    </View>
	</TouchableHighlight>
)}
```
BAD:
```javascript
renderRow={ data => (
	<View>
	    <TouchableHighlight onPress={this.doSomething.bind(this)}>
	        <Text>I am {data} in a SwipeListView</Text>
	    </TouchableHighlight>
	</View>
)}
```

#### Manually closing rows:

If your row or hidden row renders a touchable child and you'd like that touchable to close the row note that the ```renderRow``` and ```renderHiddenRow``` functions are passed ```rowData```, ```secId```, ```rowId```, ```rowMap```. The ```rowMap``` is an object that looks like:
```
{
    row_hash_1: ref_to_row_1,
    row_hash_2: ref_to_row_2
}
```

Where each ```row_hash``` is a string that looks like ```'<section_id><row_id>'```

Each row's ref has a public method called ```closeRow``` that will swipe the row closed. So you can do something like:
```
<SwipeList
    renderHiddenRow={ (data, secdId, rowId, rowMap) => {
        <TouchableOpacity onPress={ _ => rowMap[`${secId}${rowId}`].closeRow() }>
            <Text>I close the row</Text>
        </TouchableOpacity>
    }}
/>
```

If you are using the standalone ```<SwipeRow>``` you can just keep a ref to the component and call ```closeRow()``` on that ref.

#### Per row behavior:

If you need rows to behave independently you can return a ```<SwipeRow>``` in the ```renderRow``` function. Make sure you import the ```<SwipeRow>``` in addition to the ```<SwipeListView>```. See the example below and the docs under [API](https://github.com/jemise111/react-native-swipe-list-view#API) for how to implement a custom ```<SwipeRow>```. There is also a full example in ```example.js```.

The following values can be dynamic by passing them as props on the ```<SwipeRow>```:
 * ```leftOpenValue```
 * ```rightOpenValue```
 * ```stopLeftSwipe```
 * ```stopRightSwipe```
 * ```closeOnRowPress```
 * ```disableLeftSwipe```
 * ```disableRightSwipe```
 * ```recalculateHiddenLayout```

```javascript
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';

<SwipeListView
	dataSource={dataSource.cloneWithRows(data)}
	renderRow={ (data, secId, rowId) => (
		<SwipeRow
			disableRightSwipe={parseInt(rowId) % 2 !== 0}
			disableLeftSwipe={parseInt(rowId) % 2 === 0}
			leftOpenValue={20 + parseInt(rowId) * 5}
			rightOpenValue={-150}
		>
			<View style={styles.rowBack}>
				<Text>Left Hidden</Text>
				<Text>Right Hidden</Text>
			</View>
			<View style={styles.rowFront}>
				<Text>Row front | {data}</Text>
			</View>
		</SwipeRow>
	)}
/>
```

#### *Note on RN 0.28 and {flex: 1}*:

React Native 0.28 introduced new behavior when using flex: 1. The ```<SwipeRow>``` container ```<View>``` no longer has flex: 1 by default. If this is causing issues in your app you can maintain the old behavior by passing ```swipeRowStyle={{flex: 1}}``` to your ```<SwipeListView>``` or ```style={{flex: 1}}``` to your ```<SwipeRow>```.

## API

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


### `closeOnRowBeginSwipe`

Should open rows be closed when a row begins to swipe open

type: `bool`
defaultValue: `false`


### `leftOpenValue`

TranslateX value for opening the row to the left (positive number)

type: `number`
defaultValue: `0`


### `renderHiddenRow`

How to render a hidden row (renders behind the row). Should return a valid React Element.
This is required unless ```renderRow``` returns a ```<SwipeRow>``` (see [Per Row Behavior](https://github.com/jemise111/react-native-swipe-list-view#per-row-behavior)).

type: `func`


### `renderRow` (required)

How to render a row. Should return a valid React Element.

type: `func`


### `rightOpenValue`

TranslateX value for opening the row to the right (negative number)

type: `number`
defaultValue: `0`


### `swipeToOpenPercent`

What % of the left/right openValue does the user need to swipe
past to trigger the row opening.

type: `number`
defaultValue: `50`


### `disableLeftSwipe`

Disable ability to swipe the row left

type: `bool`
defaultValue: `false`


### `disableRightSwipe`

Disable ability to swipe the row right

type: `bool`
defaultValue: `false`


### `recalculateHiddenLayout`

Enable hidden row onLayout calculations to run always.

By default, hidden row size calculations are only done on the first onLayout event
for performance reasons.
Passing ```true``` here will cause calculations to run on every onLayout event.
You may want to do this if your rows' sizes can change.
One case is a SwipeListView with rows of different heights and an options to delete rows.

type: `bool`
defaultValue: `false`

### `onRowClose`

Called when a swipe row is animating closed

type: `func`


### `onRowDidClose`

Called when a swipe row has animated closed

type: `func`


### `onRowOpen`

Called when a swipe row is animating open.

This has a param of `toValue` which is the new X value the row (after it has opened). This can be used to calculate which direction the row has been swiped open.

type: `func`


### `onRowDidOpen`

Called when a swipe row has animated open

type: `func`


### `swipeRowStyle`

Styles for the parent wrapper View of the SwipeRow

type: `object`


### `listViewRef`

Called when the ListView ref is set and passes a ref to the ListView
e.g. ```listViewRef={ ref => this._swipeListViewRef = ref }```

type: `func`


### `previewFirstRow`

Should the first SwipeRow do a slide out preview to show that the list is swipeable

type: `bool`
defaultValue: `false`

### `previewRowIndex`

Should the specified rowId do a slide out preview to show that the list is swipeable
 * ***Note***: This ID will be passed to this function to get the correct row index
 * https://facebook.github.io/react-native/docs/listviewdatasource.html#getrowidforflatindex

type: `number`


### `previewDuration`

Duration of the slide out preview animation

type: `number`


### `previewOpenValue`

TranslateX value for the slide out preview animation
Default: 0.5 * props.rightOpenValue

type: `number`


### `friction`

Friction for the open / close animation

type: `number`


### `tension`

Tension for the open / close animation

type: `number`


`SwipeRow` (component)
======================

Row that is generally used in a SwipeListView.
If you are rendering a SwipeRow explicitly you must pass the SwipeRow exactly two children.
The first will be rendered behind the second.
e.g.
```javascript
  <SwipeRow>
      <View style={hiddenRowStyle} />
      <View style={visibleRowStyle} />
  </SwipeRow>
```
Props
-----

### `closeOnRowPress`

Should the row be closed when it is tapped

type: `bool`
defaultValue: `true`


### `friction`

Friction for the open / close animation

type: `number`


### `leftOpenValue`

TranslateX value for opening the row to the left (positive number)

type: `number`
defaultValue: `0`

### `stopLeftSwipe`

TranslateX value for stop the row to the left (positive number)

type: `number`

### `stopRightSwipe`

TranslateX value for stop the row to the right (negative number)

type: `number`


### `onRowPress`

Called when a swipe row is pressed.

type: `func`

### `onRowOpen`

Called when a swipe row is animating open. Used by the SwipeListView
to keep references to open rows.

type: `func`


### `onRowClose`

Called when a swipe row is animating closed

type: `func`


### `rightOpenValue`

TranslateX value for opening the row to the right (negative number)

type: `number`
defaultValue: `0`


### `swipeToOpenPercent`

What % of the left/right openValue does the user need to swipe
past to trigger the row opening.

type: `number`
defaultValue: `50`


### `setScrollEnabled`

Used by the SwipeListView to close rows on scroll events.
You shouldn't need to use this prop explicitly.

type: `func`


### `tension`

Tension for the open / close animation

type: `number`


### `disableLeftSwipe`

Disable ability to swipe the row left

type: `bool`
defaultValue: `false`


### `disableRightSwipe`

Disable ability to swipe the row right

type: `bool`
defaultValue: `false`


### `recalculateHiddenLayout`

Enable hidden row onLayout calculations to run always

type: `bool`
defaultValue: `false`


### `style`

Styles for the parent wrapper View of the SwipeRow

type: `object`


### `preview`

Should the row do a slide out preview to show that it is swipeable

type: `bool`
defaultValue: `false`


### `previewDuration`

Duration of the slide out preview animation

type: `number`
defaultValue: `300`


### `previewOpenValue`

TranslateX value for the slide out preview animation
Default: 0.5 * props.rightOpenValue

type: `number`


### *Note: Core Support*
RN Core added a SwipeList component as of [v0.27.0](https://github.com/facebook/react-native/releases/tag/v0.27.0)

It is actively being worked on and has no documentation yet. So I will continue to maintain this component until a future date.

# License

MIT
