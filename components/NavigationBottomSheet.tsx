import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";

import { Step } from "@/types"; // Assuming you have a types file

interface NavigationBottomSheetProps {
  totalDistance: number | null;
  currentStep: Step;
  nextStep: Step | null;
  onDismiss: () => void;
  isVisible: boolean;
  backgroundColour: string;
  eta: string | null;
  duration: number | null;
  steps: Step[];
  textColour: string;
}

const NavigationBottomSheet: React.FC<NavigationBottomSheetProps> = ({
  totalDistance,
  currentStep,
  nextStep,
  onDismiss,
  isVisible,
  backgroundColour,
  eta,
  duration,
  steps,
  textColour,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["20%", "22%", "30% ", "75%"], []);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const formatDistance = (meters: number | null) => {
    // Change this line
    if (meters === null) return "Unknown"; // Add this line
    if (meters < 1000) {
      return `${meters} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const renderInstructions = (step: Step) => {
    return step.html_instructions.replace(/<[^>]*>/g, "");
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "Unknown";
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const goToPreviousStep = () => {
    setCurrentStepIndex((prevIndex) => Math.max(0, prevIndex - 1));
    currentStep = steps[currentStepIndex - 1];
  };

  const goToNextStep = () => {
    console.log(steps);

    setCurrentStepIndex((prevIndex) =>
      Math.min(steps.length - 1, prevIndex + 1)
    );
    currentStep = steps[currentStepIndex + 2];
    console.log(currentStep.instructions);
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isVisible ? 1 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      //onClose={onDismiss}
      backgroundStyle={[
        styles.bottomSheetBackground,
        { backgroundColor: backgroundColour },
      ]}
    >
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={[styles.durationText, { color: textColour }]}>
            {formatDuration(duration)}
          </Text>
          <Text style={styles.subHeaderText}>
            {formatDistance(totalDistance)} • {eta}
          </Text>
        </View>
        <View style={styles.stepContainer}>
          <Text style={styles.stepNumber}>
            Step {currentStepIndex + 1} of {steps.length}
          </Text>
          <Text style={[styles.stepInstruction, { color: textColour }]}>
            {currentStep.html_instructions.replace(/<[^>]*>/g, "")}
          </Text>
          <Text style={[styles.stepDistance, { color: textColour }]}>
            {formatDistance(currentStep.distance.value)}
          </Text>
        </View>
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentStepIndex === 0 && styles.disabledButton,
            ]}
            onPress={goToPreviousStep}
            disabled={currentStepIndex === 0}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentStepIndex === steps.length - 1 && styles.disabledButton,
            ]}
            onPress={goToNextStep}
            disabled={currentStepIndex === steps.length - 1}
          >
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 4,
  },
  durationText: {
    fontSize: 23,
    fontWeight: "bold",
    //color: "#202020",
  },
  subHeaderText: {
    fontSize: 16,
    color: "#606060",
    marginTop: 4,
  },
  dismissButton: {
    alignSelf: "flex-end",
    padding: 8,
  },
  dismissButtonText: {
    color: "blue",
    fontSize: 16,
  },
  totalDistance: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  stepContainer: {
    marginBottom: 16,
  },
  stepsListContainer: {
    paddingRight: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginRight: 16,
    width: 250,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4285F4",
    marginRight: 12,
    width: 140,
    textAlign: "center",
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    color: "#202020",
    marginBottom: 4,
  },
  stepDistance: {
    fontSize: 12,
    // color: "#606060",
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  navButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
  },
});

export default NavigationBottomSheet;
