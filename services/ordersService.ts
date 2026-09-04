import { collection, doc, getDocs, setDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';

export type Order = {
  id: string;
  eventId: string;
  eventTitle: string;
  amount: number;
  paymentMethod: string;
  purchasedAt: string;
};

/**
 * Orders are written to users/{uid}/orders at purchase time (see
 * rsvpService) rather than derived from RSVPs — a single read gives the
 * whole purchase history without scanning every event's subcollection.
 */
export async function recordOrder(userId: string, order: Order): Promise<void> {
  await setDoc(doc(db, 'users', userId, 'orders', order.id), {
    eventId: order.eventId,
    eventTitle: order.eventTitle,
    amount: order.amount,
    paymentMethod: order.paymentMethod,
    purchasedAt: order.purchasedAt,
  });
}

export async function getMyOrders(userId: string): Promise<Order[]> {
  const snap = await getDocs(query(collection(db, 'users', userId, 'orders'), orderBy('purchasedAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
}