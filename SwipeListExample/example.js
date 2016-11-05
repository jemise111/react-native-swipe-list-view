import React, {
	Component,
} from 'react';
import {
	AppRegistry,
	ListView,
	StyleSheet,
	Text,
	TouchableOpacity,
	TouchableHighlight,
	View
} from 'react-native';

import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';

class App extends Component {

	constructor(props) {
		super(props);
		this.ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
		this.state = {
			basic: true,
			listViewData: Array(20).fill('').map((_,i)=>`item #${i}`)
		};
	}

	deleteRow(secId, rowId, rowMap) {
		rowMap[`${secId}${rowId}`].closeRow();
		const newData = [...this.state.listViewData];
		newData.splice(rowId, 1);
		this.setState({listViewData: newData});
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
							<Text>I'm a standalone SwipeRow</Text>
						</View>
					</SwipeRow>
				</View>

				<View style={styles.controls}>
					<View style={styles.switchContainer}>
						<TouchableOpacity style={[
							styles.switch,
							{backgroundColor: this.state.basic ? 'grey' : 'white'}
						]} onPress={ _ => this.setState({basic: true}) }>
							<Text>Basic</Text>
						</TouchableOpacity>

						<TouchableOpacity style={[
							styles.switch,
							{backgroundColor: this.state.basic ? 'white' : 'grey'}
						]} onPress={ _ => this.setState({basic: false}) }>
							<Text>Advanced</Text>
						</TouchableOpacity>

					</View>
					{
						!this.state.basic &&
						<Text>(per row behavior)</Text>
					}
				</View>

				{
					this.state.basic &&

					<SwipeListView
						dataSource={this.ds.cloneWithRows(this.state.listViewData)}
						renderRow={ data => (
							<TouchableHighlight
								onPress={ _ => console.log('You touched me') }
								style={styles.rowFront}
								underlayColor={'#AAA'}
							>
								<View>
									<Text>I'm {data} in a SwipeListView</Text>
								</View>
							</TouchableHighlight>
						)}
						renderHiddenRow={ (data, secId, rowId, rowMap) => (
							<View style={styles.rowBack}>
								<Text>Left</Text>
								<View style={[styles.backRightBtn, styles.backRightBtnLeft]}>
									<Text style={styles.backTextWhite}>Right</Text>
								</View>
								<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={ _ => this.deleteRow(secId, rowId, rowMap) }>
									<Text style={styles.backTextWhite}>Delete</Text>
								</TouchableOpacity>
							</View>
						)}
						leftOpenValue={75}
						rightOpenValue={-150}
					/>
				}

				{
					!this.state.basic &&

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
									<View style={[styles.backRightBtn, styles.backRightBtnLeft]}>
										<Text style={styles.backTextWhite}>Right</Text>
									</View>
									<TouchableOpacity style={[styles.backRightBtn, styles.backRightBtnRight]} onPress={ _ => this.deleteRow(secId, rowId, rowMap) }>
										<Text style={styles.backTextWhite}>Delete</Text>
									</TouchableOpacity>
								</View>
								<TouchableHighlight
									onPress={ _ => console.log('You touched me') }
									style={styles.rowFront}
									underlayColor={'#AAA'}
								>
									<View>
										<Text>I'm {data} in a SwipeListView</Text>
									</View>
								</TouchableHighlight>
							</SwipeRow>
						)}
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
		width: 100,
	}
});

export default App;