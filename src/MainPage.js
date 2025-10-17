import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
} from "react-native";

function MainPage({navigation}) {
    const logout = () => {
        navigation.replace("LoginPage");
    }
    const adopt = () => {
        navigation.replace("AdoptPage");
    }
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFD9C7" />

      <View style={styles.header}>
        <Text style={styles.logoText}><Image source={require('../assets/images/smallpaw.png')}/>PETSCOOP</Text>
        <TouchableOpacity style={styles.button} onPress={logout}>
                  <Text style={styles.buttonText}>
                    Log Out
                  </Text>
                </TouchableOpacity>
      </View>

      <View style={styles.centerContent}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>REPORT STRAY</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={adopt}>
          <Text style={styles.actionText}>ADOPT A PET</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ORANGE = "#FF7A00";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFD9C7",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoText: {
    fontSize: 35,
    fontWeight: "bold",
    color: ORANGE,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    borderWidth: 2,
    borderColor: "#1E90FF",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginVertical: 10,
    backgroundColor: "#fff",
    elevation: 3,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  bottomWaveContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 180,
    overflow: "hidden",
  },
  bottomWave: {
    backgroundColor: ORANGE,
    width: "200%",
    height: "200%",
    borderTopLeftRadius: 300,
    borderTopRightRadius: 300,
    position: "absolute",
    bottom: -60,
    left: -100,
  },
  buttonText: {
    color: '#b13939ff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  button: {
    backgroundColor: ORANGE,
    padding: 5,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 15,
  },
});

export default MainPage;
