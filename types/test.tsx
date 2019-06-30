import React, {
	Component,
} from 'react';
import {
	Animated,
	AppRegistry,
	Dimensions,
	Image,
	ListView,
	StyleSheet,
	Text,
	TouchableOpacity,
	TouchableHighlight,
	View,
	ListViewDataSource
} from 'react-native';

import { SwipeListView, SwipeRow } from './';

interface State {
	// listType: 'FlatList';
	listViewData: Array<{
		key: string;
		text: string;
	}>;
	sectionListData: Array<{
		title: string;
		data: Array<{
			key: string;
			text: string;
		}>;
	}>;
	listType: string;
}

class App extends Component<{}, State> {
	ds: ListViewDataSource;
	rowSwipeAnimatedValues: { [key: string]: Animated.Value; };

	constructor(props) {
		super(props);
		this.ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
		this.state = {
			listType: 'FlatList',
			listViewData: Array(20).fill('').map((_, i) => ({ key: `${i}`, text: `item #${i}` })),
			sectionListData: Array(5).fill('').map((_, i) => ({ title: `title${i + 1}`, data: [...Array(5).fill('').map((_, j) => ({ key: `${i}.${j}`, text: `item #${j}` }))] })),
		};

		this.rowSwipeAnimatedValues = {};
		Array(20).fill('').forEach((_, i) => {
			this.rowSwipeAnimatedValues[`${i}`] = new Animated.Value(0);
		});
	}

	closeRow(rowMap, rowKey) {
		if (rowMap[rowKey]) {
			rowMap[rowKey].closeRow();
		}
	}

	deleteRow(rowMap, rowKey) {
		this.closeRow(rowMap, rowKey);
		const newData = [...this.state.listViewData];
		const prevIndex = this.state.listViewData.findIndex(item => item.key === rowKey);
		newData.splice(prevIndex, 1);
		this.setState({ listViewData: newData });
	}

	deleteSectionRow(rowMap, rowKey) {
		this.closeRow(rowMap, rowKey);
		var [section, row] = rowKey.split('.');
		const newData = [...this.state.sectionListData];
		const prevIndex = this.state.sectionListData[section].data.findIndex(item => item.key === rowKey);
		newData[section].data.splice(prevIndex, 1);
		this.setState({ sectionListData: newData });
	}

	onRowDidOpen = (rowKey, rowMap) => {
		console.log('This row opened', rowKey);
	}

	onSwipeValueChange = (swipeData) => {
		const { key, value } = swipeData;
		this.rowSwipeAnimatedValues[key].setValue(Math.abs(value));
	}

	render() {
		return (
			<View style={styles.container}>

				<View style={styles.standalone}>
					<SwipeRow
						leftOpenValue={75}
						rightOpenValue={-75}
					>
						<View style={styles.standaloneRowBack}>
							<Text style={styles.backTextWhite}>Left</Text>
							<Text style={styles.backTextWhite}>Right</Text>
						</View>
						<View style={styles.standaloneRowFront}>
							<Text>I am a standalone SwipeRow</Text>
						</View>
					</SwipeRow>
				</View>

				<View style={styles.controls}>
					<View style={styles.switchContainer}>
						{['Basic', 'Advanced', 'FlatList', 'SectionList'].map(type => (
							<TouchableOpacity
								key={type}
								style={[
									styles.switch,
									{ backgroundColor: this.state.listType === type ? 'grey' : 'white' }
								]}
								onPress={_ => this.setState({ listType: type })}
							>
								<Text>{type}</Text>
							</TouchableOpacity>
						))}
					</View>
					{
						this.state.listType === 'Advanced' &&
						<Text>(per row behavior)</Text>
					}
				</View>

				{
					this.state.listType === 'Basic' &&

					<SwipeListView<{ text: string; }>
						dataSource={this.ds.cloneWithRows(this.state.listViewData)}
						renderRow={data => (
							<TouchableHighlight
								onPress={_ => console.log('You touched me')}
								style={styles.rowFront}
								underlayColor={'#AAA'}
							>
								<View>
									<Text>I am {data.text} in a SwipeListView</Text>
								</View>
							</TouchableHighlight>
						)}
						renderHiddenRow={(data, secId, rowId, rowMap) => (
							<View style={styles.rowBack}>
								<Text>Left</Text>
								<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnLeft]} onPress={_ => this.closeRow(rowMap, `${secId}${rowId}`)}>
									<Text style={styles.backTextWhite}>Close</Text>
								</TouchableOpacity>
								<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={_ => this.deleteRow(rowMap, `${secId}${rowId}`)}>
									<Text style={styles.backTextWhite}>Delete</Text>
								</TouchableOpacity>
							</View>
						)}
						leftOpenValue={75}
						rightOpenValue={-150}
					/>
				}

				{
					this.state.listType === 'Advanced' &&

					<SwipeListView<{ text: string; }>
						dataSource={this.ds.cloneWithRows(this.state.listViewData)}
						renderRow={(data, secId, rowId, rowMap) => (
							<SwipeRow
								disableLeftSwipe={parseInt(rowId) % 2 === 0}
								leftOpenValue={20 + Math.random() * 150}
								rightOpenValue={-150}
							>
								<View style={styles.rowBack}>
									<Text>Left</Text>
									<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnLeft]} onPress={_ => this.closeRow(rowMap, `${secId}${rowId}`)}>
										<Text style={styles.backTextWhite}>Close</Text>
									</TouchableOpacity>
									<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={_ => this.deleteRow(rowMap, `${secId}${rowId}`)}>
										<Text style={styles.backTextWhite}>Delete</Text>
									</TouchableOpacity>
								</View>
								<TouchableHighlight
									onPress={_ => console.log('You touched me')}
									style={styles.rowFront}
									underlayColor={'#AAA'}
								>
									<View>
										<Text>I am {data.text} in a SwipeListView</Text>
									</View>
								</TouchableHighlight>
							</SwipeRow>
						)}
					/>
				}

				{
					this.state.listType === 'FlatList' &&

					<SwipeListView<{ text: string; key: string; }>
						useFlatList
						data={this.state.listViewData}
						renderItem={(data) => (
							<TouchableHighlight
								onPress={_ => console.log('You touched me')}
								style={styles.rowFront}
								underlayColor={'#AAA'}
							>
								<View>
									<Text>I am {data.item.text} in a SwipeListView</Text>
								</View>
							</TouchableHighlight>
						)}
						renderHiddenItem={(data, rowMap) => (
							<View style={styles.rowBack}>
								<Text>Left</Text>
								<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnLeft]} onPress={_ => this.closeRow(rowMap, data.item.key)}>
									<Text style={styles.backTextWhite}>Close</Text>
								</TouchableOpacity>
								<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={_ => this.deleteRow(rowMap, data.item.key)}>
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
						previewRowKey={'0'}
						previewOpenValue={-40}
						previewOpenDelay={3000}
						onRowDidOpen={this.onRowDidOpen}
						onSwipeValueChange={this.onSwipeValueChange}
					/>
				}

				{
					this.state.listType === 'SectionList' &&

					<SwipeListView<{ text: string; key: string; }>
						useSectionList
						sections={this.state.sectionListData}
						renderItem={(data) => (
							<TouchableHighlight
								onPress={_ => console.log('You touched me')}
								style={styles.rowFront}
								underlayColor={'#AAA'}
							>
								<View>
									<Text>I am {data.item.text} in a SwipeListView</Text>
								</View>
							</TouchableHighlight>
						)}
						renderHiddenItem={(data, rowMap) => (
							<View style={styles.rowBack}>
								<Text>Left</Text>
								<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnLeft]} onPress={_ => this.closeRow(rowMap, data.item.key)}>
									<Text style={styles.backTextWhite}>Close</Text>
								</TouchableOpacity>
								<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={_ => this.deleteSectionRow(rowMap, data.item.key)}>
									<Text style={styles.backTextWhite}>Delete</Text>
								</TouchableOpacity>
							</View>
						)}
						renderSectionHeader={({ section }) => <Text>{section.title}</Text>}
						leftOpenValue={75}
						rightOpenValue={-150}
						previewRowKey={'0'}
						previewOpenValue={-40}
						previewOpenDelay={3000}
						onRowDidOpen={this.onRowDidOpen}
					/>
				}

			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'white',
		flex: 1
	},
	standalone: {
		marginTop: 30,
		marginBottom: 30,
	},
	standaloneRowFront: {
		alignItems: 'center',
		backgroundColor: '#CCC',
		justifyContent: 'center',
		height: 50,
	},
	standaloneRowBack: {
		alignItems: 'center',
		backgroundColor: '#8BC645',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 15
	},
	backTextWhite: {
		color: '#FFF'
	},
	rowFront: {
		alignItems: 'center',
		backgroundColor: '#CCC',
		borderBottomColor: 'black',
		borderBottomWidth: 1,
		justifyContent: 'center',
		height: 50,
	},
	rowBack: {
		alignItems: 'center',
		backgroundColor: '#DDD',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingLeft: 15,
	},
	backRightBtn: {
		alignItems: 'center',
		bottom: 0,
		justifyContent: 'center',
		position: 'absolute',
		top: 0,
		width: 75
	},
	backRightBtnLeft: {
		backgroundColor: 'blue',
		right: 75
	},
	backRightBtnRight: {
		backgroundColor: 'red',
		right: 0
	},
	controls: {
		alignItems: 'center',
		marginBottom: 30
	},
	switchContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 5
	},
	switch: {
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'black',
		paddingVertical: 10,
		width: Dimensions.get('window').width / 4,
	},
	trash: {
		height: 25,
		width: 25,
	}
});

export default App;
