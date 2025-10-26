import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { WebView } from "react-native-webview";

const ORANGE = "#FF7A00";
const API_BASE = "https://petscoop-server-production.up.railway.app";

export default function AdoptPetPage({ route, navigation }) {
  const pet = route?.params?.pet;
  const [adoptType, setAdoptType] = useState("full"); // 'full' | 'partial'
  const [creating, setCreating] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [approveUrl, setApproveUrl] = useState(null);
  const [webVisible, setWebVisible] = useState(false);
  const [webLoading, setWebLoading] = useState(true);

  const pollRef = useRef(null);

  const price = Number(pet?.pet_price || 0);

  const amountToPay = useMemo(() => {
    if (!price || isNaN(price)) return 0;
    return adoptType === "partial"
      ? Math.max(1, +(price * 0.5).toFixed(2))
      : +(+price).toFixed(2);
  }, [adoptType, price]);

  const goBack = () => navigation.goBack();

  const startPayPal = async () => {
    try {
      if (!pet?.pet_id) {
        Alert.alert("Error", "No pet selected.");
        return;
      }
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Not logged in", "Please log in again.");
        navigation.replace("LoginPage");
        return;
      }
      if (!amountToPay || amountToPay <= 0) {
        Alert.alert("Error", "Invalid amount.");
        return;
      }

      setCreating(true);
      const create = await axios.post(`${API_BASE}/create-paypal-order`, {
        amount: String(amountToPay),
      });

      if (!create.data?.success) {
        setCreating(false);
        Alert.alert("Payment Error", "Failed to create PayPal order.");
        return;
      }

      const id = create.data.id;
      const url = create.data.approveUrl;

      setOrderId(id);
      setApproveUrl(url);
      setCreating(false);

      if (!url) {
        const uid = await AsyncStorage.getItem("userId");
        await captureNow(id, uid);
        return;
      }

      setWebVisible(true);

      // 🔁 Poll for APPROVED while WebView is open
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const info = await axios.get(`${API_BASE}/paypal-order/${id}`);
          const status = info?.data?.data?.status;
          if (status === "APPROVED") {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setWebVisible(false);
            await captureNow(id, null);
          } else if (status === "COMPLETED") {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setWebVisible(false);
            Alert.alert("Success", "Payment already completed.", [
              { text: "OK", onPress: () => navigation.replace("MyAdoptedPetsPage") },
            ]);
          }
        } catch (e) {
          // ignore transient poll errors
        }
      }, 2000);
    } catch (err) {
      setCreating(false);
      Alert.alert("Error", "Could not start PayPal payment.");
    }
  };

  const captureNow = async (idOverride = null, userIdOverride = null) => {
    try {
      const userId = userIdOverride || (await AsyncStorage.getItem("userId"));
      if (!userId) {
        Alert.alert("Not logged in", "Please log in again.");
        navigation.replace("LoginPage");
        return;
      }
      const finalOrderId = idOverride || orderId;
      if (!finalOrderId) {
        Alert.alert("Error", "No PayPal order to capture.");
        return;
      }

      const cap = await axios.post(`${API_BASE}/capture-paypal-order`, {
        orderID: finalOrderId,
        user_id: Number(userId),
        pet_id: pet.pet_id,
        adopt_type: adoptType,
      });

      if (cap.data?.success) {
        setWebVisible(false);
        Alert.alert("Success", "Payment completed and pet adopted!", [
          { text: "OK", onPress: () => navigation.replace("MyAdoptedPetsPage") },
        ]);
      } else {
        Alert.alert("Payment Failed", "Could not capture PayPal order.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to capture PayPal order.");
    }
  };

  // Ensure we stop polling when modal is closed or component unmounts
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  if (!pet) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#333" }}>No pet data.</Text>
        <TouchableOpacity onPress={goBack} style={[styles.headerBtn, { marginTop: 16 }]}>
          <Text style={styles.headerBtnText}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFD9C7" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>
          <Image
            source={require("../assets/images/smallpaw.png")}
            style={{ width: 28, height: 28 }}
          />{" "}
          PETSCOOP
        </Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            goBack();
          }}
        >
          <Text style={styles.headerBtnText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Pet card */}
      <View style={styles.card}>
        <Image
          source={{ uri: pet.pet_image || "https://via.placeholder.com/200" }}
          style={styles.petImage}
        />
        <Text style={styles.petName}>{pet.pet_name}</Text>
        {!!pet.pet_desc && <Text style={styles.petDesc}>{pet.pet_desc}</Text>}

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Price:</Text>
          <Text style={styles.priceValue}>₱ {Number(price).toFixed(2)}</Text>
        </View>

        {/* Payment type selector */}
        <View style={styles.selectorRow}>
          <Text style={styles.selectorLabel}>Payment Type</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={adoptType} onValueChange={setAdoptType} mode="dropdown">
              <Picker.Item label="Full Payment" value="full" />
              <Picker.Item label="Partial (50%)" value="partial" />
            </Picker>
          </View>
        </View>

        {/* Amount to pay */}
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount to Pay:</Text>
          <Text style={styles.amountValue}>₱ {Number(amountToPay).toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payBtn, creating && { opacity: 0.6 }]}
          onPress={startPayPal}
          disabled={creating}
        >
          {creating ? <ActivityIndicator /> : <Text style={styles.payBtnText}>Pay with PayPal</Text>}
        </TouchableOpacity>
      </View>

      {/* WebView Modal for PayPal (auto-capture via polling) */}
      <Modal visible={webVisible} animationType="slide" onRequestClose={() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        setWebVisible(false);
      }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={styles.webHeader}>
            <Text style={styles.webTitle}>PayPal</Text>
            <TouchableOpacity onPress={() => {
              if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
              setWebVisible(false);
            }} style={styles.webClose}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </View>

          {approveUrl ? (
            <>
              <WebView
                source={{ uri: approveUrl }}
                onLoadStart={() => setWebLoading(true)}
                onLoadEnd={() => setWebLoading(false)}
                startInLoadingState
              />
              {webLoading && (
                <View style={styles.webLoadingOverlay}>
                  <ActivityIndicator size="large" />
                  <Text style={{ marginTop: 8 }}>Loading PayPal…</Text>
                </View>
              )}
            </>
          ) : (
            <View style={[styles.webLoadingOverlay, { justifyContent: "center" }]}>
              <Text>No approval URL.</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const ORANGE = "#FF7A00";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFD9C7",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoText: { fontSize: 35, fontWeight: "bold", color: ORANGE },
  headerBtn: {
    backgroundColor: ORANGE,
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  headerBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  card: {
    margin: 20,
    borderRadius: 16,
    backgroundColor: "#FFD9C0",
    padding: 16,
    elevation: 3,
  },
  petImage: { width: "100%", height: 220, borderRadius: 12, marginBottom: 12 },
  petName: { fontSize: 22, fontWeight: "bold", color: "#333" },
  petDesc: { marginTop: 6, color: "#555" },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    alignItems: "center",
  },
  priceLabel: { fontSize: 16, color: "#333" },
  priceValue: { fontSize: 18, fontWeight: "bold", color: ORANGE },

  selectorRow: { marginTop: 16 },
  selectorLabel: { marginBottom: 6, color: "#333", fontWeight: "600" },
  pickerWrap: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    alignItems: "center",
  },
  amountLabel: { fontSize: 16, color: "#333" },
  amountValue: { fontSize: 18, fontWeight: "bold", color: ORANGE },

  payBtn: {
    backgroundColor: "#0070BA",
    paddingVertical: 12,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 20,
  },
  payBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  webHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: ORANGE,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  webTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  webClose: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  webLoadingOverlay: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
