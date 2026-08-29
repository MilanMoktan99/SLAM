type ReminderEvent = { title: string; date: string; time: string };

let handlerConfigured = false;

/**
 * expo-notifications is loaded lazily, only when scheduleEventReminder is
 * actually called (i.e. on a real RSVP) — not at the top of this file.
 *
 * Why: as of Expo SDK 53+, Expo Go on Android blocks expo-notifications
 * entirely (not just remote push, despite what the docs say), and merely
 * *importing* the module there throws. Since this file used to be imported
 * statically all the way up through rsvpService -> the event detail screen,
 * that crash was taking down the whole screen just from opening an event
 * page, before anyone even RSVPed. A dynamic import contains the failure to
 * this one function, at the one moment it's actually needed.
 */
async function getNotificationsModule() {
  const Notifications = await import('expo-notifications');
  if (!handlerConfigured) {
    handlerConfigured = true;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
  return Notifications;
}

/**
 * Schedules a local (on-device) reminder for 9am on the day of an event.
 * Real system notification, fires even if the app is closed, no server
 * needed. Silently no-ops (rather than crashing the RSVP flow) anywhere
 * expo-notifications isn't available — currently that's Expo Go on Android;
 * it works in Expo Go on iOS, and in any development or production build on
 * either platform.
 */
export async function scheduleEventReminder(event: ReminderEvent): Promise<void> {
  try {
    const Notifications = await getNotificationsModule();

    const eventDate = parseEventDateTime(event.date, event.time);
    if (!eventDate) return;

    const reminderTime = new Date(eventDate);
    reminderTime.setHours(9, 0, 0, 0);
    if (reminderTime.getTime() <= Date.now()) return; // don't schedule for the past

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: requested } = await Notifications.requestPermissionsAsync();
      if (requested !== 'granted') return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Today: ${event.title}`,
        body: "Don't miss the chance to meet other enthusiasts like you today!",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
      },
    });
  } catch (err) {
    console.warn('Could not schedule event reminder (expected in Expo Go on Android):', err);
  }
}

function parseEventDateTime(dateStr: string, timeStr: string): Date | null {
  const startTime = timeStr.split('-')[0]?.trim() ?? '';
  const parsed = new Date(`${dateStr} ${startTime}`);
  return isNaN(parsed.getTime()) ? null : parsed;
}