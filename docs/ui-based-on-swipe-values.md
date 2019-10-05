# UI based on swipe values (the gmail effect)

![](https://i.imgur.com/CLLoHhy.gif)

```javascript
class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            listViewData: Array(20).fill('').map((_,i) => ({key: `${i}`, text: `item #${i}`})),
        };

        this.rowSwipeAnimatedValues = {};
        Array(20).fill('').forEach((_, i) => {
            this.rowSwipeAnimatedValues[`${i}`] = new Animated.Value(0);
        });
    }

    onSwipeValueChange = (swipeData) => {
        const { key, value } = swipeData;
        this.rowSwipeAnimatedValues[key].setValue(Math.abs(value));
    }

    render() {
        return (
            <SwipeListView
                renderHiddenItem={ (data, rowMap) => (
                    <View style={styles.rowBack}>
                        <TouchableOpacity onPress={ () => this.deleteRow(rowMap, data.item.key) }>
                            <Animated.View
                                style={[
                                    styles.trash,
                                    {

                                        transform: [
                                            {
                                                scale: this.rowSwipeAnimatedValues[data.item.key].interpolate({
                                                    inputRange: [45, 90],
                                                    outputRange: [0, 1],
                                                    extrapolate: 'clamp',
                                                }),
                                            }
                                        ],
                                    }
                                ]}
                            >
                                <Image source={require('./images/trash.png')} style={styles.trash} />
                            </Animated.View>
                        </TouchableOpacity>
                    </View>
                )}
                leftOpenValue={75}
                rightOpenValue={-150}
                ...
```