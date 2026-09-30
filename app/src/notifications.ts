import * as Notifications from "expo-notifications";
import { StoredItem } from "./types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

function atLocalDate(date: Date) {
  const now = new Date();
  const d = new Date(date);
  d.setHours(7, 0, 0, 0);

  // Nicht in der Vergangenheit planen.
  if (d <= now) return null;
  return d;
}

export async function scheduleReminders(items: StoredItem[]) {
  const allowed = await requestNotificationPermission();
  if (!allowed) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  for (const item of items) {
    if (item.completed) continue;

    const due = new Date(`${item.date}T${item.time ?? "23:59:00"}`);
    if (due <= now) continue;

    if (item.type === "homework") {
      const triggerDate = atLocalDate(due);
      if (!triggerDate) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Hausaufgabe",
          body: `${item.subject ? item.subject + ": " : ""}${item.title}`
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate
        }
      });
    }

    if (item.type === "exam") {
      const reminder = new Date(due);
      reminder.setDate(reminder.getDate() - 1);
      reminder.setHours(18, 0, 0, 0);

      if (reminder > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Klassenarbeit morgen",
            body: `${item.subject ? item.subject + ": " : ""}${item.title}`
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminder
          }
        });
      }
    }
  }
}
