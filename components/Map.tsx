import Mapbox, { Camera, LocationPuck, MapView } from "@rnmapbox/maps";
import React from "react";
//import MapView, { Marker, Circle } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { View } from "react-native-reanimated/lib/typescript/Animated";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const mb_token =
  "sk.eyJ1Ijoiam9lcnUiLCJhIjoiY2x5bzA5amk1MGNiNjJrcHN0MnBjNmdvdCJ9.hSJeSeS94lrwb63aRGcW4w";
Mapbox.setAccessToken(mb_token);

interface Props {
  currentLocation: { latitude: number; longitude: number };
  startingLocation: string;
  distanceToNextStep: number | null;
  destination: string;
  directions: any;
  completedSteps: number[];
  waypointThreshold: number;
  DestinationCoordinates: { latitude: number; longitude: number };
}
//Mapbox.setAccessToken(process.env.MAPBOX_PUBLIC || "");

const Map: React.FC<Props> = ({
  currentLocation,
  startingLocation,
  distanceToNextStep,
  destination,
  directions,
  completedSteps,
  waypointThreshold,
  DestinationCoordinates,
}) => {
  return (
    // <MapView style={{ flex: 1 }} styleURL="mapbox://styles/mapbox/dark-v11">
    //   <Camera followUserLocation followZoomLevel={15} />
    //   <LocationPuck
    //     pulsing={{ isEnabled: true }}
    //     puckBearingEnabled
    //     puckBearing="heading"
    //   />
    // </MapView>
    <View></View>
  );
};

export default Map;
