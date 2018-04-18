import React, {
	Component,
} from 'react';
import {
	AppRegistry,
	Dimensions,
	ListView,
	StyleSheet,
	Text,
	TouchableOpacity,
	TouchableHighlight,
	View
} from 'react-native';

import SwipeListView from './SwipeListView';
import SwipeRow from './SwipeRow';

class App extends Component {

	constructor(props) {
		super(props);
		this.ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
		this.state = {
			listType: 'FlatList',
			listViewData: Array(20).fill('').map((_,i) => ({key: `${i}`, text: `item #${i}`})),
		};
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
		this.setState({listViewData: newData});
	}

	onRowDidOpen = (rowKey, rowMap) => {
		console.log('This row opened', rowKey);
		setTimeout(() => {
			this.closeRow(rowMap, rowKey);
		}, 2000);
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
						{ ['Basic', 'Advanced', 'FlatList', 'SectionList'].map( type => (
							<TouchableOpacity
								key={type}
								style={[
									styles.switch,
									{backgroundColor: this.state.listType === type ? 'grey' : 'white'}
								]}
								onPress={ _ => this.setState({listType: type}) }
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

					<SwipeListView
						dataSource={this.ds.cloneWithRows(this.state.listViewData)}
						renderRow={ data => (
							<TouchableHighlight
								onPress={ _ => console.log('You touched me') }
								style={styles.rowFront}
								underlayColor={'#AAA'}
							>
								<View>
									<Text>I am {data.text} in a SwipeListView</Text>
								</View>
							</TouchableHighlight>
						)}
						renderHiddenRow={ (data, secId, rowId, rowMap) => (
							<View style={styles.rowBack}>
								<Text>Left</Text>
								<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnLeft]} onPress={ _ => this.closeRow(rowMap, `${secId}${rowId}`) }>
									<Text style={styles.backTextWhite}>Close</Text>
								</TouchableOpacity>
								<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={ _ => this.deleteRow(rowMap, `${secId}${rowId}`) }>
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

					<SwipeListView
						dataSource={this.ds.cloneWithRows(this.state.listViewData)}
						renderRow={ (data, secId, rowId, rowMap) => (
							<SwipeRow
								disableLeftSwipe={parseInt(rowId) % 2 === 0}
								leftOpenValue={20 + Math.random() * 150}
								rightOpenValue={-150}
							>
								<View style={styles.rowBack}>
									<Text>Left</Text>
									<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnLeft]} onPress={ _ => this.closeRow(rowMap, `${secId}${rowId}`) }>
										<Text style={styles.backTextWhite}>Close</Text>
									</TouchableOpacity>
									<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={ _ => this.deleteRow(rowMap, `${secId}${rowId}`) }>
										<Text style={styles.backTextWhite}>Delete</Text>
									</TouchableOpacity>
								</View>
								<TouchableHighlight
									onPress={ _ => console.log('You touched me') }
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

					<SwipeListView
						useFlatList
						data={this.state.listViewData}
						renderItem={ (data, rowMap) => (
							<TouchableHighlight
								onPress={ _ => console.log('You touched me') }
								style={styles.rowFront}
								underlayColor={'#AAA'}
							>
								<View>
									<Text>I am {data.item.text} in a SwipeListView</Text>
								</View>
							</TouchableHighlight>
						)}
						renderHiddenItem={ (data, rowMap) => (
							<View style={styles.rowBack}>
								<Text>Left</Text>
								<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnLeft]} onPress={ _ => this.closeRow(rowMap, data.item.key) }>
									<Text style={styles.backTextWhite}>Close</Text>
								</TouchableOpacity>
								<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={ _ => this.deleteRow(rowMap, data.item.key) }>
									<Text style={styles.backTextWhite}>Delete</Text>
								</TouchableOpacity>
							</View>
						)}
						leftOpenValue={75}
						rightOpenValue={-150}
						previewRowKey={'0'}
						previewOpenValue={-40}
						previewOpenDelay={3000}
						onRowDidOpen={this.onRowDidOpen}
					/>
				}

				{
					this.state.listType === 'SectionList' &&

					<Text>Coming soon...</Text>
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
	}
});

export default App;