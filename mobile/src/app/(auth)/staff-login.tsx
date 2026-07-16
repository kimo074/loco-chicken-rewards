import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/client";
import { fetchLocations, fetchStaffNames, verifyStaffAccessPin } from "@/api/auth";
import { Location } from "@/api/types";
import { BrandTitleStyle } from "@/constants/theme";

type StaffOption = { id: string; name: string };

export default function StaffLogin() {
  const { loginAsStaff } = useAuth();

  const [accessGranted, setAccessGranted] = useState(false);
  const [accessPin, setAccessPin] = useState("");
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessLoading, setAccessLoading] = useState(false);

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffOption | null>(null);
  const [pin, setPin] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessGranted) return;
    fetchLocations()
      .then((res) => setLocations(res.locations))
      .catch(() => setError("Could not load locations. Is the server reachable?"));
  }, [accessGranted]);

  async function onSubmitAccessPin() {
    setAccessError(null);
    setAccessLoading(true);
    try {
      await verifyStaffAccessPin(accessPin);
      setAccessGranted(true);
    } catch (err) {
      setAccessError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setAccessLoading(false);
    }
  }

  if (!accessGranted) {
    return (
      <ThemedView style={styles.container}>
        <BrandBackdrop />
        <ThemedText type="title" style={[styles.title, BrandTitleStyle]}>
          Staff access
        </ThemedText>
        <ThemedText themeColor="textSecondary">Enter the staff access PIN to continue.</ThemedText>
        <TextField
          label="Access PIN"
          value={accessPin}
          onChangeText={setAccessPin}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={8}
        />
        {accessError ? <ThemedText style={styles.error}>{accessError}</ThemedText> : null}
        <Button
          title="Continue"
          onPress={onSubmitAccessPin}
          loading={accessLoading}
          disabled={accessPin.length < 1}
        />
      </ThemedView>
    );
  }

  async function onSelectLocation(location: Location) {
    setError(null);
    setSelectedLocation(location);
    try {
      const res = await fetchStaffNames(location.id);
      setStaffOptions(res.staff);
    } catch {
      setError("Could not load staff for this location.");
    }
  }

  async function onSubmitPin() {
    if (!selectedStaff) return;
    setError(null);
    setLoading(true);
    try {
      await loginAsStaff({ staffUserId: selectedStaff.id, pin });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!selectedLocation) {
    return (
      <ThemedView style={styles.container}>
        <BrandBackdrop />
        <ThemedText type="title" style={[styles.title, BrandTitleStyle]}>
          Select your location
        </ThemedText>
        <ThemedView style={styles.list}>
          {locations.map((location) => (
            <Button
              key={location.id}
              title={location.name}
              variant="secondary"
              onPress={() => onSelectLocation(location)}
            />
          ))}
        </ThemedView>
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      </ThemedView>
    );
  }

  if (!selectedStaff) {
    return (
      <ThemedView style={styles.container}>
        <BrandBackdrop />
        <ThemedText type="title" style={[styles.title, BrandTitleStyle]}>
          Who are you?
        </ThemedText>
        <ThemedText themeColor="textSecondary">{selectedLocation.name}</ThemedText>
        <ThemedView style={styles.list}>
          {staffOptions.map((staff) => (
            <Button key={staff.id} title={staff.name} variant="secondary" onPress={() => setSelectedStaff(staff)} />
          ))}
        </ThemedView>
        <Button title="Back" variant="secondary" onPress={() => setSelectedLocation(null)} />
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <BrandBackdrop />
      <ThemedText type="title" style={[styles.title, BrandTitleStyle]}>
        Enter your PIN
      </ThemedText>
      <ThemedText themeColor="textSecondary">{selectedStaff.name}</ThemedText>
      <TextField
        label="PIN"
        value={pin}
        onChangeText={setPin}
        secureTextEntry
        keyboardType="number-pad"
        maxLength={6}
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <Button title="Log in" onPress={onSubmitPin} loading={loading} disabled={pin.length < 4} />
      <Button title="Back" variant="secondary" onPress={() => setSelectedStaff(null)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 100,
    gap: 20,
  },
  title: {
    fontSize: 32,
  },
  list: {
    gap: 12,
    backgroundColor: "transparent",
  },
  error: {
    color: "#C4392B",
  },
});
