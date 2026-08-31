import { doc, getDoc, updateDoc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { awardPoints } from '@/services/pointsService';
import { getDisplayProfile } from '@/services/profileService';
import { FormResponses, TicketOrder } from '@/types/models';
import { createNotification } from '@/services/notificationsService';
import { scheduleEventReminder } from '@/services/reminderService';

type ActionResult = { success: boolean; message?: string };

export async function getRsvpStatus(eventId: string, userId: string) {
  const snap = await getDoc(doc(db, 'events', eventId, 'rsvps', userId));
  if (!snap.exists()) return { isGoing: false, checkedIn: false, ticket: null as TicketOrder | null };
  const data = snap.data();
  return {
    isGoing: true,
    checkedIn: !!data.checkedIn,
    ticket: (data.ticket ?? null) as TicketOrder | null,
  };
}

/** Full RSVP record including the attendee's form answers — used by the
 * confirmation and invoice screens. */
export async function getRsvpRecord(eventId: string, userId: string) {
  const snap = await getDoc(doc(db, 'events', eventId, 'rsvps', userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    formResponses: (data.formResponses ?? {}) as FormResponses,
    ticket: (data.ticket ?? null) as TicketOrder | null,
    checkedIn: !!data.checkedIn,
  };
}

/**
 * RSVPs the given user to an event. Uses a transaction so two people RSVPing
 * for the last spot at the same moment can't both get in — Firestore
 * transactions handle that race condition for us.
 */
export async function rsvpToEvent(
  eventId: string,
  userId: string,
  formResponses: FormResponses = {},
  ticket: TicketOrder | null = null
): Promise<ActionResult> {
  const eventRef = doc(db, 'events', eventId);
  const rsvpRef = doc(db, 'events', eventId, 'rsvps', userId);

  // Denormalize name/avatar onto the RSVP doc so the attendee list doesn't
  // need extra lookups later.
  const { name: userName, avatar: userAvatar } = await getDisplayProfile(userId);

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error('Event not found.');

      const existingRsvp = await transaction.get(rsvpRef);
      if (existingRsvp.exists()) return; // already RSVP'd — no-op, not an error

      const eventData = eventDoc.data();
      const capacity = eventData.capacity ?? 0;
      const rsvpCount = eventData.rsvpCount ?? 0;
      if (rsvpCount >= capacity) {
        throw new Error('This event is full.');
      }

      transaction.set(rsvpRef, {
        userId,
        userName,
        userAvatar,
        rsvpAt: serverTimestamp(),
        checkedIn: false,
        checkedInAt: null,
        formResponses,
        ticket,
      });
      transaction.update(eventRef, { rsvpCount: increment(1) });
    });

    // Best-effort — neither of these should block the RSVP itself if they fail.
    notifyRsvpConfirmed(eventId, userId).catch((err) => console.error('Failed to create RSVP notification:', err));
    scheduleReminderForEvent(eventId).catch((err) => console.error('Failed to schedule event reminder:', err));

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message ?? 'Something went wrong RSVPing.' };
  }
}

async function notifyRsvpConfirmed(eventId: string, userId: string): Promise<void> {
  const eventSnap = await getDoc(doc(db, 'events', eventId));
  if (!eventSnap.exists()) return;
  const title = eventSnap.data().title ?? 'the event';

  await createNotification(userId, {
    type: 'rsvp_confirmed',
    title: "You're going!",
    body: `You're RSVP'd for ${title}. See you there!`,
    actionRoute: `/event/${eventId}`,
  });
}

async function scheduleReminderForEvent(eventId: string): Promise<void> {
  const eventSnap = await getDoc(doc(db, 'events', eventId));
  if (!eventSnap.exists()) return;
  const data = eventSnap.data();
  await scheduleEventReminder({ title: data.title, date: data.date, time: data.time });
}

type CheckInResult = ActionResult & { pointsEarned?: number };

/**
 * Client-triggered check-in — the guest taps this themselves, so it is NOT
 * verified attendance yet (per your requirement, that needs a host-facing
 * QR scan or "mark attended" tool, which doesn't exist yet). This exists so
 * the RSVP-vs-attendance distinction and point values are correct and ready.
 */
export async function checkInToEvent(
  eventId: string,
  userId: string,
  eventTitle: string,
  basePoints: number
): Promise<CheckInResult> {
  const rsvpRef = doc(db, 'events', eventId, 'rsvps', userId);
  const rsvpSnap = await getDoc(rsvpRef);

  if (!rsvpSnap.exists()) {
    return { success: false, message: 'You need to RSVP before checking in.' };
  }
  if (rsvpSnap.data().checkedIn) {
    return { success: false, message: "You're already checked in." };
  }

  await updateDoc(rsvpRef, { checkedIn: true, checkedInAt: serverTimestamp() });
  const earned = await awardPoints(userId, `Checked in to ${eventTitle}`, basePoints);

  return { success: true, pointsEarned: earned };
}