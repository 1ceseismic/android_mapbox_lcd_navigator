export interface Distance {
  text: string;
  value: number;
  unit: (value: number, unit: any) => unknown;
}

export interface Step {
  maneuver?: string;
  distance: Distance;
  html_instructions: string;
  instructions?: string;
  start_location: {
    lat: number;
    lng: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
}

export interface DirectionsResponse {
  routes: {
    legs: {
      duration: any;
      steps: Step[];
      distance: Distance;
    }[];
  }[];
}
