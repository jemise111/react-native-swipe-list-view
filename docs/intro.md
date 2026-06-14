---
slug: /
---

# Getting started

`<SwipeListView>` is a vertical `FlatList` (or `SectionList`) with rows that swipe
open and closed. It handles the expected native behavior: closing rows when the
list scrolls or when another row is opened. It also exports `<SwipeRow>` for using
a swipeable row on its own.

> **Upgrading from v3?** Everything moved to react-native-gesture-handler v2 and
> react-native-reanimated v3. Read the [Migration guide](./MIGRATION.md).

## Installation

```bash
npm install react-native-swipe-list-view
npm install react-native-gesture-handler react-native-reanimated
```

`react-native-gesture-handler` (≥2.14.0) and `react-native-reanimated` (≥3.6.0)
are **peer dependencies**. After installing them:

1. Add the Reanimated Babel plugin (must be **last**) to `babel.config.js`:

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

**Requirements:** react ≥18, react-native ≥0.73.

## Quick start

```jsx
import { SwipeListView } from 'react-native-swipe-list-view';

// Each data item must have a `key`, or pass a `keyExtractor` to the list.
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
> press and the swipe gesture conflict.

## Where to next

- [`<SwipeListView />` API](./SwipeListView.md)
- [`<SwipeRow />` API](./SwipeRow.md)
- [Actions (swipe-to-delete / status changes)](./actions.md)
- [Per-row behavior](./per-row-behavior.md)
- [Manually closing rows](./manually-closing-rows.md)
- [Examples](./examples.md)
- [Migration v3 → v4](./MIGRATION.md)
