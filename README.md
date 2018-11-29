[![npm](https://img.shields.io/npm/v/react-native-swipe-list-view.svg)](https://www.npmjs.com/package/react-native-swipe-list-view) [![npm](https://img.shields.io/npm/dm/react-native-swipe-list-view.svg)](https://www.npmjs.com/package/react-native-swipe-list-view)

# react-native-swipe-list-view

--------

```<SwipeListView>``` is a ListView with rows that swipe open and closed. Handles default native behavior such as closing rows when ListView is scrolled or when other rows are opened.

Also includes ```<SwipeRow>``` if you want to use a swipeable row outside of the ```<SwipeListView>```

## Example
![](http://i.imgur.com/6fTrdZa.gif) &nbsp;&nbsp;&nbsp;&nbsp; ![](http://i.imgur.com/3IdOA77.gif)

Try it out! https://snack.expo.io/@jemise111/react-native-swipe-list-view

([What's a Snack?](https://blog.expo.io/sketch-a-playground-for-react-native-16b2401f44a2))

## Installation
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

## Usage
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

## Component APIs
[`<SwipeListView />`](https://github.com/jemise111/react-native-swipe-list-view/blob/master/docs/SwipeListView.md)

[`<SwipeRow />`](https://github.com/jemise111/react-native-swipe-list-view/blob/master/docs/SwipeRow.md)

## Flatlist / SectionList support
`SwipeListView` now supports `FlatList` and `SectionList`! (as of v1.0.0)

Please see the [migrating-to-flatlist doc](https://github.com/jemise111/react-native-swipe-list-view/blob/master/docs/migrating-to-flatlist.md) for all details.
And see `example.js` for a full usage example.

You can continue to use the (deprecated) `ListView` component, however there are some BREAKING CHANGES that are explained in that doc as well

## Other Useful Guides
 * [Per Row Behavior](https://github.com/jemise111/react-native-swipe-list-view/blob/master/docs/per-row-behavior.md) (Define different swipe values, stop values, etc for each individual row)
 * [UI Based On Swipe Values](https://github.com/jemise111/react-native-swipe-list-view/blob/master/docs/ui-based-on-swipe-values.md) (aka the gmail effect - animate components in rows based on current swipe position)
 * [Swipe To Delete](https://github.com/jemise111/react-native-swipe-list-view/blob/master/docs/swipe-to-delete.md) (Swiping a row all the way across causes a delete animation)

## Core Support
RN Core added a SwipeList component as of [v0.27.0](https://github.com/facebook/react-native/releases/tag/v0.27.0)
It is actively being worked on and has no documentation yet. So I will continue to maintain this component until a future date.

## License
MIT
