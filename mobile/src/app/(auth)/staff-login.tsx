import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/client";
import { fetchLocations, fetchStaffNames } from "@/api/auth";
import { Location } from "@/api/types";

type StaffOption = { id: string; name: string };

export default function StaffLogin() {
  const { loginAsStaff } = useAuth();

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffOption | null>(null);
  const [pin, setPin] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLocations()
      .then((res) => setLocations(res.locations))
      .catch(() => setError("Could not load locations. Is the server reachable?"));
  }, []);

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
        <ThemedText type="title" style={styles.title}>
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
        <ThemedText type="title" style={styles.title}>
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
      <ThemedText type="title" style={styles.title}>
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
  },
  error: {
    color: "#C4392B",
  },
});
