# Swipe To Delete

![](https://user-images.githubusercontent.com/4265163/49108516-fdd81300-f24d-11e8-88d9-03b4ca7f90a3.gif)

```javascript

constructor(props) {
    super(props);
    this.state = {
        listViewData: Array(20).fill('').map((_,i) => ({key: `${i}`, text: `item #${i}`})),
    };

    this.rowTranslateAnimatedValues = {};
    Array(20).fill('').forEach((_, i) => {
        this.rowTranslateAnimatedValues[`${i}`] = new Animated.Value(1);
    });
}

onSwipeValueChange = (swipeData) => {
    const { key, value } = swipeData;
    // 375 or however large your screen is (i.e. Dimensions.get('window').width)
    if (value < -375 && !this.animationIsRunning) {
        this.animationIsRunning = true;
        Animated.timing(this.rowTranslateAnimatedValues[key], { toValue: 0, duration: 200 }).start(() => {
            const newData = [...this.state.listViewData];
            const prevIndex = this.state.listViewData.findIndex(item => item.key === key);
            newData.splice(prevIndex, 1);
            this.setState({listViewData: newData});
            this.animationIsRunning = false;
        });
    }
}

render() {
    return (
        <SwipeListView
            useFlatList
            data={this.state.listViewData}
            renderItem={ (data, rowMap) => (
                <Animated.View style={[styles.rowFrontContainer, 
                    {
                        height: this.rowTranslateAnimatedValues[data.item.key].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 50],
                        })
                    }
                ]}>
                    <TouchableHighlight
                        onPress={ _ => console.log('You touched me') }
                        style={styles.rowFront}
                        underlayColor={'#AAA'}
                    >
                        <View>
                            <Text>I am {data.item.text} in a SwipeListView</Text>
                        </View>
                    </TouchableHighlight>
                </Animated.View>
            )}
            rightOpenValue={-375}
            onSwipeValueChange={this.onSwipeValueChange}
        />
```