# Per Row Behavior

If you need rows to behave independently you can return a ```<SwipeRow>``` in the ```renderItem``` function. Make sure you import the ```<SwipeRow>``` in addition to the ```<SwipeListView>```. See the example below and the [`<SwipeRow />` API](./SwipeRow.md) for how to implement a custom ```<SwipeRow>```. There is also a full example in [`example/examples/per_row_config.tsx`](../example/examples/per_row_config.tsx).

> **Note:** returning a `<SwipeRow>` from `renderItem` is the explicit per-row path. The implicit detection (a `<SwipeRow>` returned without a `renderHiddenItem`) still works in v4 but is deprecated and will be removed in v5.

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
 * ```leftActivationValue```
 * ```rightActivationValue```
 * ```leftActionValue```
 * ```rightActionValue```
 * ```initialLeftActionState```
 * ```initialRightActionState```

```javascript
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';

<SwipeListView
    data={data}
    renderItem={ (rowData, rowMap) => (
        <SwipeRow
            disableRightSwipe={parseInt(rowData.item.key) % 2 !== 0}
            disableLeftSwipe={parseInt(rowData.item.key) % 2 === 0}
            leftOpenValue={20 + parseInt(rowData.item.key) * 5}
            rightOpenValue={-150}
            leftActivationValue={200}
        >
            <View style={styles.rowBack}>
                <Text>Left Hidden</Text>
                <Text>Right Hidden</Text>
            </View>
            <View style={styles.rowFront}>
                <Text>Row front | {rowData.item.key}</Text>
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
 * ```leftActivationValue```
 * ```rightActivationValue```
 * ```leftActionValue```
 * ```rightActionValue```
 * ```initialLeftActionState```
 * ```initialRightActionState```

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
        leftActivationValue: 200,
    },
];
```
