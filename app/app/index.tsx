import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { API_URL } from "../src/config";
import { mergeItems, loadItems, saveItems } from "../src/storage";
import { scheduleReminders } from "../src/notifications";
import { StoredItem } from "../src/types";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(`${date}T12:00:00`));
}

export default function Home() {
  const [items, setItems] = useState<StoredItem[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadItems().then(setItems);
  }, []);

  const openItems = useMemo(
    () => items.filter(x => !x.completed),
    [items]
  );

  async function toggle(item: StoredItem) {
    const next = items.map(x =>
      x.id === item.id ? { ...x, completed: !x.completed } : x
    );
    setItems(next);
    await saveItems(next);
    await scheduleReminders(next);
  }

  async function sync() {
    if (!email || !password) {
      setMessage("Bitte Schulmanager-Benutzername/E-Mail und Passwort eingeben.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername: email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Synchronisation fehlgeschlagen.");
      }

      const merged = await mergeItems(data.items);
      setItems(merged);
      await scheduleReminders(merged);
      setMessage(`${data.items.length} Einträge synchronisiert.`);
      setPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Fehler.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={sync} />
        }
      >
        <Text style={styles.title}>Mein Schulplaner</Text>
        <Text style={styles.subtitle}>
          {openItems.length} offene Aufgaben / Arbeiten
        </Text>

        <View style={styles.loginCard}>
          <Text style={styles.cardTitle}>Schulmanager synchronisieren</Text>

          <TextInput
            style={styles.input}
            placeholder="E-Mail / Benutzername"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Passwort"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Pressable style={styles.button} onPress={sync} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Jetzt synchronisieren</Text>
            )}
          </Pressable>

          {!!message && <Text style={styles.message}>{message}</Text>}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meine Termine</Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Noch keine Daten</Text>
            <Text style={styles.emptyText}>
              Melde dich oben mit deinem Schulmanager-Konto an.
            </Text>
          </View>
        ) : (
          items.map(item => (
            <Pressable
              key={item.id}
              onPress={() => toggle(item)}
              style={[styles.item, item.completed && styles.itemDone]}
            >
              <View style={[styles.check, item.completed && styles.checkDone]}>
                {item.completed && <Text style={styles.checkText}>✓</Text>}
              </View>

              <View style={styles.itemBody}>
                <View style={styles.itemTop}>
                  <Text style={styles.date}>{formatDate(item.date)}</Text>
                  <Text style={styles.type}>
                    {item.type === "exam" ? "KLASSENARBEIT" : "HAUSAUFGABE"}
                  </Text>
                </View>

                <Text style={[styles.itemTitle, item.completed && styles.strike]}>
                  {item.title}
                </Text>

                {!!item.subject && (
                  <Text style={styles.subject}>{item.subject}</Text>
                )}

                {!!item.details && (
                  <Text style={styles.details}>{item.details}</Text>
                )}
              </View>
            </Pressable>
          ))
        )}

        <Text style={styles.hint}>
          Tipp: Tippe einen Eintrag an, um ihn abzuhaken. Die App erinnert
          dich anschließend nicht mehr daran.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7fb" },
  container: { padding: 20, paddingBottom: 50 },
  title: { fontSize: 32, fontWeight: "800", color: "#172033" },
  subtitle: { marginTop: 4, color: "#68738a", fontSize: 16 },
  loginCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    marginTop: 22,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2
  },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  input: {
    backgroundColor: "#f1f3f7",
    borderRadius: 12,
    padding: 13,
    marginBottom: 10,
    fontSize: 16
  },
  button: {
    backgroundColor: "#2f6fed",
    borderRadius: 12,
    padding: 14,
    alignItems: "center"
  },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
  message: { marginTop: 10, color: "#566176" },
  sectionHeader: { marginTop: 26, marginBottom: 10 },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#172033" },
  item: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1
  },
  itemDone: { opacity: 0.55 },
  check: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: "#c8cfdb",
    borderRadius: 14,
    marginRight: 12,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  checkDone: { backgroundColor: "#2f6fed", borderColor: "#2f6fed" },
  checkText: { color: "white", fontWeight: "900" },
  itemBody: { flex: 1 },
  itemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  date: { color: "#68738a", fontWeight: "600" },
  type: { fontSize: 10, fontWeight: "800", color: "#2f6fed" },
  itemTitle: {
    marginTop: 5,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
    color: "#172033"
  },
  strike: { textDecorationLine: "line-through" },
  subject: { marginTop: 3, color: "#5d6980", fontWeight: "600" },
  details: { marginTop: 7, color: "#68738a", lineHeight: 20 },
  empty: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 22,
    alignItems: "center"
  },
  emptyTitle: { fontSize: 18, fontWeight: "800" },
  emptyText: { marginTop: 5, color: "#68738a", textAlign: "center" },
  hint: {
    textAlign: "center",
    color: "#8791a3",
    marginTop: 20,
    lineHeight: 20
  }
});
