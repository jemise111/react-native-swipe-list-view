# Manually Closing Rows

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