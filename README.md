[![npm](https://img.shields.io/npm/v/react-native-swipe-list-view.svg)](https://www.npmjs.com/package/react-native-swipe-list-view) [![npm](https://img.shields.io/npm/dm/react-native-swipe-list-view.svg)](https://www.npmjs.com/package/react-native-swipe-list-view) [![CI](https://github.com/jemise111/react-native-swipe-list-view/actions/workflows/ci.yml/badge.svg)](https://github.com/jemise111/react-native-swipe-list-view/actions/workflows/ci.yml)

# react-native-swipe-list-view

`<SwipeListView>` is a vertical `FlatList` (or `SectionList`) with rows that swipe
open and closed. It handles the expected native behavior: closing rows when the
list scrolls or when another row is opened.

It also exports `<SwipeRow>` for using a swipeable row on its own.

---

## v4

v4 is a full rewrite on **TypeScript**, **react-native-gesture-handler v2**, and
**react-native-reanimated v3** — gestures and animation now run on the UI thread.
The component API is prop-for-prop compatible with v3 apart from a short list of
breaking changes (new peer deps, removed dead ListView props, a changed
`swipeGestureEnded` payload, and more).

**Upgrading from v3?** Read the **[Migration guide](./docs/MIGRATION.md)**.

## Installation

```bash
npm install react-native-swipe-list-view
npm install react-native-gesture-handler react-native-reanimated
```

`react-native-gesture-handler` and `react-native-reanimated` are **peer
dependencies** (≥2.14.0 and ≥3.6.0). After installing them:

1. Add the Reanimated Babel plugin (must be **last** in the list) to
   `babel.config.js`:

   ```js
   module.exports = {
       presets: ['module:@react-native/babel-preset'],
       plugins: ['react-native-reanimated/plugin'],
   };
   ```

2. Wrap your app root in `GestureHandlerRootView`:

   ```jsx
   import { GestureHandlerRootView } from 'react-native-gesture-handler';

   export default function App() {
       return (
           <GestureHandlerRootView style={{ flex: 1 }}>
               {/* ... */}
           </GestureHandlerRootView>
       );
   }
   ```

3. Rebuild the native app (both are native modules).

See the official setup guides for
[gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation)
and
[reanimated](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started).

**Requirements:** react ≥18, react-native ≥0.73.

## Quick start

```jsx
import { SwipeListView } from 'react-native-swipe-list-view';

// Each data item must have a `key`, or pass a `keyExtractor` to the list:
// https://reactnative.dev/docs/flatlist#keyextractor
const data = Array(20)
    .fill('')
    .map((_, i) => ({ key: `${i}`, text: `item #${i}` }));

function MyList() {
    return (
        <SwipeListView
            data={data}
            renderItem={(rowData, rowMap) => (
                <View style={styles.rowFront}>
                    <Text>I am {rowData.item.text} in a SwipeListView</Text>
                </View>
            )}
            renderHiddenItem={(rowData, rowMap) => (
                <View style={styles.rowBack}>
                    <Text>Left</Text>
                    <Text>Right</Text>
                </View>
            )}
            leftOpenValue={75}
            rightOpenValue={-75}
        />
    );
}
```

> **Touchable rows:** if your row is a `Touchable*` with an `onPress`, make sure
> `renderItem` returns the `Touchable` as the **topmost** element, otherwise the
> press and the swipe gesture will conflict.
>
> ```jsx
> // Good
> renderItem={data => (
>     <TouchableHighlight onPress={doSomething}>
>         <View><Text>{data.item.text}</Text></View>
>     </TouchableHighlight>
> )}
> ```

## Component APIs

- [`<SwipeListView />`](./docs/SwipeListView.md)
- [`<SwipeRow />`](./docs/SwipeRow.md)

## Guides

- [Migration v3 → v4](./docs/MIGRATION.md)
- [Manually closing rows](./docs/manually-closing-rows.md)
- [Per-row behavior](./docs/per-row-behavior.md)
- [Actions (swipe-to-delete / status changes)](./docs/actions.md)

## Example app

A managed Expo app under [`example/`](./example) showcases every feature: basic
list, `SectionList`, per-row config, standalone `SwipeRow`, swipe-to-delete,
swipe-value-driven UI (both the legacy `onSwipeValueChange` and the recommended
`swipeAnimatedValue` approach), actions, manual close, and accessibility.

```bash
cd example
npm install
npx expo start
```

## License

MIT
