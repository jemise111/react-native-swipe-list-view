[![npm](https://img.shields.io/npm/v/react-native-swipe-list-view.svg)](https://www.npmjs.com/package/react-native-swipe-list-view) [![npm](https://img.shields.io/npm/dm/react-native-swipe-list-view.svg)](https://www.npmjs.com/package/react-native-swipe-list-view)

# react-native-swipe-list-view
****
--------

```<SwipeListView>``` is a vertical ListView with rows that swipe open and closed. Handles default native behavior such as closing rows when ListView is scrolled or when other rows are opened.

Also includes ```<SwipeRow>``` if you want to use a swipeable row outside of the ```<SwipeListView>```

--------
🔥🔥 BREAKING CHANGES 🔥🔥

For use with RN 0.60+ please use react-native-swipe-list-view@2.0.0+

RN 0.60 and RNSLV 2.0.0 deprecate the use of ListView entirely, please see [`example.js`](https://github.com/jemise111/react-native-swipe-list-view/blob/master/SwipeListExample/example.js) for examples and see the [migrating-to-flatlist doc](https://github.com/jemise111/react-native-swipe-list-view/blob/master/docs/migrating-to-flatlist.md) for a migration guide if you aren't already using `FlatList`.

The `useFlatList` prop is no longer required, as `FlatList` is the default ListView used.


--------

## Example

![](https://media.giphy.com/media/WrmrvmwMnvvmzN3ZpX/giphy.gif)

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
* ```cd ios```
* ```pod install```
* ```cd ..```
* ```react-native run-ios | react-native run-android```

> Android: If you get the [following error](https://github.com/facebook/react-native/issues/25629#issuecomment-511209583) `SwipeListExample/android/app/debug.keystore' not found for signing config 'debug'.`:
> ```bash
> cd android/app/ && keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000
> // answer the questions
> cd ../..
> ```

## Usage

```javascript
import { SwipeListView } from 'react-native-swipe-list-view';

//... note: your data array objects MUST contain a key property 
//          or you must pass a keyExtractor to the SwipeListView to ensure proper functionality
//          see: https://reactnative.dev/docs/flatlist#keyextractor

  this.state.listViewData = Array(20)
    .fill("")
    .map((_, i) => ({ key: `${i}`, text: `item #${i}` }));

//...
render() {
    return (
        <SwipeListView
            data={this.state.listViewData}
            renderItem={ (data, rowMap) => (
                <View style={styles.rowFront}>
                    <Text>I am {data.item.text} in a SwipeListView</Text>
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
And see [`example.js`](https://github.com/jemise111/react-native-swipe-list-view/blob/master/SwipeListExample/example.js) for a full usage example.

## Also see `docs/` for help with
 * [Manually Closing Rows](https://github.com/jemise111/react-native-swipe-list-view/blob/master/docs/manually-closing-rows.md)
 * [Per Row Behavior](https://github.com/jemise111/react-native-swipe-list-view/blob/master/docs/per-row-behavior.md)
 * [Actions](https://github.com/jemise111/react-native-swipe-list-view/blob/master/docs/actions.md)

## And the `examples/` folder for examples on
 * Swipe to Delete (also see "Actions" for an alternative way to achieve this)
 * Per Row Behavior
 * UI Based on Swipe Values
 * Actions

## Core Support

RN Core added a SwipeList component as of [v0.27.0](https://github.com/facebook/react-native/releases/tag/v0.27.0)
It is actively being worked on and has no documentation yet. So I will continue to maintain this component until a future date.

## License

MIT
