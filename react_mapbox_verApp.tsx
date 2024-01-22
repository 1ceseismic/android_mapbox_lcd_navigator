import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Button, TouchableOpacity } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {MapView } from '@rnmapbox/maps';
//import MapboxNavigation from '@sqware/react-native-mapbox-navigation';


const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoiam9lcnUiLCJhIjoiY2xyOXN6aGswMDZuaTJpcnNkdTN5Y3dtNyJ9.9hNeXSbKdMl5CXqRbVRYwQ'; // Replace with your Mapbox Access Token
const API_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places/';

interface AddressFeature {
  place_name: string;
}

const App: React.FC = () => {
  const [destination, setDestination] = useState('');
  const [potentialAddresses, setPotentialAddresses] = useState<AddressFeature[]>([]);
  const [startingLocation, setStartingLocation] = useState('');
  const [navigationStarted, setNavigationStarted] = useState(false);


  useEffect(() => {
    fetchUserLocation();
  }, []);

  const fetchUserLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        reverseGeocode(latitude, longitude);
      },
      error => {
        console.error('Error getting user location:', error);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
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

  const handleDestinationChange = (text: string) => {
    setDestination(text);
    setNavigationStarted(false); // Reset navigation status when destination changes
    fetchPotentialAddresses();
  };

  const handleAddressSelect = (selectedAddress: string) => {
    setDestination(selectedAddress);
    setPotentialAddresses([]); // Clear address suggestions
  };

  const startNavigation = () => {
    setNavigationStarted(true);
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
        placeholder="Destination"
        style={styles.input}
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
      <Text style={styles.header}>Directions</Text>
      
    
      <Button title="Use Current Location" onPress={fetchUserLocation} />
      <Button title="Get Directions" onPress={startNavigation} />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 10,
    marginBottom: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  addressesContainer: {
    maxHeight: 150,
    marginBottom: 10,
  },
  addressText: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 10,
    marginBottom: 5,
  },
  directionsContainer: {
    flex: 1,
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
