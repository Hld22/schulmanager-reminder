import AsyncStorage from "@react-native-async-storage/async-storage";
import { StoredItem } from "./types";

const KEY = "school-items-v1";

export async function loadItems(): Promise<StoredItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveItems(items: StoredItem[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function mergeItems(incoming: StoredItem[]) {
  const current = await loadItems();
  const byId = new Map(current.map(x => [x.id, x]));

  for (const item of incoming) {
    const old = byId.get(item.id);
    byId.set(item.id, {
      ...item,
      completed: old?.completed ?? item.completed
    });
  }

  const merged = [...byId.values()].sort((a, b) =>
    `${a.date}-${a.time ?? ""}`.localeCompare(`${b.date}-${b.time ?? ""}`)
  );

  await saveItems(merged);
  return merged;
}
