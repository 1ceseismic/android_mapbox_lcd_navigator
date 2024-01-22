import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Button, TouchableOpacity, Image, Dimensions } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
const { width: screenWidth } = Dimensions.get('window');


const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoiam9lcnUiLCJhIjoiY2xyOXN6aGswMDZuaTJpcnNkdTN5Y3dtNyJ9.9hNeXSbKdMl5CXqRbVRYwQ'
const GOOGLE_MAPS_API_KEY = 'AIzaSyBSLHFzNpmj7x5NImV6SV6JcERThBaBqvo'; 

const API_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
const GOOGLE_DIRECTIONS_API = 'https://maps.googleapis.com/maps/api/directions/json';

// const Googletokenpath = '/tokens/gg_priv.txt';
//  const Mapboxtokenpath = '/tokens/mb_public.txt';

const pathToLight = './icons/png/light/';

interface AddressFeature {
  place_name: string;
}

interface Step {
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


  useEffect(() => {
    fetchUserLocation();
  }, []);

  const [roundaboutImage, setRoundaboutImage] = useState<string | null>(null);

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


  const fetchUserLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
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
      const currentLocation = encodeURIComponent(startingLocation); // Use current location as origin
      const destinationLocation = encodeURIComponent(destination);
  
      const response = await fetch(
        `${GOOGLE_DIRECTIONS_API}?origin=${currentLocation}&destination=${destinationLocation}&key=${GOOGLE_MAPS_API_KEY}`
      );
  
      if (response.ok) {
        console.log('located sagmole')
        const data: DirectionsResponse = await response.json();
        setDirections(data);

        data.routes.forEach((route, routeIndex) => {
          route.legs.forEach((leg, legIndex) => {
            leg.steps.forEach((step, stepIndex) => {
              console.log('Step Object:', step);
              console.log('Maneuver Type:', step.maneuver);

              const maneuverString = step.maneuver ? step.maneuver.toString() : ''; // Convert to string if defined

              if (maneuverString && maneuverString.includes('roundabout')) {
                console.log('Roundabout included')
                const instructionString = step.html_instructions.toString()

                const match = instructionString.match(/(\d+)(st|nd|rd|th)/);

                const exitNumber = match ? match[1] : null;
                
                if (exitNumber !== null) {
                  console.log('Exit Number:', exitNumber);
                  const exitNumberImageMapping: Record<string, string> = {
                    '1': require('./icons/png/light/direction_roundabout_1st.png'),
                    '2': require('./icons/png/light/direction_roundabout_2nd.png'),                   
                    '3': require('./icons/png/light/direction_roundabout_3rd.png'),
                  };

                  const imageURL = exitNumberImageMapping[exitNumber] || null;
                  setRoundaboutImage(imageURL);

               }
              }
              else {
              
                console.log('No Roundabout')
              }
            });
          });
        });
        
      } else {
        console.error('Error fetching directions:', response.status);
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
    }
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
      <Text style={styles.header}>balls8cker_locat0r33</Text>

      <Button title="Get Directions" onPress={handleGetDirections} />

      {directions && (
        <ScrollView style={styles.directionsContainer}>
          {directions.routes.map((route, routeIndex) => (
            <View key={routeIndex}>
              {route.legs.map((leg, legIndex) => (
                <View key={legIndex}>
                  {leg.steps.map((step, stepIndex) => (
                    <View key={stepIndex} style={styles.directionsRow}>
                      <View style={styles.directionsIcon}>
                      {step.maneuver && instructionIcons[step.maneuver] ? (
                          <Image source={instructionIcons[step.maneuver]} style={{ width: 30, height: 30,}} />
                        ) : null}
                      </View>
                      <Text style={[styles.directionsText, { color: 'white', maxWidth: screenWidth - 60 }]}>
                        {`${stepIndex + 1}. ${stepIndex > 0 ? `In ${formatDistance(leg.steps[stepIndex - 1].distance.text, leg.steps[stepIndex - 1].distance.unit)}, ` : ''}${removeHtmlTags(step?.html_instructions || step?.instructions || '')}`}
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
  container: {
    flex: 1,
    padding: 5,
    backgroundColor: '#222', // Dark
    color: 'white',
    //backgroundColor: '#fff',
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

