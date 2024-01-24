import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Button, TouchableOpacity, Image, Dimensions } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
const { width: screenWidth } = Dimensions.get('window');
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoiam9lcnUiLCJhIjoiY2xyOXN6aGswMDZuaTJpcnNkdTN5Y3dtNyJ9.9hNeXSbKdMl5CXqRbVRYwQ'
const GOOGLE_MAPS_API_KEY = 'AIzaSyBSLHFzNpmj7x5NImV6SV6JcERThBaBqvo'; 
const API_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
const GOOGLE_DIRECTIONS_API = 'https://maps.googleapis.com/maps/api/directions/json';

import MapView, {PROVIDER_GOOGLE, Polyline, Marker } from 'react-native-maps';
import {enableLatestRenderer} from 'react-native-maps';

//import MapboxDirectionsFactory from '@mapbox/mapbox-sdk/services/directions';

// const Googletokenpath = '/tokens/gg_priv.txt';
//  const Mapboxtokenpath = '/tokens/mb_public.txt';

enableLatestRenderer();

const pathToLight = './icons/png/light/';

interface AddressFeature {
  place_name: string;
}

interface Step {
  start_location: any;
  maneuver: any;
  distance: any;
  html_instructions: string;
  instructions: string;
}

interface Leg {
  steps: Step[];
}

interface Route {
  legs: Leg[];
}

interface DirectionsResponse {
  routes: Route[];
}

const App: React.FC = () => {
  const [destination, setDestination] = useState('');
  const [potentialAddresses, setPotentialAddresses] = useState<AddressFeature[]>([]);
  const [directions, setDirections] = useState<DirectionsResponse | null>(null);
  const [startingLocation, setStartingLocation] = useState('');
  const [navigationStarted, setNavigationStarted] = useState(false);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [routeSteps, setRouteSteps] = useState<Step[]>([]);
  const [distanceToNextStep, setDistanceToNextStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [displayedStepIndex, setDisplayedStepIndex] = useState(0);
  const [showAllDirections, setShowAllDirections] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]); 
  const [mapVisible, setMapVisible] = useState(false);

  
  const [currentLocation, setCurrentLocation] = useState({ latitude: 0, longitude: 0 });

  const handleShowAllDirections = () => {
    setShowAllDirections((prevValue) => !prevValue);
  };


  const handleShowMap = () => {
    setMapVisible((prevValue) => !prevValue);
  };

  useEffect(() => {
    fetchUserLocation();
  }, []);

  useEffect(() => {
    // Start monitoring the device's location for live navigation
    if (navigationStarted) {
      const locationUpdateInterval = setInterval(() => {
        fetchUserLocation();
        updateRouteIfClose();
      }, 80000);  // check user location + claculation delay
      return () => clearInterval(locationUpdateInterval);
    }
  }, [navigationStarted, currentStepIndex]);


  const fetchUserLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        reverseGeocode(latitude, longitude);
        console.log('User location: ' + latitude + ', ' + longitude)
      },
      error => {
        console.error('Error getting user location:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const nearestAddress = (data.features[0] as AddressFeature).place_name || '';
          setStartingLocation(nearestAddress);
        }
      } else {
        console.error('Error fetching user location address:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user location address:', error);
    }
  };

  const fetchPotentialAddresses = async () => {
    try {
      if (destination.length > 0) {
        const response = await fetch(
          `${API_BASE_URL}${encodeURIComponent(destination)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=NZ`
        );

        if (response.ok) {
          const data = await response.json();
          setPotentialAddresses(data.features || []);
        } else {
          console.error('Error fetching potential addresses:', response.status);
        }
      } else {
        setPotentialAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching potential addresses:', error);
    }
  };

  const handleGetDirections = async () => {
    try {
      const currentLocation = encodeURIComponent(startingLocation); 
      const destinationLocation = encodeURIComponent(destination);
  
      const response = await fetch(
        `${GOOGLE_DIRECTIONS_API}?origin=${currentLocation}&destination=${destinationLocation}&key=${GOOGLE_MAPS_API_KEY}`
      );
  
      if (response.ok) {
        const data: DirectionsResponse = await response.json();
        setDirections(data);

        // extract all steps from the route
        const steps: Step[] = [];
        data.routes.forEach((route) => {
          route.legs.forEach((leg) => {
            steps.push(...leg.steps);
            
          });
        });

          //printing steps for debugging
          data.routes.forEach((route, routeIndex) => {
            route.legs.forEach((leg, legIndex) => {
              leg.steps.forEach((step, stepIndex) => {
                console.log('Step Object:', step);
                console.log('Maneuver Type:', step.maneuver);
              });
            });
          });

        setRouteSteps(steps);
        setNavigationStarted(true); // start live updates
      } else {
        console.error('Error fetching directions:', response.status);
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
    }
  };

  const updateRouteIfClose = () => {
    if (directions && currentLocation.latitude !== 0 && currentLocation.longitude !== 0) {
      const nextStep = routeSteps[currentStepIndex];

      const calculatedDistanceToNextStep = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        nextStep.start_location.lat,
        nextStep.start_location.lng
      );

      console.log('Next Step Coordinates:', nextStep.start_location);

      if (calculatedDistanceToNextStep < 20) { // to activate the next step en route
        setCompletedSteps([...completedSteps, currentStepIndex]);
        setCurrentStepIndex((prevIndex) => prevIndex + 1);
        setDisplayedStepIndex((prevIndex) => prevIndex + 1);

        console.log('Completed Steps:', completedSteps)

        if (currentStepIndex + 1 === routeSteps.length) { //nav complete stop live updates
          setNavigationStarted(false);
        }
      }

      setDistanceToNextStep(calculatedDistanceToNextStep);
    }
  };

  const testCompletion = () => {
    setCompletedSteps([0]);
    setCurrentStepIndex(1);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    return distance * 1000; // Convert to meters
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

  const formatDistance = (distance: string, unit: string) => {
    const distanceValue = parseFloat(distance);
    if (distanceValue < 1000) {
      return `${(distanceValue)*1000}m`;
    } else {
      const distanceInKm = distanceValue / 1000;
      return `${distanceInKm.toFixed(2)} km`;
    }
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
      <TextInput
        placeholder="Current Location"
        style={styles.input}
        value={startingLocation}
        onChangeText={text => setStartingLocation(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Destination" 
        value={destination}
        onChangeText={handleDestinationChange}
      />
      {potentialAddresses.length > 0 && (
        <ScrollView style={styles.addressesContainer}>
          {potentialAddresses.map((address, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleAddressSelect(address.place_name)}
            >
              <Text style={styles.addressText}>{address.place_name || ''}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text style={styles.header}>saggym0le navig8tor</Text>
      <Button title="Get Directions" onPress={handleGetDirections} />

      <TouchableOpacity onPress={testCompletion}>
        <Text style={styles.testButton}>Test Completion</Text> 
      </TouchableOpacity>

      {directions && displayedStepIndex < routeSteps.length && (     //solo step shown
        <View style={styles.currentStepContainer}>
          <View style={styles.directionsIcon}>
            {instructionIcons[directions.routes[0].legs[0].steps[displayedStepIndex].maneuver] ? (

              <Image source={instructionIcons[directions.routes[0].legs[0].steps[displayedStepIndex].maneuver]} style={{ width: 30, height: 30 }} /> //single maneuver image displayed
            ) : null}
          </View>
          <Text style={styles.directionsText}>
            {`${displayedStepIndex + 1}. ${
              displayedStepIndex > 0
                ? `In ${formatDistance(
                    directions.routes[0].legs[0].steps[displayedStepIndex - 1].distance.text,
                    directions.routes[0].legs[0].steps[displayedStepIndex - 1].distance.unit
                  )}, `
                : ''
            }${removeHtmlTags(
              directions.routes[0].legs[0].steps[displayedStepIndex].html_instructions ||
                directions.routes[0].legs[0].steps[displayedStepIndex].instructions ||
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
          <Text style={styles.showMapButton}>Show Map</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={handleShowMap}>
          <Text style={styles.hideMapButton}>Hide Map</Text>
        </TouchableOpacity>
      )}
     
        
    {/* Map component */}
    {mapVisible && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{ ...currentLocation, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }}
        >
          {/* Draw polyline using route coordinates */}
          {routeCoordinates.length > 0 && (
            <Polyline coordinates={routeCoordinates} strokeWidth={2} strokeColor="blue" />
          )}

          {/* Markers for start and end points */}
          {routeCoordinates.length > 0 && (
            <Marker coordinate={routeCoordinates[0]} title="Start" />
          )}
          {routeCoordinates.length > 0 && (
            <Marker coordinate={routeCoordinates[routeCoordinates.length - 1]} title="End" />
          )}
        </MapView>
      )}


    {directions && (showAllDirections || displayedStepIndex === routeSteps.length - 1) && ( //all steps shown
        <ScrollView style={styles.directionsContainer}>
          {directions.routes.map((route, routeIndex) => (
            <View key={routeIndex}>
              {route.legs.map((leg, legIndex) => (
                <View key={legIndex}>
                  {leg.steps.map((step, stepIndex) => (
                    <View
                      key={stepIndex}
                      style={[ 
                        styles.directionsRow, completedSteps.includes(currentStepIndex + stepIndex) && styles.completedStep,]}>
                      <View style={styles.directionsIcon}>
                        {instructionIcons[step.maneuver] ? (
                          <Image source={instructionIcons[step.maneuver]} style={{ width: 30, height: 30 }} /> //maneuver image 
                        ) : null}
                      </View>
                      <Text style={[styles.directionsText, { color: 'white', maxWidth: screenWidth - 60 }]}>
                        {`${stepIndex + 1}. ${
                          stepIndex > 0
                            ? `In ${formatDistance(
                                leg.steps[stepIndex - 1].distance.text,
                                leg.steps[stepIndex - 1].distance.unit
                              )}, `
                            : ''
                        }${removeHtmlTags(step?.html_instructions || step?.instructions || '')}`}
                      </Text>
                    </View>
                  ))}
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
  distanceText: {
    marginTop: 10,
    fontSize: 16,
    color: 'white',
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
    marginTop: 10,
    padding: 10,
    backgroundColor: 'blue',
    textAlign: 'center',
  },
  showMapButton: {
    color: 'white',
    marginTop: 10,
    padding: 10,
    backgroundColor: 'green',
    textAlign: 'center',
  },
  hideMapButton: {
    color: 'white',
    marginTop: 10,
    padding: 10,
    backgroundColor: 'red',
    textAlign: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    padding: 5,
    backgroundColor: '#222', // dark
    color: 'white', 
  },
  input: {
    color: 'white',
    borderWidth: 1,
    borderColor: '#000',
    padding: 10,
    marginBottom: 10,
  },
  directionsContainer: {
    flex: 1,
    marginTop: 10,
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
function setShowMap(arg0: boolean) {
  throw new Error('Function not implemented.');
}

