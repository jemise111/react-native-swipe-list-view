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
onRowOpen(rowKey, rowMap, toValue) {
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
            <Text>I am {rowData.item.text} in a SwipeListView</Text>
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