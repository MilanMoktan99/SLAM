import { collection, doc, getDoc, getDocs, setDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { CartItem, OrderType, ShippingDetails, ShopOrderStatus } from '@/types/models';

export type Order = {
  id: string;
  type: OrderType;
  /** What to show in the orders list — event name, or a summary like "3 items". */
  title: string;
  amount: number;
  paymentMethod: string;
  purchasedAt: string;
  // Ticket orders
  eventId?: string;
  // Shop orders
  items?: CartItem[];
  shipping?: ShippingDetails;
  status?: ShopOrderStatus;
};

function mapOrder(docSnap: any): Order {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    // Orders written before shop support existed have no type/title — fall
    // back to the old ticket-only fields so they still display correctly.
    type: data.type ?? 'ticket',
    title: data.title ?? data.eventTitle ?? 'Order',
    amount: data.amount ?? 0,
    paymentMethod: data.paymentMethod ?? '',
    purchasedAt: data.purchasedAt ?? '',
    eventId: data.eventId || undefined,
    items: data.items || undefined,
    shipping: data.shipping || undefined,
    status: data.status || undefined,
  };
}

/** Ticket and subscription orders. */
export async function recordOrder(
  userId: string,
  order: { id: string; eventId: string; eventTitle: string; amount: number; paymentMethod: string; purchasedAt: string }
): Promise<void> {
  await setDoc(doc(db, 'users', userId, 'orders', order.id), {
    type: order.eventId ? 'ticket' : 'subscription',
    title: order.eventTitle,
    eventId: order.eventId || null,
    amount: order.amount,
    paymentMethod: order.paymentMethod,
    purchasedAt: order.purchasedAt,
  });
}

type ShopOrderInput = {
  id: string;
  items: CartItem[];
  amount: number;
  paymentMethod: string;
  purchasedAt: string;
  shipping: ShippingDetails;
};

export async function recordShopOrder(userId: string, order: ShopOrderInput): Promise<void> {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  await setDoc(doc(db, 'users', userId, 'orders', order.id), {
    type: 'shop',
    title: `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`,
    items: order.items,
    amount: order.amount,
    paymentMethod: order.paymentMethod,
    purchasedAt: order.purchasedAt,
    shipping: order.shipping,
    status: 'processing',
  });
}

export async function getMyOrders(userId: string): Promise<Order[]> {
  const snap = await getDocs(query(collection(db, 'users', userId, 'orders'), orderBy('purchasedAt', 'desc')));
  return snap.docs.map(mapOrder);
}

export async function getOrderById(userId: string, orderId: string): Promise<Order | undefined> {
  const snap = await getDoc(doc(db, 'users', userId, 'orders', orderId));
  return snap.exists() ? mapOrder(snap) : undefined;
}