import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { mockPartners } from '@/data/mockPartners';
import { mockProducts } from '@/data/mockProducts';

/**
 * One-time helper to push the sample partner directory and shop into
 * Firestore. Safe to run repeatedly — overwrites the same doc IDs.
 * Delete this file and its DEV button once you're managing partners for real.
 */
export async function seedPartners(): Promise<{ partners: number; products: number }> {
  for (const partner of mockPartners) {
    const { id, ...rest } = partner;
    await setDoc(doc(db, 'partners', id), { ...rest, createdAt: serverTimestamp() });
  }
  for (const product of mockProducts) {
    const { id, ...rest } = product;
    await setDoc(doc(db, 'products', id), { ...rest, createdAt: serverTimestamp() });
  }
  return { partners: mockPartners.length, products: mockProducts.length };
}