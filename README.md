[![npm](https://img.shields.io/npm/v/react-native-swipe-list-view.svg)](https://www.npmjs.com/package/react-native-swipe-list-view) [![npm](https://img.shields.io/npm/dm/react-native-swipe-list-view.svg)](https://www.npmjs.com/package/react-native-swipe-list-view)

# react-native-swipe-list-view

**💥🔥Breaking Changes in v1.0.0:🔥💥**

`SwipeListView` now supports `FlatList`!

Please see the section [Migrating To FlatList](https://github.com/jemise111/react-native-swipe-list-view#migrating-to-flatlist) for all details.

You can continue to use the (deprecated) `ListView` component, however there are some BREAKING CHANGES that are explained in that section as well

--------

```<SwipeListView>``` is a ListView with rows that swipe open and closed. Handles default native behavior such as closing rows when ListView is scrolled or when other rows are opened.

Also includes ```<SwipeRow>``` if you want to use a swipeable row outside of the ```<SwipeListView>```

# Example
![](http://i.imgur.com/6fTrdZa.gif) &nbsp;&nbsp;&nbsp;&nbsp; ![](http://i.imgur.com/3IdOA77.gif)

Try it out! https://snack.expo.io/@jemise111/react-native-swipe-list-view

([What's a Snack?](https://blog.expo.io/sketch-a-playground-for-react-native-16b2401f44a2))

# Installation
```bash
npm install --save react-native-swipe-list-view
```

## Running the example

The application under ./SwipeListExample will produce the above example. To run execute the following:

* ```git clone https://github.com/jemise111/react-native-swipe-list-view.git```
* ```cd react-native-swipe-list-view```
* ```cd SwipeListExample```
* ```yarn```
* ```react-native run-ios | react-native run-android```

# Usage
```javascript
import { SwipeListView } from 'react-native-swipe-list-view';

render() {
    return (
        <SwipeListView
            useFlatList
            data={this.state.listViewData}
            renderItem={ (data, rowMap) => (
                <View style={styles.rowFront}>
                    <Text>I am {data.item} in a SwipeListView</Text>
                </View>
            )}
            renderHiddenItem={ (data, rowMap) => (
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
If your row is touchable (TouchableOpacity, TouchableHighlight, etc.)  with an ```onPress``` function make sure ```renderItem``` returns the Touchable as the topmost element.

GOOD:
```javascript
renderItem={ data => (
    <TouchableHighlight onPress={this.doSomething.bind(this)}>
        <View>
            <Text>I am {data.item} in a SwipeListView</Text>
        </View>
    </TouchableHighlight>
)}
```
BAD:
```javascript
renderItem={ data => (
    <View>
        <TouchableHighlight onPress={this.doSomething.bind(this)}>
            <Text>I am {data.item} in a SwipeListView</Text>
        </TouchableHighlight>
    </View>
)}
```

#### Manually closing rows:

If your row or hidden row renders a touchable child and you'd like that touchable to close the row note that the ```renderItem``` and ```renderHiddenItem``` functions are passed ```rowData```, ```rowMap```. The ```rowMap``` is an object that looks like:
```javascript
{
    row_key_1: ref_to_row_1,
    row_key_2: ref_to_row_2
}
```

Where each ```row_key``` is the same key used by the `FlatList` taken either from the `key` property on your data objects or using the `keyExtractor` prop.

Each row's ref has a public method called ```closeRow``` that will swipe the row closed. So you can do something like:
```javascript
<SwipeListView
    renderHiddenItem={ (rowData, rowMap) => {
        <TouchableOpacity onPress={ _ => rowMap[rowData.item.key].closeRow() }>
            <Text>I close the row</Text>
        </TouchableOpacity>
    }}
/>
```

If you are using the standalone ```<SwipeRow>``` you can just keep a ref to the component and call ```closeRow()``` on that ref.

#### Per row behavior:

If you need rows to behave independently you can return a ```<SwipeRow>``` in the ```renderItem``` function. Make sure you import the ```<SwipeRow>``` in addition to the ```<SwipeListView>```. See the example below and the docs under [API](https://github.com/jemise111/react-native-swipe-list-view#API) for how to implement a custom ```<SwipeRow>```. There is also a full example in ```example.js```.

The following values can be dynamic by passing them as props on the ```<SwipeRow>```:
 * ```leftOpenValue```
 * ```rightOpenValue```
 * ```stopLeftSwipe```
 * ```stopRightSwipe```
 * ```closeOnRowPress```
 * ```disableLeftSwipe```
 * ```disableRightSwipe```
 * ```recalculateHiddenLayout```
 * ```directionalDistanceChangeThreshold```

```javascript
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';

<SwipeListView
    dataSource={dataSource.cloneWithRows(data)}
    renderItem={ (rowData, rowMap) => (
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
                <Text>Row front | {data.item.key}</Text>
            </View>
        </SwipeRow>
    )}
/>
```

### Setting per row behavior using data

You can also customize your individual rows by passing in your row's `data` next props:
 * ```leftOpenValue```
 * ```rightOpenValue```
 * ```closeOnRowPress```
 * ```disableLeftSwipe```
 * ```disableRightSwipe```
 * ```stopLeftSwipe```
 * ```stopRightSwipe```

Example:
```javascript
const dataSource = [
    {
        name: 'Andy',
        age: 12,
        disableRightSwipe: true,
    },
    {
        name: 'Betty',
        age: 11,
        leftOpenValue: 150,
    },
    {
        name: 'Carl',
        age: 11,
    },
];
```

# Migrating To FlatList

In most ways migrating your `SwipeListView` is no different than migrating your typical RN `ListView` (`renderRow` -> `renderItem`, `renderHiddenRow` -> `renderHiddenItem`). The biggest difference is the identifier used to keep track of row ref's. Previously this was done using a unique hash for each row that looked like ``${secId}${rowId}``. Now, since FlatList requires the use of a unique `key` for each piece of data, the `SwipeListView` uses this unique key to keep track of row refs in place of the unique hash.

The biggest breaking change you will find is the signature of certain callback functions used to pass the `secId` and `rowId` as two separate arguments, whereas now they will pass one argument, the row's unique key.

e.g.

```javascript
onRowOpen(secId, rowId, rowMap) {
    // Grab reference to this row
    const rowRef = rowMap[`${secId}${rowId}`];

    // Do something with the row
    rowRef.closeRow();
}
```

would now look like:

```javascript
onRowOpen(rowKey, rowMap) {
    // Grab reference to this row
    const rowRef = rowMap[rowKey];

    // Do something with the row
    rowRef.closeRow();
}
```

The other breaking change introduced is how to do a slideout preview. If you'd like to do a slide out preview for one of the rows simply use the new prop `previewRowKey` and pass the key corrseponding with that row.


Here is a typical migration example:

BEFORE:

```javascript
<SwipeListView
    dataSource={this.ds.cloneWithRows(this.state.listViewData)}
    renderRow={ (data, secId, rowId, rowMap) => (
        <View>
            <Text>I am {data} in a SwipeListView</Text>
        </View>
    )}
    renderHiddenRow={ (data, secId, rowId, rowMap) => (
        <View style={styles.rowBack}>
            <TouchableOpacity onPress={ _ => rowMap[`${secId}${rowId}`].closeRow() }>
                <Text>Close</Text>
            </TouchableOpacity>
        </View>
    )}
    leftOpenValue={75}
    rightOpenValue={-150}
    onRowOpen={(secId, rowId, rowMap) => {
        setTimeout(() => {
            rowMap[`${secId}${rowId}`].closeRow()
        }, 2000)
    }}
    previewFirstRow={true}
/>
```

AFTER (Using FlatList):

```javascript
<SwipeListView
    useFlatList={true}
    data={this.state.flatListData}
    renderItem={ (rowData, rowMap) => (
        <View>
            <Text>I am {data.item.text} in a SwipeListView</Text>
        </View>
    )}
    renderHiddenItem={ (rowData, rowMap) => (
        <View style={styles.rowBack}>
            <TouchableOpacity onPress={ _ => rowMap[rowData.item.key].closeRow() }>
                <Text>Close</Text>
            </TouchableOpacity>
        </View>
    )}
    leftOpenValue={75}
    rightOpenValue={-150}
    onRowOpen={(rowKey, rowMap) => {
        setTimeout(() => {
            rowMap[rowKey].closeRow()
        }, 2000)
    }}
    previewRowKey={this.state.flatListData[0].key} 
/>
```


## API

`SwipeListView` (component)
===========================

ListView that renders SwipeRows.

Props
-----

### `useFlatList`

Render list using React Native's `FlatList`

type: `bool`

defaultValue: `false`

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

### `directionalDistanceChangeThreshold`

Change the sensitivity of the row

type: `number`

defaultValue: `2`


### `leftOpenValue`

TranslateX value for opening the row to the left (positive number)

type: `number`

defaultValue: `0`

### `renderHiddenItem`

How to render a hidden row in a FlatList (renders behind the row). Should return a valid React Element.
This is required unless ```renderItem``` returns a ```<SwipeRow>``` (see [Per Row Behavior](https://github.com/jemise111/react-native-swipe-list-view#per-row-behavior)).

type: `func`

params: (rowData, rowMap)


### `renderItem`

How to render a row in a FlatList. Should return a valid React Element.

type: `func`

params: (rowData, rowMap)


### `renderHiddenRow` [DEPRECATED]

How to render a hidden row (renders behind the row). Should return a valid React Element.
This is required unless ```renderRow``` returns a ```<SwipeRow>``` (see [Per Row Behavior](https://github.com/jemise111/react-native-swipe-list-view#per-row-behavior)).

type: `func`

params: (rowData, secId, rowId, rowMap)


### `renderRow` [DEPRECATED]

How to render a row. Should return a valid React Element.

type: `func`

params: (rowData, secId, rowId, rowMap)


### `rightOpenValue`

TranslateX value for opening the row to the right (negative number)

type: `number`

defaultValue: `0`


### `swipeToOpenPercent`

What % of the left/right openValue does the user need to swipe
past to trigger the row opening.

type: `number`

defaultValue: `50`


### `swipeToOpenVelocityContribution`

Describes how much the ending velocity of the gesture affects whether the swipe will result in the item being closed or open. A velocity factor of 0 (the default) means that the velocity will have no bearing on whether the swipe settles on a closed or open position and it'll just take into consideration the swipeToOpenPercent. Ideal values for this prop tend to be between 5 and 15.

type: `number`

defaultValue: `0`


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


### `swipeGestureBegan`

Called when a swipe row is animating swipe

type: `func`

params: (rowKey)

### `onRowClose`

Called when a swipe row is animating closed

type: `func`

params: (rowKey, rowMap)


### `onRowDidClose`

Called when a swipe row has animated closed

type: `func`

params: (rowKey, rowMap)


### `onRowOpen`

Called when a swipe row is animating open.

This has a param of `toValue` which is the new X value the row (after it has opened). This can be used to calculate which direction the row has been swiped open.

type: `func`

params: (rowKey, rowMap)


### `onRowDidOpen`

Called when a swipe row has animated open

type: `func`

params: (rowKey, rowMap)


### `swipeRowStyle`

Styles for the parent wrapper View of the SwipeRow

type: `object`


### `listViewRef`

Called when the ListView ref is set and passes a ref to the ListView
e.g. ```listViewRef={ ref => this._swipeListViewRef = ref }```

type: `func`

params: (ref)


### `previewRowKey`

Should the row with this key do a slide out preview to show that the list is swipeable

type: `string`


### `previewFirstRow` [DEPRECATED]

Should the first SwipeRow do a slide out preview to show that the list is swipeable

type: `bool`

defaultValue: `false`


### `previewRowIndex` [DEPRECATED]

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

### `directionalDistanceChangeThreshold`

Change the sensitivity of the row

type: `number`

defaultValue: `2`

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

params: ()


### `onRowOpen`

Called when a swipe row is animating open. Used by the SwipeListView
to keep references to open rows.

type: `func`

params: (toValue)


### `onRowClose`

Called when a swipe row is animating closed

type: `func`

params: ()


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
