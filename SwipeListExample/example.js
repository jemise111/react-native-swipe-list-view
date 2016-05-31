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
		marginTop: 50,
		marginBottom: 50,
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
	}
});

export default App;
