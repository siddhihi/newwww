import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ImageBackground,
  Image,
  Alert,
  ToastAndroid,
  KeyboardAvoidingView,
} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from '../config';

const bgImage = require('../assets/background2.png');
const appIcon = require('../assets/appIcon.png');

export default class RideScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bikeId: '',
      userId: '',
      domState: 'normal',
      hasCameraPermissions: null,
      scanned: false,
      bikeType: '',
      userName: '',
      bikeAssigned: '',
    };
  }

  getCameraPermissions = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
      hasCameraPermissions: status === 'granted',
      domState: 'scanner',
      scanned: false,
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    this.setState({
      bikeId: data,
      domState: 'normal',
      scanned: true,
    });
  };

  handleTransaction = async () => {
    var { bikeId, userId } = this.state;
    await this.getBikeDetails(bikeId);
    await this.getUserDetails(userId);

    db.collection('bicycles')
      .doc(bikeId)
      .get()
      .then((doc) => {
        var bike = doc.data();
        if (bike.is_bike_available) {
          var { bikeType, userName } = this.state;

          this.assignBike(bikeId, userId, bikeType, userName);
          // For Android users only

          {/* show(
            'You have rented the bike for next 1 hour. Enjoy your ride!!',
            ToastAndroid.SHORT
          );*/}

          {/* ToastAndroid.show(
            'You have rented the bike for next 1 hour. Enjoy your ride!!',
            ToastAndroid
          );*/}

          {/* ToastAndroid.show(
            'You have rented the bike for next 1 hour. Enjoy your ride!!',
             SHORT
          );*/}

          {/* ToastAndroid.show(
            'You have rented the bike for next 1 hour. Enjoy your ride!!',
            ToastAndroid.SHORT
          );*/}

          this.setState({
            bikeAssigned: true,
          });
        } else {
          var { bikeType, userName } = this.state;

          this.returnBike(bikeId, userId, bikeType, userName);

          //For Android users only
          ToastAndroid.show(
            'We hope you enjoyed your ride',
            ToastAndroid.SHORT
          );

          this.setState({
            bikeAssigned: false,
          });
        }
      });
  };

  getBikeDetails = (bikeId) => {
    bikeId = bikeId.trim();
    db.collection('bicycles')
      .where('id', '==', bikeId)
      .get()
      .then((snapshot) => {
        snapshot.docs.map((doc) => {
          this.setState({
            bikeType: doc.data().bike_type,
          });
        });
      });
  };

  getUserDetails = (userId) => {
    db.collection('users')
      .where('id', '==', userId)
      .get()
      .then((snapshot) => {
        snapshot.docs.map((doc) => {
          this.setState({
            userName: doc.data().name,
            userId: doc.data().id,
            bikeAssigned: doc.data().bike_assigned,
          });
        });
      });
  };

  assignBike = async (bikeId, userId, bikeType, userName) => {
    //add a transaction
    db.collection('transactions').add({
      user_id: userId,
      user_name: userName,
      bike_id: bikeId,
      bike_type: bikeType,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: 'rented',
    });
    //change bike status
    db.collection('bicycles').doc(bikeId).update({
      is_bike_available: false,
    });
    //change value  of bike assigned for user
    db.collection('users').doc(userId).update({
      bike_assigned: true,
    });

    // Updating local state
    this.setState({
      bikeId: '',
    });
  };

  returnBike = async (bikeId, userId, bikeType, userName) => {
    //add a transaction
    db.collection('transactions').add({
      user_id: userId,
      user_name: userName,
      bike_id: bikeId,
      bike_type: bikeType,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: 'return',
    });
    //change bike status
    db.collection('bicycles').doc(bikeId).update({
      is_bike_available: true,
    });
    //change value  of bike assigned for user
    db.collection('users').doc(userId).update({
      bike_assigned: false,
    });

    // Updating local state
    this.setState({
      bikeId: '',
    });
  };

  render() {
    const { bikeId, userId, domState, scanned, bikeAssigned } = this.state;
    if (domState !== 'normal') {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <View style={styles.upperContainer}>
          <Image source={appIcon} style={styles.appIcon} />
          <Text style={styles.title}>e-ride</Text>
          <Text style={styles.subtitle}>A Eco-Friendly Ride</Text>
        </View>
        <View style={styles.lowerContainer}>
          <View style={styles.textinputContainer}>
            <TextInput
              style={[styles.textinput, { width: '82%' }]}

              //onChangeText={() => this.setState({ userId: text })}
              //onChangeText={this.setState({ userId: text })}
              //onChangeText={(text) => this.setState({ userId: text })}
              //onChangeText={(text) => ({ userId: text })}

              placeholder={'User Id'}
              placeholderTextColor={'#FFFFFF'}
              value={userId}
            />
          </View>
          <View style={[styles.textinputContainer, { marginTop: 25 }]}>
            <TextInput
              style={styles.textinput}
              onChangeText={(text) => this.setState({ bikeId: text })}
              placeholder={'Bicycle Id'}
              placeholderTextColor={'#FFFFFF'}
              value={bikeId}
            />
            <TouchableOpacity
              style={styles.scanbutton}
              onPress={() => this.getCameraPermissions()}>
              <Text style={styles.scanbuttonText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.button, { marginTop: 25 }]}
            onPress={this.handleTransaction}>
            <Text style={styles.buttonText}>
              {bikeAssigned ? 'End Ride' : 'Unlock'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D0E6F0',
  },
  bgImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  upperContainer: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIcon: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginTop: 80,
  },
  title: {
    fontSize: 40,
    fontFamily: 'Rajdhani_600SemiBold',
    paddingTop: 20,
    color: '#4C5D70',
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Rajdhani_600SemiBold',
    color: '#4C5D70',
  },
  lowerContainer: {
    flex: 0.5,
    alignItems: 'center',
  },
  textinputContainer: {
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: 'row',
    backgroundColor: '#4C5D70',
    borderColor: '#4C5D70',
  },
  textinput: {
    width: '57%',
    height: 50,
    padding: 10,
    borderColor: '#4C5D70',
    borderRadius: 10,
    borderWidth: 3,
    fontSize: 18,
    backgroundColor: '#F88379',
    fontFamily: 'Rajdhani_600SemiBold',
    color: '#FFFFFF',
  },
  scanbutton: {
    width: 100,
    height: 50,
    backgroundColor: '#FBE5C0',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanbuttonText: {
    fontSize: 24,
    color: '#4C5D70',
    fontFamily: 'Rajdhani_600SemiBold',
  },
  button: {
    width: '43%',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBE5C0',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4C5D70',
  },
  buttonText: {
    fontSize: 24,
    color: '#4C5D70',
    fontFamily: 'Rajdhani_600SemiBold',
  },
});
