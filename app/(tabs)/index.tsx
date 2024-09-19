import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Alert, Image } from "react-native";
import RootLayout from "./_layout";
import Footer from "./_layout";
import Map from "@/components/Map";

import { ButtonGroup, Header, Icon, Text } from "react-native-elements";
import {
  Searchbar,
  Menu,
  Provider,
  Button,
  IconButton,
} from "react-native-paper";
import { SelectProvider } from "@mobile-reality/react-native-select-pro";
import { SafeAreaView } from "react-native-safe-area-context";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ThemedView } from "@/components/ThemedView";
import { Picker } from "@react-native-picker/picker";
import { Button as Btn } from "@react-native-material/core";
import { Step, DirectionsResponse } from "@/types";

//import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import { BleManager } from "react-native-ble-plx";
import BluetoothSerial from "react-native-bluetooth-serial-next";
import Geolocation from "react-native-geolocation-service";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Circle,
  UrlTile,
  Region,
} from "react-native-maps";
import * as Location from "expo-location";
import {
  TouchableOpacity,
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { Colors } from "@/constants/Colors";
import useColorScheme from "@/hooks/useColorScheme";
import Blur from "@/components/Blurring";
import ThemeButton from "@/components/themeButton";
import DirectionBtn from "@/components/goDirections";
import AddressDropdown from "@/components/AddressDropdown";
import MapViewDirections from "react-native-maps-directions";
import NavigationBottomSheet from "@/components/NavigationBottomSheet";
const darkMapStyle = require("@/assets/darkMapStyle.json");

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const MAPBOX_API = "https://api.mapbox.com/geocoding/v5/mapbox.places/";
const GOOGLE_DIRECTIONS_API =
  "https://maps.googleapis.com/maps/api/directions/json";

const waypointThreshold = 10;

interface AddressFeature {
  place_name: string;
}
interface BluetoothDevice {
  id: string;
  name?: string;
  address: string;
}
// interface Step {
//   maneuver: any;
//   distance: any;
//   html_instructions: string;
//   instructions: string;
//   start_location: { lat: number; lng: number };
//   end_location: { lat: number; lng: number };
// }
interface Leg {
  distance: any;
  start_location: any;
  steps: Step[];
}
interface Route {
  legs: Leg[];
}

export default function Home() {
  const [isChangingCurrentLocation, setIsChangingCurrentLocation] =
    useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);

  const [initialRegion, setInitialRegion] = useState<Region | undefined>();
  const [estimatedTimeOfArrival, setEstimatedTimeOfArrival] = useState<
    string | null
  >(null);

  const [estimatedDuration, setEstimatedDuration] = useState<number | null>();

  const [isConnected, setIsConnected] = useState(false);
  const [btStatus, setbtStatus] = useState(false);
  const [pairedDevices, setPairedDevices] = useState<BluetoothDevice[]>([]);
  const [bleManager, setBleManager] = useState<BleManager | null>(null);
  const [connectedDevice, setConnectedDevice] =
    useState<BluetoothDevice | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(
    null
  );
  const [isModalVisible, setModalVisible] = useState(false);
  const [showResultsDroppedDown, setShowResultsDroppedDown] = useState(false);

  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [FinalStepIndex, setFinalStepIndex] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [displayedStepIndex, setDisplayedStepIndex] = useState(0);
  const [distanceToNextStep, setDistanceToNextStep] = useState<number | null>(
    null
  );
  const [totalTravelDistance, setTotalTravelDistance] = useState<number | null>(
    null
  );

  const [navigationStarted, setNavigationStarted] = useState(false);
  const [directions, setDirections] = useState<DirectionsResponse | null>(null);
  const [routeSteps, setRouteSteps] = useState<Step[]>([]);
  const [circleRadius, setCircleRadius] = useState(0);

  const [outputString, setOutputString] = useState<string>(""); // State variable for outputString
  const [maneuverString, setManeuverString] = useState<string>(""); // Initialize with an empty string

  const [startingLocationEncoded, setStartingLocationEncoded] =
    useState<string>("");
  const [destinationLocationEncoded, setDestinationLocationEncoded] =
    useState<string>("");

  const [exitNumber, setExitNumber] = useState<number | null>(null);
  const [DestinationCoordinates, setDestinationCoordinates] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: 0,
    longitude: 0,
  });
  const [destination, setDestination] = useState("");
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 0,
    longitude: 0,
  });
  const [startingLocation, setStartingLocation] = useState("");
  const [potentialAddresses, setPotentialAddresses] = useState<
    AddressFeature[]
  >([]);

  const [showSearchBar, setShowSearchBar] = useState(false);

  const toggleSearchBarShow = () => {
    setIsChangingCurrentLocation(isChangingCurrentLocation ? true : true);
    setShowSearchBar(true);
  };

  const { colorScheme, toggleColorScheme } = useColorScheme();
  const currentColors = Colors[colorScheme];
  const isDark = currentColors.theme === "dark";
  // const [showDestBar, setShowDestBar] = useState(false);
  // const toggleDestinationShow = () => {
  //   setShowDestBar(!showDestBar);
  // };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  useEffect(() => {
    //runs one time on load
    checkLocationPermission();
    //checkBluetoothPermissions();
    // const manager = new BleManager();
    // setBleManager(manager);
  }, []);

  useEffect(() => {
    while (navigationStarted) {
      const locationUpdateInterval = setInterval(() => {
        fetchUserLocation();
      }, 10000); // check user location + calculation delay

      // clear the interval when the component unmounts / or navigation stops
      return () => clearInterval(locationUpdateInterval);
    }
  }, [navigationStarted, currentStepIndex, currentLocation, isConnected]);

  useEffect(() => {
    if (potentialAddresses.length < 1 && !isChangingCurrentLocation) {
      setShowSearchBar(false);
      console.log("useffect, set searchbar to false");
    }
  }, [potentialAddresses]);

  const checkLocationPermission = async () => {
    try {
      // Request foreground location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        console.log("granted");
        // Permission is granted, set desired accuracy
        // const userLocation = await Location.getCurrentPositionAsync({
        //   accuracy: Location.Accuracy.BestForNavigation,
        // });

        setLocationPermissionGranted(true);
        let location = await Location.getCurrentPositionAsync({});
        setInitialRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
        goToUserLocation;
        fetchUserLocation();
      } else {
        // Permission is not granted, show a message or handle it
        console.warn("Location permission denied.");

        Alert.alert(
          "Location Permission Required",
          "This app needs location access to provide its features. Please enable it in your settings.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error checking location permissions:", error);
    }
  };

  function error() {
    console.log("error navigator get position");
  }
  // const fetchPairedDevices = async () => {
  //   try {
  //     const devices = await BluetoothSerial.list();
  //     setPairedDevices(devices as BluetoothDevice[]);
  //   } catch (error) {
  //     console.error('Error fetching paired devices:', error);
  //   }
  // };

  // const checkBluetoothPermissions = async () => {
  //   try {
  //     BluetoothStateManager.enable().then(() => {
  //       console.log('Bluetooth is now enabled');
  //       fetchPairedDevices();

  //   });

  //     const result = await BluetoothStateManager.requestToEnable();
  //     if (result) {
  //       fetchPairedDevices();
  //     } else {
  //       console.warn('Bluetooth is not enabled.');
  //     }
  //   } catch (error) {
  //     console.error('Error checking Bluetooth permissions:', error);
  //   }
  // };

  // const connectToDevice = async (device: BluetoothDevice) => {
  //   try {
  //     if (device) {
  //       await bleManager?.destroy();

  //       await BluetoothSerial.connect(device.id);
  //      setIsConnected(true);
  //       setConnectedDevice(device);
  //     }
  //     else {

  //       console.warn('device is null in connecttodevice')
  //     }
  //   } catch (error) {

  //     console.warn('Error connecting to Bluetooth device:', error);
  //   }
  // };

  const handleStartingLocationChange = (text: string) => {
    setStartingLocation(text);
    fetchPotentialAddresses("starting");
    console.log("is changing (in addresschange): " + isChangingCurrentLocation);
  };

  const handleDestinationChange = async (text: string) => {
    setDestination(text);
    fetchPotentialAddresses("destination");
    //setIsChangingCurrentLocation(false);
  };

  const handleAddressSelect = async (selectedAddress: string) => {
    {
      console.log("selectedAddress in handleaddressSelect: " + selectedAddress);
      setDestination(selectedAddress);
      setStartingLocation(startingLocation);
      setStartingLocationEncoded(encodeURIComponent(startingLocation));
      setDestinationLocationEncoded(encodeURIComponent(selectedAddress));

      setPotentialAddresses([]);
      console.log("set starting location encoded: ", startingLocationEncoded);
      console.log(
        "set destination location encoded: ",
        destinationLocationEncoded
      );
    }
    setPotentialAddresses([]); // KEEP to Clear address suggestions
  };

  const fetchUserLocation = async () => {
    try {
      console.log("fetch user location called");

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const { latitude, longitude } = position.coords;
      setCurrentLocation({ latitude, longitude });
      reverseGeocode(latitude, longitude);
      console.log("navigationStarted: " + navigationStarted);
      if (navigationStarted) {
        //updating live
        setCircleRadius(20);

        const nextStep = routeSteps[currentStepIndex];

        const calculatedDistanceToNextStep = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          nextStep.start_location.lat,
          nextStep.start_location.lng
        );
        const roundedDistance = Math.round(calculatedDistanceToNextStep);

        if (calculatedDistanceToNextStep !== null) {
          setDistanceToNextStep(roundedDistance);
          updateRouteifClose();

          //rounded dist to next step
          console.log(
            "set distance to next step: ",
            calculatedDistanceToNextStep
          );

          const newOutputString = `${displayedStepIndex + 1}. ${
            displayedStepIndex > 0
              ? `In ${routeSteps[displayedStepIndex - 1].distance.unit(
                  routeSteps[displayedStepIndex - 1].distance.value,
                  "meters"
                )}, `
              : ""
          }${removeHtmlTags(
            nextStep.html_instructions || nextStep.instructions || ""
          )}`;

          setOutputString(newOutputString);

          // Pass the updated outputString and calculated distance to sendInstructions
          //if (connectedDevice != null)
          // sendInstructions(
          //   `${newOutputString}@${maneuverString}@${roundedDistance}m away`
          // );
        }

        console.log("Navigation started, explicitly updating user location");
        console.log("user location: ", currentLocation);
      } else {
        if (!navigationStarted) {
          ("trip has ended, do nothing");
        }
        //starting new route so search for address
        console.log("new route, reverse geocoding...");
        reverseGeocode(latitude, longitude);
      }
    } catch (error) {
      console.log("error in fetching location: " + error);
    }
  };

  const removeHtmlTags = (text: string) => {
    return text.replace(/<\/?[^>]+(>|$)/g, ""); // Regex to remove HTML tags
  };

  const formatDistance = (distanceValue: number, unit: string) => {
    let formattedDistance = "";
    const roundedDistance = Math.round(distanceValue);

    if (distanceValue > 1000) {
      const kilometres = (roundedDistance / 1000).toFixed(1);
      formattedDistance = `${kilometres} km`;
    } else if (distanceValue > 100) {
      const roundedHundreds = Math.floor(roundedDistance / 100) * 100;
      formattedDistance = `${roundedHundreds} m`;
    } else if (distanceValue > 10) {
      const roundedTens = Math.floor(roundedDistance / 10) * 10;
      formattedDistance = `${roundedTens} m`;
    } else {
      formattedDistance = distanceValue + " m";
    }
    return formattedDistance;
  };

  const endTrip = () => {
    setNavigationStarted(false);
    setRouteSteps([]);
    setDestination("");
    setPotentialAddresses([]);
  };
  const updateRouteifClose = async () => {
    if (navigationStarted) {
      const nextStep = routeSteps[currentStepIndex];

      if (
        distanceToNextStep !== null &&
        distanceToNextStep < waypointThreshold
      ) {
        //metres threshold for update directions

        console.log("within threshold distance");

        if (!completedSteps.includes(currentStepIndex)) {
          setCompletedSteps([...completedSteps, currentStepIndex]);
          setDisplayedStepIndex((currentStepIndex) => currentStepIndex + 1);
          console.log("Completed Steps:", completedSteps);

          if (currentStepIndex + 1 === routeSteps.length) {
            setFinalStepIndex(currentStepIndex + 1);
            endTrip();
          }
        }

        if (currentStepIndex + 1 < routeSteps.length) {
          setCurrentStepIndex((currentStepIndex) => currentStepIndex + 1);
          console.log("increasing setCurrentStepIndex in updateroute");
        } else {
          console.log("next step is last in route");
        }
      } else {
        console.log(
          "not within threshhold (",
          waypointThreshold,
          ") yet, calculated dist: ",
          distanceToNextStep
        );
        console.log("nextstep start: ", nextStep.start_location);
      }
    }
  };

  const fetchPotentialAddresses = async (choice: string) => {
    try {
      if (choice === "destination") {
        if (destination.length > 0) {
          const response = await fetch(
            `${MAPBOX_API}${encodeURIComponent(
              destination
            )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=NZ&types=address,poi,poi.landmark`
          );
          if (response.ok) {
            const data = await response.json();
            const placeNames = data.features;
            setPotentialAddresses(placeNames || []);
          } else {
            console.error(
              "Error fetching potential addresses:",
              response.status
            );
          }
        } else {
          console.log("destination.length was 0");
          setPotentialAddresses([]);
        }
      }

      if (choice === "starting") {
        if (startingLocation.length > 0) {
          const response = await fetch(
            `${MAPBOX_API}${encodeURIComponent(
              startingLocation
            )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=NZ`
          );

          if (response.ok) {
            const data = await response.json();
            const placeNames = data.features.map(
              (feature: { place_name: any }) => feature.place_name
            );

            setPotentialAddresses(placeNames || []);
          } else {
            console.error(
              "Error fetching potential addresses:",
              response.status
            );
          }
        } else {
          console.log("startinglocation.length was 0");
          setPotentialAddresses([]);
        }
      }
    } catch (error) {
      console.error("Error fetching potential addresses:", error);
    }
  };

  const fetchDirections = async () => {
    setIsChangingCurrentLocation(false); //resetting

    console.log("Destination Coordinates:", DestinationCoordinates);
    console.log("Current Location coords:", currentLocation);
    console.log("DESTINATION before encoding: " + destination);
    try {
      console.log("current location URI encoded: ", startingLocationEncoded);
      console.log("destinationLocatedEncoded: ", destinationLocationEncoded);

      const response = await fetch(
        `${GOOGLE_DIRECTIONS_API}?origin=${startingLocationEncoded}&destination=${destinationLocationEncoded}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (response.ok) {
        const data: DirectionsResponse = await response.json();
        setDirections(data);

        const totalDistance = data.routes[0].legs.reduce(
          (acc, leg) => acc + leg.distance.value,
          0
        );
        setTotalTravelDistance(totalDistance);

        const totalDurationInSeconds = data.routes[0].legs.reduce(
          (acc, leg) => acc + leg.duration.value,
          0
        );
        setEstimatedDuration(totalDurationInSeconds);

        const etaDate = new Date(Date.now() + totalDurationInSeconds * 1000);
        const eta = etaDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        setEstimatedTimeOfArrival(eta);

        // extract all steps from the route
        const steps: Step[] = [];
        data.routes.forEach((route, routeIndex) => {
          route.legs.forEach((leg, legIndex) => {
            leg.steps.forEach((step, stepIndex) => {
              steps.push(step);

              const maneuverString = step.maneuver
                ? step.maneuver.toString()
                : ""; // Convert to string if defined
              setManeuverString(maneuverString);
              console.log(maneuverString);
              if (maneuverString && maneuverString.includes("roundabout")) {
                const instructionString = step.html_instructions.toString();
                const match = instructionString.match(/(\d+)(st|nd|rd|th)/);

                const newExitNumber = match ? parseInt(match[0]) : null;
                setExitNumber(newExitNumber);
              }
            });
          });
        });

        let secondToLastStep: Step | undefined = undefined;
        if (
          FinalStepIndex !== null &&
          FinalStepIndex > 0 &&
          FinalStepIndex < steps.length
        ) {
          const secondToLastStepIndex = FinalStepIndex - 1;
          secondToLastStep = steps[secondToLastStepIndex];
          // Use secondToLastStep.start_location or end_location based on your requirement
          console.log(
            "Second-to-last step coordinates:",
            secondToLastStep.start_location
          );
        }

        const destinationInstruction: Step = {
          maneuver: "destination",
          distance: {
            text: "0 meters",
            value: 0,
            unit: (value: number, unit: any) => `${value} ${unit}`,
          },
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

        setRouteSteps(steps);
        console.log("route steps length: " + steps.length);
        setNavigationStarted(true); // start live updates

        if (FinalStepIndex !== null && FinalStepIndex > 0) {
          // Extract coordinates of the second-to-last step
          const secondToLastStepIndex = FinalStepIndex - 1;
          const secondToLastStep = steps[secondToLastStepIndex];
          // Use secondToLastStep.start_location or end_location based on your requirement
          console.log(
            "Second-to-last step coordinates:",
            secondToLastStep.start_location
          );
        }
      } else {
        console.error("Error fetching directions:", response.status);
      }

      setDestinationLocationEncoded("");
      console.log("set destination encoded back to empty (fetchdirections)");
    } catch (error) {
      console.error("caught error reading directions:", error);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    //calculating distance between two coordinates / waypoints
    const R = 6371; // radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const calculatedDistance = R * c; // Distance in km

    return calculatedDistance * 1000; // Convert to meters
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    //false for normal, true for watching user
    try {
      const response = await fetch(
        `${MAPBOX_API}${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const nearestAddress =
          (data.features[0] as AddressFeature).place_name || "";

        if (response.ok) {
          console.log(nearestAddress);
          setStartingLocation(nearestAddress);
          setIsChangingCurrentLocation(false);
          return nearestAddress;
        }
      }
    } catch (error) {
      console.error("Error fetching user location address:", error);
    }
    return "";
  };

  const forwardGeocode = async (placeName: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          placeName
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.results.length > 0) {
          console.log("placename", placeName);
          const location = data.results[0].geometry.location;
          const location_type = data.results[0].geometry.location_type;
          console.log("location type", location_type);

          if (
            (!isChangingCurrentLocation && location_type === "ROOFTOP") ||
            location_type === "RANGE_INTERPOLATED" ||
            location_type === "APPROXIMATE"
          ) {
            setDestinationCoordinates({
              latitude: location.lat,
              longitude: location.lng,
            });
            console.log("set destination coords in forwardGeocode");
          } else if (
            (isChangingCurrentLocation && location_type === "ROOFTOP") ||
            location_type === "RANGE_INTERPOLATED" ||
            location_type === "APPROXIMATE"
          ) {
            console.log("returned cLocation coords in forwardGeocode");
            return location;
          } else {
            console.error("Location not found");
          }
        } else {
          console.error("Error with forward geocode:", response.status);
        }
      }
    } catch (error) {
      console.error("Error with forward geocode:", error);
    }
  };

  // const sendInstructions = async (instructions: string) => {
  //   try {
  //     if (connectedDevice) {
  //       const maxSegmentLength = 32;
  //       const instructionSegments = instructions.split('@');

  //       for (const segment of instructionSegments) {
  //         const trimmedSegment = segment.trim().substring(0, maxSegmentLength);
  //         await BluetoothSerial.write(trimmedSegment + '@', connectedDevice.id);
  //         console.log('Segment sent successfully:', trimmedSegment);
  //       }

  //       console.log('Instructions sent successfully:', instructions);
  //     } else {
  //       console.warn('No device selected.');
  //     }
  //   } catch (error) {
  //     console.error('Error sending instructions:', error);
  //   }
  // };

  const [zoomLevel, setZoomLevel] = useState(10);
  const mapRef = useRef<MapView | null>(null);

  const goToUserLocation = () => {
    if (mapRef.current && initialRegion) {
      setZoomLevel(20);
      mapRef.current.animateToRegion(initialRegion, 1000);
    }
  };

  const handleDismissBottomSheet = () => {
    setShowBottomSheet(false);
  };

  return (
    <View style={styles.top}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={"google"}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic
        initialRegion={initialRegion}
        loadingBackgroundColor={currentColors.tabIconDefault}
        customMapStyle={isDark ? darkMapStyle : []}
      >
        <UrlTile
          urlTemplate={`https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?key=${GOOGLE_MAPS_API_KEY}`} //default
          // urlTemplate={`https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`} //satellite
          maximumZ={19}
          flipY={false}
        />

        <Circle
          center={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          radius={circleRadius}
          strokeWidth={3}
          strokeColor="#4257f5"
          fillColor={"rgba(66, 141, 245,0.3)"}
        />

        <MapViewDirections
          origin={startingLocation}
          destination={destination}
          apikey={GOOGLE_MAPS_API_KEY}
          strokeWidth={10}
          strokeColor={"#222f5b"}
        />
      </MapView>

      <View style={styles.overlay}>
        <View style={styles.searchContainer}>
          {showSearchBar ? (
            <View style={{}}>
              <Searchbar
                placeholder={"Starting location"}
                onChangeText={(text) => handleStartingLocationChange(text)}
                value={startingLocation}
                style={{
                  backgroundColor: currentColors.background,
                  height: 37,
                  marginVertical: 5,
                  borderRadius: 12,
                }}
                inputStyle={{ color: currentColors.text, paddingBottom: 17 }}
                placeholderTextColor={currentColors.tint}
                iconColor={currentColors.text}
                icon={() => <Entypo name="location" size={20} />}
                onIconPress={toggleSearchBarShow}
              />
              <Searchbar
                placeholder="Destination here"
                onChangeText={(text) => handleDestinationChange(text)}
                value={destination}
                style={{
                  backgroundColor: currentColors.background,
                  height: 37,
                  marginVertical: 5,
                  borderRadius: 12,
                }}
                inputStyle={{ color: currentColors.text, paddingBottom: 17 }}
                placeholderTextColor={currentColors.text}
                icon={() => <FontAwesome name="location-arrow" size={20} />}
                //clearIcon={() => <FontAwesome name="location-arrow" size={20} />}
                onClearIconPress={() => {
                  setDestination("");
                  setPotentialAddresses([]);
                }}
                loading={
                  startingLocation.length > 5 &&
                  potentialAddresses.length < 1 &&
                  destinationLocationEncoded.length < 1 &&
                  !navigationStarted
                }
              />

              {destination.length > 2 && (
                <AddressDropdown
                  isDark={isDark}
                  potentialAddresses={potentialAddresses}
                  handleAddressSelect={handleAddressSelect}
                  forwardGeocode={forwardGeocode}
                />
              )}
            </View>
          ) : (
            <View style={{}}>
              <Button
                icon="magnify"
                dark={isDark}
                onPress={toggleSearchBarShow}
                children={undefined}
                mode={"elevated"}
                style={{ backgroundColor: currentColors.background }}
              />
            </View>
          )}
        </View>
        <Button
          mode="elevated"
          onPress={() => {
            fetchDirections();
            setShowBottomSheet(true);
          }}
          style={{
            marginBottom: 5,
            flexDirection: "row",
            alignSelf: "center",
            backgroundColor: isDark
              ? currentColors.background
              : currentColors.tint,
            borderRadius: 5,
            borderColor: currentColors.opposite,
            borderBlockColor: currentColors.opposite,
          }}
          disabled={destinationLocationEncoded.length < 1}
        >
          Get Directions
        </Button>
        <View style={styles.other}>
          <ThemeButton
            isDark={isDark}
            toggleColorScheme={toggleColorScheme}
            currentColors={currentColors}
          />
          <Blur />
          <DirectionBtn isDark={isDark} hasDirections={navigationStarted} />

          <TouchableOpacity
            style={[
              styles.showButton,
              { backgroundColor: currentColors.background },
            ]}
            onPress={() => setShowBottomSheet(!showBottomSheet)}
          >
            <Text style={{ color: currentColors.opposite, fontWeight: "bold" }}>
              Show Navigation
            </Text>
          </TouchableOpacity>
          {navigationStarted && (
            <TouchableOpacity style={[styles.exitButton, {}]} onPress={endTrip}>
              <Text style={{ color: "white", fontWeight: "bold" }}>Exit</Text>
            </TouchableOpacity>
          )}
        </View>
        {routeSteps.length > 0 && showBottomSheet && (
          <View style={styles.bottomSheetContainer}>
            <NavigationBottomSheet
              totalDistance={totalTravelDistance}
              currentStep={routeSteps[currentStepIndex]}
              nextStep={
                currentStepIndex < routeSteps.length - 1
                  ? routeSteps[currentStepIndex + 1]
                  : null
              }
              onDismiss={handleDismissBottomSheet}
              isVisible={showBottomSheet}
              backgroundColour={currentColors.background}
              eta={estimatedTimeOfArrival}
              duration={estimatedDuration}
              steps={routeSteps}
              textColour={currentColors.text}
            />
          </View>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  other: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
  },

  top: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 30, // Adjust this as needed
  },
  bottomSheetContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  container: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 10,
    paddingHorizontal: 30,
  },
  searchContainer: {
    paddingBottom: 13,
    paddingHorizontal: 30,
  },
  searchbar: {
    height: 37,
    marginVertical: 5,
    borderRadius: 10,
  },
  bottomSheet: {},
  showButton: {
    position: "absolute",
    bottom: 60,
    right: 5,
    padding: 10,
    borderRadius: 5,
  },
  exitButton: {
    position: "absolute",
    bottom: 60,
    right: 350,
    padding: 15,
    borderRadius: 5,
    backgroundColor: "#a50e0f",
  },
  focusButton: {
    padding: 10,
    backgroundColor: "#000",
    borderRadius: 5,
  },
  input: {
    fontSize: 15,
    paddingBottom: 17,
  },
  headerTitle: {},
});
