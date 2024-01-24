Developing a small react-native google-maps like arduino implementation for LCD screen directions and navigation. Using react-native and expo framework primarily for android use (potentiall iOS functionality)

Using [Google's Navigation](https://developers.google.com/maps/documentation/navigation](https://developers.google.com/maps/documentation/navigation)) 
& [Android Maps SDK](https://developers.google.com/maps/documentation/android-sdk/overview)
token for route navigation, location handling etc,

Initially using Mapbox API for iOS, but android has community-managed less supported versions: [docs](https://docs.mapbox.com/android/maps/guides/)

Building:
Install x64 Android Studio, and set up a VDM for an emulator with x86_64 arch & preferably using GLES 2.0 GPU hardware 
navigate to repo directory in cmd, and assuming node.js / nvm is correctly installed + env variables are set up:
type `npm install` in order to install relevant dependencies from package.json
From same directory in terminal; type `npm start` to initialize a server (default port 8081) then "a" to run android simulator
