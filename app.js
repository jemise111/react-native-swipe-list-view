import React, {
	AppRegistry,
	Component,
	ListView,
	StyleSheet,
	Text,
	TouchableHighlight,
	View
} from 'react-native';

import { SwipeListView, SwipeRow } from './lib';

const dataSource = Array(20).fill('').map((_,i)=>`item #${i}`);

class App extends Component {

	constructor(props) {
		super(props);
		this.ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
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
					dataSource={this.ds.cloneWithRows(dataSource)}
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
					renderHiddenRow={ data => (
						<View style={styles.rowBack}>
							<Text>Left</Text>
							<View style={[styles.backRightBtn, styles.backRightBtnLeft]}>
								<Text style={styles.backTextWhite}>Right1</Text>
							</View>
							<View style={[styles.backRightBtn, styles.backRightBtnRight]}>
								<Text style={styles.backTextWhite}>Right2</Text>
							</View>
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
