# Per Row Behavior

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
    data={data}
    renderItem={ (rowData, rowMap) => (
        <SwipeRow
            disableRightSwipe={parseInt(data.item.key) % 2 !== 0}
            disableLeftSwipe={parseInt(data.item.key) % 2 === 0}
            leftOpenValue={20 + parseInt(data.item.key) * 5}
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