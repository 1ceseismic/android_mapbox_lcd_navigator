import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Button, TouchableOpacity, Image, Dimensions, Keyboard, PermissionsAndroid, Platform, FlatList} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import MapViewDirections from 'react-native-maps-directions';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

const { width: screenWidth } = Dimensions.get('window');
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoiam9lcnUiLCJhIjoiY2xyOXN6aGswMDZuaTJpcnNkdTN5Y3dtNyJ9.9hNeXSbKdMl5CXqRbVRYwQ'
const GOOGLE_MAPS_API_KEY = 'AIzaSyBSLHFzNpmj7x5NImV6SV6JcERThBaBqvo'; 
const API_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
const GOOGLE_DIRECTIONS_API = 'https://maps.googleapis.com/maps/api/directions/json';

import MapView, {PROVIDER_GOOGLE, Polyline, Marker, MapCalloutSubview, Circle } from 'react-native-maps';
import {enableLatestRenderer} from 'react-native-maps';
import {BleManager, BleError, Device } from 'react-native-ble-plx';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';

const CHARACTERISTIC_UUID = '19B10001-E8F2-537E-4F6C-D104768A1214'; 

enableLatestRenderer();

const pathToLight = './icons/png/light/';

interface AddressFeature {
  place_name: string;
}
interface Step {
  maneuver: any;
  distance: any;
  html_instructions: string;
  instructions: string;
  start_location: { lat: number; lng: number };
  end_location: { lat: number; lng: number };
}

interface Leg {
  distance: any;
  start_location: any;
  steps: Step[];
}

interface Route {
  legs: Leg[];
}

interface DirectionsResponse {
  routes: Route[];
}

const App: React.FC = () => { 

  const checkLocationPermission = async () => {
    try {
      const result = await check(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_ALWAYS
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      );
      
      if (result === RESULTS.GRANTED) {
        // permission is already granted
        setLocationPermissionGranted(true);
        fetchUserLocation();

      } else {
        // permission isnt granted so request it
        const permissionResult = await request(
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.LOCATION_ALWAYS
            : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        );
        if (permissionResult === RESULTS.GRANTED) {
          // Permission granted after request
          setLocationPermissionGranted(true);
          fetchUserLocation();
        } else { 
          console.warn('Location permission denied.');
        }
      }
    } catch (error) {
      console.error('Error checking Bluetooth permissions:', error);
    }
  };

  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [destination, setDestination] = useState('');
  const [potentialAddresses, setPotentialAddresses] = useState<AddressFeature[]>([]);

   const [directions, setDirections] = useState<DirectionsResponse | null>(null);
  const [startingLocation, setStartingLocation] = useState('');
  const [navigationStarted, setNavigationStarted] = useState(false);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [displayedStepIndex, setDisplayedStepIndex] = useState(0);
  const [FinalStepIndex, setFinalStepIndex] = useState<number | null>(null);

  const [routeSteps, setRouteSteps] = useState<Step[]>([]);
  const [distanceToNextStep, setDistanceToNextStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showAllDirections, setShowAllDirections] = useState(false);
  const [currentManeuver, setCurrentManeuver] = useState<string>('');

  const [userLocation, setUserLocation] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ latitude: 0, longitude: 0 });
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [totalTravelDistance, setTotalTravelDistance] = useState<number | null>(null);
  const [exitNumber, setExitNumber] = useState<number | null>(null);
  
  const [DestinationCoordinates, setDestinationCoordinates] = useState<{ latitude: number; longitude: number }>({
    latitude: 0,
    longitude: 0,
  }); 

  const [circleRadius, setCircleRadius] = useState(0);

  let outputString = ''; 

  //for bte module
  const [devices, setDevices] = useState<Device[]>([]);
  const [device, setDevice] = useState<Device | null>(null); 
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [manager, setManager] = useState<BleManager | null>(null);


  const handleShowAllDirections = () => {
    setShowAllDirections((prevValue) => !prevValue);
  };

  const handleShowMap = () => {
    setMapVisible((prevValue) => !prevValue);
    Keyboard.dismiss(); //recess mobile keyboard by auto
  };


  useEffect(() => {
    checkLocationPermission();
    checkBluetoothPermissions();
  }, []);

  const checkBluetoothPermissions = async () => {
    // const bleManager = new BleManager();
    // setManager(bleManager);
    // fetchUserLocation();
   
    // try {
    //   BluetoothStateManager.enable().then(() => {
    //     console.log('Bluetooth is turned on');
    //       scanDevices();
        
    // });
      
    //   const result = await BluetoothStateManager.requestToEnable();
    //   if (result) {
    //     scanDevices();
    //     console.log('bt enabled, scanning for devices')
    //   } else {
    //     console.warn('Bluetooth is not enabled.');
    //   }
    // } catch (error) {
    //   console.error('Error checking Bluetooth permissions:', error);
    // }
  };


  useEffect(() => {

    if (navigationStarted) {
      const locationUpdateInterval = setInterval(() => {
        updateRouteifClose();
        fetchUserLocation();
      }, 3000);  // check user location + claculation delay
      return () => clearInterval(locationUpdateInterval);
    }
  }, [navigationStarted, currentStepIndex]);
  
  const scanDevices = async () => {
    try {
      const manager = new BleManager();

      const subscription = manager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          manager.startDeviceScan(null, null, (error, scannedDevice) => {
            if (error) {
              console.error('Scan error:', error);
              return;
            }

            if (scannedDevice) {
              setDevices((prevDevices) => {
                if (!prevDevices.some((dev) => dev.id === scannedDevice.id)) {
                  return [...prevDevices, scannedDevice];
                }
                return prevDevices;
              });
            }
          });
            //bte scanning timeout limit
          setTimeout(() => {
            manager.stopDeviceScan();
          }, 30000);
        }
      }, true);

      return () => {
        subscription.remove();
        manager.destroy();
      };
    } catch (error) {
      console.error('Error scanning devices or Bluetooth not enabled:', error);
    }
  };

 
  const connectToDevice = async (manager: BleManager | null, selectedDevice: Device | null) => {
    try {
      if (manager && selectedDevice) {
        console.log('Connecting to device:', selectedDevice.name || selectedDevice.id)

        // const device = manager.connectToDevice(selectedDevice.id)

        const connectedDevice = await selectedDevice.connect();
        setDevice(connectedDevice);
      } else {
        console.warn('No manager or device available for connection.');
      }
    } catch (error) {
      console.error('Error connecting to device:', error);
    }
  };

  const fetchUserLocation = () => {
    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        
        if(navigationStarted){ //updating live
          const nextStep = routeSteps[currentStepIndex];

          const calculatedDistanceToNextStep = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            nextStep.start_location.lat,
            nextStep.start_location.lng
          ); 

          console.log('Navigation started, explicitly updating user location')
          console.log('user location: ', currentLocation)
        }
        else { //starting new route
          console.log('new route, reverse geocoding...')
          reverseGeocode(latitude, longitude, false);
        }
      },
        (error) => {
          console.error('Error getting location:', error);
        },
      
        { enableHighAccuracy: true,}
        );
  };

  const reverseGeocode = async (latitude: number, longitude: number, address: boolean) => { //false for normal, true for watching user
    try {
      const response = await fetch(
        `${API_BASE_URL}${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const nearestAddress = (data.features[0] as AddressFeature).place_name || '';

        if (response.ok && address == false)  {  //setting destination address
          setStartingLocation(nearestAddress);
        } else if (response.ok && address == true) {
        return nearestAddress;

        console.error('Error fetching user location address:', response.status);
      }    
    }
  } catch (error) {
    console.error('Error fetching user location address:', error);
  }
  return '';
}
  
  const forwardGeocode = async (placeName: string) => {
    try {

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(placeName)}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.ok) {
          const data = await response.json();
    
          if (data.results.length > 0) {
            console.log('placename', placeName);
           const location = data.results[0].geometry.location;
           const location_type = data.results[0].geometry.location_type;
            console.log('location type', location_type)

            if (location_type === 'ROOFTOP' || location_type === 'RANGE_INTERPOLATED' || location_type === 'APPROXIMATE') {
              setDestinationCoordinates({
                latitude: location.lat,
                longitude: location.lng,
              });
  
            }
           
          } else {
            console.error('Location not found');
          }
        } else {
          console.error('Error with forward geocode:', response.status);
        }
      } catch (error) {
        console.error('Error with forward geocode:', error);
      }
    };

  const fetchPotentialAddresses = async () => {
    setCircleRadius(5);
    try {
      if (destination.length > 0) {

        const response = await fetch(
          `${API_BASE_URL}${encodeURIComponent(destination)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=NZ`
        );

        if (response.ok) {
          const data = await response.json();
          setPotentialAddresses(data.features || []);
        } else {
          //console.error('Error fetching potential addresses:', response.status);
        }
      } else {
        setPotentialAddresses([]);
      }
    } catch (error) {
      //console.error('Error fetching potential addresses:', error);
    }
  };

 

  const fetchDirections = async () => {
    console.log('Destination Coordinates:', DestinationCoordinates);

    try {

      console.log('fetching directions');
      const currentLocationReversed = await reverseGeocode(currentLocation.latitude, currentLocation.longitude, true);

      const currentLocationEncoded = encodeURIComponent(currentLocationReversed);
      const destinationLocationEncoded = encodeURIComponent(destination);
  
      const response = await fetch( 
        `${GOOGLE_DIRECTIONS_API}?origin=${currentLocationEncoded}&destination=${destinationLocationEncoded}&key=${GOOGLE_MAPS_API_KEY}`
      );
  
      if (response.ok) {
        const data: DirectionsResponse = await response.json();
        setDirections(data);
  
        const totalDistance = data.routes[0].legs.reduce((acc, leg) => acc + leg.distance.value, 0);
        setTotalTravelDistance(totalDistance);
  
        // extract all steps from the route
        const steps: Step[] = [];
        data.routes.forEach((route, routeIndex) => {
          route.legs.forEach((leg, legIndex) => {
            leg.steps.forEach((step, stepIndex) => {
              steps.push(step);


              sendNavigationalInstructions(outputString);
            });
          });
        });


        let secondToLastStep: Step | undefined = undefined;
        if (FinalStepIndex !== null && FinalStepIndex > 0 && FinalStepIndex < steps.length) {
          const secondToLastStepIndex = FinalStepIndex - 1;
          secondToLastStep = steps[secondToLastStepIndex];
          // Use secondToLastStep.start_location or end_location based on your requirement
          console.log('Second-to-last step coordinates:', secondToLastStep.start_location);
        }

        const destinationInstruction: Step = {
      maneuver: 'destination',
      distance: { text: '0 meters', value: 0 },
      html_instructions: `You have reached your destination: ${destination}`,
      instructions: `You have reached your destination: ${destination}`,
      start_location: secondToLastStep
        ? secondToLastStep.start_location
        : { lat: 0, lng: 0 }, 
      end_location: {
        lat: DestinationCoordinates.latitude,
        lng: DestinationCoordinates.longitude,
      },
    };

      steps.push(destinationInstruction);

      setRouteSteps(steps);
      setNavigationStarted(true); // start live updates

      if (FinalStepIndex !== null && FinalStepIndex > 0) {
        // Extract coordinates of the second-to-last step
        const secondToLastStepIndex = FinalStepIndex - 1;
        const secondToLastStep = steps[secondToLastStepIndex];
        // Use secondToLastStep.start_location or end_location based on your requirement
        console.log('Second-to-last step coordinates:', secondToLastStep.start_location);
      }

          // //printing steps for debugging
          // data.routes.forEach((route, routeIndex) => {
          //   route.legs.forEach((leg, legIndex) => {
          //     leg.steps.forEach((step, stepIndex) => {
          //       console.log('Step Object:', step);
          //       console.log('Maneuver Type:', step.maneuver);

              
          //       const maneuverString = step.maneuver ? step.maneuver.toString() : ''; // Convert to string if defined
                
          //     if (maneuverString && maneuverString.includes('roundabout')) {
          //       console.log('Roundabout present')

          //       const instructionString = step.html_instructions.toString()
          //       const match = instructionString.match(/(\d+)(st|nd|rd|th)/);

          //       const newExitNumber = match ? parseInt(match[1]) : null;
          //       setExitNumber(newExitNumber);

          //       if (exitNumber !== null) {
          //         console.log('Exit Number:', newExitNumber);
          //       } else{
          //         console.log('No exit number included')
          //       }} else{
          //       console.log('No roundabout included')
          //     }
          //     });
          //   });
          // });

          // setRouteSteps(steps);
          // setNavigationStarted(true); // start live updates
        } else {
          console.error('Error fetching directions:', response.status);
        }
      } catch (error) {
        console.error('Error fetching directions:', error);
      }
    };

    const sendNavigationalInstructions = async (outputString: string) => {

      if (device && manager) {
        try {
          // Step 1: Connect to the Bluetooth device
          await device.connect();
    
          // Step 2: Discover the characteristics of the Bluetooth service
          const services = await device.discoverAllServicesAndCharacteristics();
          const characteristic = (services as any).characteristics.find(
            (c: { uuid: string; }) => c.uuid === 'YOUR_CHARACTERISTIC_UUID' // Replace with your actual characteristic UUID
          );
    
          if (characteristic) {
            // Step 3: Write data to the characteristic to send instructions
            await characteristic.writeWithResponse(outputString);
    
            console.log('Navigational instructions sent successfully:', outputString);
          } else {
            console.error('Characteristic not found.');
          }
    
          // Disconnect after sending data (if needed)
          await device.cancelConnection();
    
        } catch (error) {
          console.error('Error sending navigational instructions:', error);
        }
      } else {
        console.warn('Device or manager not available for sending instructions.');
      }
    };
  

    const updateRouteifClose = async () => {
      if (navigationStarted) {
        const nextStep = routeSteps[currentStepIndex];


        const calculatedDistanceToNextStep = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          nextStep.start_location.lat,
          nextStep.start_location.lng
        );    
        if (calculatedDistanceToNextStep < 20) { //metres threshold for update directions

        console.log('within threshold distance')

          if (!completedSteps.includes(currentStepIndex)) {
            sendNavigationalInstructions(outputString);

            setCompletedSteps([...completedSteps, currentStepIndex]);
            setDisplayedStepIndex((currentStepIndex) => nextStep);
            console.log('Completed Steps:', completedSteps);
    
            if (currentStepIndex + 1 === routeSteps.length) { 
              setFinalStepIndex(currentStepIndex + 1);
              setNavigationStarted(false); //end of trip
            }
          }
    
          if (currentStepIndex + 1 < routeSteps.length) {
            setCurrentStepIndex((currentStepIndex) => currentStepIndex + 1);
            console.log('increasing setCurrentStepIndex in updateroute')
          }
          else{
            console.log('next step is last in route')
          }
       }
        else{
          console.log('not within threshhold yet, calculated dist: ', calculatedDistanceToNextStep)
        }
        if(calculatedDistanceToNextStep !== null){ 
           setDistanceToNextStep(Math.round(calculatedDistanceToNextStep));
          }
          
      }
    };
    

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => { //calculating distance between two coordinates / waypoints
    const R = 6371; // radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const calculatedDistance = R * c; // Distance in km

    return calculatedDistance * 1000; // Convert to meters
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const handleDestinationChange = (text: string) => {
    setDestination(text);
    setNavigationStarted(false); // Reset navigation status when destination changes
    fetchPotentialAddresses();
  };

  const handleAddressSelect = (selectedAddress: string) => {
    setDestination(selectedAddress);
    setPotentialAddresses([]); // Clear address suggestions
  };
  const removeHtmlTags = (text: string) => {
    return text.replace(/<\/?[^>]+(>|$)/g, ''); // Regex to remove HTML tags
  };

  const formatDistance = (distanceValue: number, unit: string) => {
    let formattedDistance = '';
    const roundedDistance = Math.round(distanceValue);

    if (distanceValue > 1000) {
      const kilometres = (roundedDistance / 1000).toFixed(1);
      formattedDistance = `${kilometres} km`;

    } else if (distanceValue > 100){ 
      const roundedHundreds = Math.floor(roundedDistance / 100) * 100
        formattedDistance = `${roundedHundreds} m`;

    }
    else if (distanceValue > 10) {
      const roundedTens = Math.floor(roundedDistance / 10) * 10;
      formattedDistance = `${roundedTens} m`;
    }
    else {
      formattedDistance = distanceValue + ' m';
    }
    return formattedDistance;

  };

  const [instructionIcons, setInstructionIcons] = useState<{ [key: string]: any }>({
    'undefined': require('./icons/png/light/direction_turn_straight.png'),
    'turn-left': require('./icons/png/light/direction_turn_left.png'),
    'turn-right': require('./icons/png/light/direction_turn_right.png'),
    'turn-slight-left': require('./icons/png/light/direction_turn_slight_left.png'),
    'turn-slight-right': require('./icons/png/light/direction_turn_slight_right.png'),
    'turn-sharp-left': require('./icons/png/light/direction_turn_sharp_left.png'),
    'turn-sharp-right': require('./icons/png/light/direction_turn_sharp_right.png'),
    'straight': require('./icons/png/light/direction_turn_straight.png'),
    'keep-left': require('./icons/png/light/direction_fork_slight_left.png'),
    'keep-right': require('./icons/png/light/direction_fork_slight_right.png'),
    'uturn-left': require('./icons/png/light/direction_uturn_left.png'),
    'uturn-right': require('./icons/png/light/direction_uturn_right.png'),
    'merge': require('./icons/png/light/direction_merge_right.png'),
    'ramp-left': require('./icons/png/light/direction_turn_left.png'),
    'ramp-right': require('./icons/png/light/direction_turn_right.png'),
    'fork-left': require('./icons/png/light/direction_fork_left.png'),
    'fork-right': require('./icons/png/light/direction_fork_right.png'),

    'roundabout-left': require('./icons/png/light/direction_rotary_left.png'),
    'roundabout-right': require('./icons/png/light/direction_rotary_right.png'),
    'roundabout-continue': require('./icons/png/light/direction_roundabout_straight.png'),
  });


 return (
  <View style={styles.container}>
    <View style={styles.innerContainer}>

   <Text style={styles.header}>Halo Vision    Next Step in: {`${distanceToNextStep} m`}</Text>

      <TextInput //from field
        placeholder="Current Location"
        style={styles.input}
        value={startingLocation}
        onChangeText={text => setStartingLocation(text)}
      />
      <TextInput  //destination field
        style={styles.input}
        placeholder="Destination" 
        value={destination}
        onChangeText={handleDestinationChange}
      />
      {potentialAddresses.length > 0 && (
        <ScrollView style={styles.addressesContainer}>
          {potentialAddresses.map((address, index) => ( //address auto fill
            <TouchableOpacity
              key={index}
              onPress={() => { 
                forwardGeocode(address.place_name); 
                handleAddressSelect(address.place_name);
              }}>
              <Text style={styles.addressText}>{address.place_name || ''}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity onPress={() => connectToDevice(manager, selectedDevice)}>
        <Text style={{ color: 'white',
          marginTop: 3,
          padding: 4,
          backgroundColor: 'olivedrab',
          textAlign: 'center',}}> {'Connect to selected device'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={fetchDirections}>
        <Text style={{ color: 'white',
          marginTop: 3,
          padding: 4,
          backgroundColor: 'cornflowerblue',
          textAlign: 'center',}}> {'Get directions'}
        </Text>
      </TouchableOpacity>
 
    {/* <View>
      <FlatList
        data={devices}  
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedDevice(item)}>
            <Text>{item.name || 'Unnamed Device'}</Text>
          </TouchableOpacity>
        )}
      />   
      </View> */}

            {directions && displayedStepIndex < routeSteps.length && (   //solo step shown
                <View style={styles.currentStepContainer}>
                  <View style={styles.directionsIcon}>
                    {instructionIcons[routeSteps[displayedStepIndex].maneuver] ? (
                      <Image
                        source={instructionIcons[routeSteps[displayedStepIndex].maneuver]}
                        style={{ width: 30, height: 30 }}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.directionsText}>
                    {`${displayedStepIndex + 1}. ${
                      displayedStepIndex > 0
                        ? `In ${formatDistance(
                            routeSteps[displayedStepIndex - 1].distance.value,
                            routeSteps[displayedStepIndex - 1].distance.unit
                          )}, `
                        : ''
                    }${removeHtmlTags(
                      routeSteps[displayedStepIndex].html_instructions ||
                        routeSteps[displayedStepIndex].instructions ||
                        ''
                    )}`}
                  </Text>
                </View>
              )}

          <TouchableOpacity onPress={handleShowAllDirections}>
                <Text style={styles.showAllDirectionsButton}>
                  {showAllDirections ? 'Hide All Directions' : 'Show All Directions'}
                </Text>
           </TouchableOpacity>
            
          {!mapVisible ? (
            <TouchableOpacity onPress={handleShowMap}>
              <Text style={styles.hideMapButton}>
                       Hide Map
                {totalTravelDistance !== null && (
                  <Text style={styles.totalDistanceText}>
                    {'\n'}Total distance: {formatDistance(totalTravelDistance, 'm')}
                  </Text>
                )}
          </Text>
            </TouchableOpacity>) : (
                <TouchableOpacity onPress={handleShowMap}>
              <Text style={styles.showMapButton}>
                Show Map
                {totalTravelDistance !== null && (
                  <Text style={styles.totalDistanceText}>
                    {'\n'}Total distance: {formatDistance(totalTravelDistance, 'm')}
                  </Text>
                )}
              </Text>
              </TouchableOpacity>
              )}
                </View> 
     
    
         {!mapVisible && directions && (
        <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01, 
          longitudeDelta: 0.01,
        }}
      >
        <Circle
          center={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
          radius={circleRadius}
          strokeWidth={2}
          strokeColor="#4257f5"
          fillColor="rgba(66, 141, 245,0.3)" //light blue
        />

          {/* Render the route using MapViewDirections */}
          <MapViewDirections
            origin={currentLocation}
            destination={destination}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={3}
            strokeColor="red"
          />

          {/* Render markers at each step along the route */}
          {directions.routes[0]?.legs[0]?.steps?.map((step, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: step.start_location.lat,
                longitude: step.start_location.lng,
              }}
              title={`Step ${index + 1}`}
            />
          ))}
          {DestinationCoordinates.latitude && DestinationCoordinates.longitude && (
             <Marker
                 coordinate={{
                      latitude: DestinationCoordinates.latitude,
                  longitude: DestinationCoordinates.longitude,
            }}
            title="Final Destination"
            pinColor="green" />
            )}
        </MapView>
      )}
       
        <View>
      </View>

      {directions && (showAllDirections || displayedStepIndex === routeSteps.length - 1) && (
        <ScrollView style={styles.directionsContainer}>
          {directions.routes.map((route, routeIndex) => (
            <View key={routeIndex}>
              {route.legs.map((leg, legIndex) => (
                <View key={legIndex}>
                  {leg.steps.map((step, stepIndex) => {
                    // Update the outputString with the current step's formatted instruction
                    outputString += `${stepIndex + 1}. ${
                      stepIndex > 0
                        ? `In ${formatDistance(
                            leg.steps[stepIndex - 1].distance.value,
                            leg.steps[stepIndex - 1].distance.unit
                          )}, `
                        : ''
                    }${removeHtmlTags(step?.html_instructions || step?.instructions || '')}\n`;

                    return (
                      <View
                        key={stepIndex}
                        style={[
                          styles.directionsRow,
                          completedSteps.includes(currentStepIndex + stepIndex) && styles.completedStep,
                        ]}>
                        <View style={styles.directionsIcon}>
                          {instructionIcons[step.maneuver] ? (
                            <Image source={instructionIcons[step.maneuver]} style={{ width: 30, height: 30 }} />
                          ) : null}
                        </View>
                        <Text style={[styles.directionsText, { color: 'white', maxWidth: screenWidth - 60 }]}>
                          {`${stepIndex + 1}. ${
                            stepIndex > 0
                              ? `In ${formatDistance(
                                  leg.steps[stepIndex - 1].distance.value,
                                  leg.steps[stepIndex - 1].distance.unit
                                )}, `
                              : ''
                          }${removeHtmlTags(step?.html_instructions || step?.instructions || '')}`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

                  
    </View>
  );
};


const styles = StyleSheet.create({ 

  container: {
  flex: 1,
  padding: 5,
  backgroundColor: '#222', // dark
  color: 'white', 
  //justifyContent: "flex-start"  
},
innerContainer:{  
   //flex: 1,  
   width: "100%",  
   //flexDirection: "row",  
   //justifyContent: "space-between",  
   //alignItems: "center"  
}, 
  directionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  directionsIcon: {
    marginRight: 3,
  },
  directionsText: {
    marginBottom: 5,
    overflow: 'hidden', 
    fontWeight: 'bold',
    color: 'white', 
  },
  currentStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  completedStep: {
    backgroundColor: 'green', 
  },
  testButton: {
    color: 'white',
    marginTop: 10,
    padding: 10,
    backgroundColor: 'blue',
    textAlign: 'center',
  },
  showAllDirectionsButton: {
    color: 'white',
    marginTop: 5,
    padding: 7,
    backgroundColor: 'rebeccapurple',
    textAlign: 'center',
  },
  leftHalf: {
    width: '50%',
  },
  stepDistanceText: {
     width: '30%',
     fontSize: 25,
     color: 'white',
     fontWeight: 'bold',
     alignSelf: 'center',
   },
  hideMapButton: {
    color: 'white',
    marginTop: 5,
    padding: 4,
    backgroundColor: 'darkred',
    textAlign: 'center',
  },
  showMapButton: {
    color: 'white',
    marginTop: 5,
    padding: 4,
    backgroundColor: 'green',
    textAlign: 'center',
  },
  map: {
    flex: 1,
  }, 
  input: {
    color: 'white',
    borderWidth: 2,
    borderColor: '#000',
    padding: 6,
    marginBottom: 3,
  },
  directionsContainer: {
    flex: 1,
    marginTop: 10,
  },
  totalDistanceText: {
    flex: 1,
    color: 'white',
  },
  distanceHeader: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },

  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white', 
  },
  addressesContainer: {
    maxHeight: 150,
    marginBottom: 10,
    color: 'white',
  },
  addressText: {
    borderWidth: 1,
    borderColor: 'white',
    padding: 10,
    marginBottom: 5,
    color: 'white',
  },
  directionInput: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 10,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
});

export default App;
function readFileSync(arg0: string, arg1: string) {
  throw new Error('Function not implemented.');
}

