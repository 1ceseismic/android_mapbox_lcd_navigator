import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { ListItem } from "@rneui/themed";

interface Props {
  isDark: boolean;
  potentialAddresses: any;
  handleAddressSelect: any;
  forwardGeocode: any;
}

const AddressDropdown: React.FC<Props> = ({
  isDark,
  potentialAddresses,
  handleAddressSelect,
  forwardGeocode,
}) => {
  return (
    potentialAddresses.length > 0 && (
      <ScrollView
        style={[
          styles.addressesContainer,
          { backgroundColor: isDark ? "#151718" : "#fff" },
        ]}
      >
        {potentialAddresses.map(
          (
            address: { place_name: string },
            index: React.Key | null | undefined
          ) => (
            <ListItem
              key={index}
              onPress={() => {
                forwardGeocode(address.place_name);
                handleAddressSelect(address.place_name);
              }}
              bottomDivider
            >
              <ListItem.Content>
                <ListItem.Title>{address.place_name || ""}</ListItem.Title>
              </ListItem.Content>
            </ListItem>
          )
        )}
      </ScrollView>
    )
  );
};

const styles = StyleSheet.create({
  addressesContainer: {
    maxHeight: 300, //full list visiblity
    borderRadius: 15,
    marginHorizontal: 10,
    marginTop: 0,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
  },
});

export default AddressDropdown;
