import { collection, doc, addDoc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Partner, ShopProduct, PartnerCategory } from '@/types/models';

function mapPartner(docSnap: any): Partner {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    logo: data.logo,
    category: data.category ?? 'other',
    description: data.description ?? '',
    website: data.website || undefined,
    perkTitle: data.perkTitle ?? '',
    perkDetails: data.perkDetails || undefined,
    perkCode: data.perkCode || undefined,
    vipOnly: !!data.vipOnly,
    createdBy: data.createdBy || undefined,
  };
}

function mapProduct(docSnap: any): ShopProduct {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    image: data.image,
    price: data.price ?? 0,
    description: data.description ?? '',
    partnerId: data.partnerId || undefined,
    partnerName: data.partnerName || undefined,
    url: data.url || undefined,
    createdBy: data.createdBy || undefined,
  };
}

export async function getPartners(): Promise<Partner[]> {
  const snap = await getDocs(collection(db, 'partners'));
  return snap.docs.map(mapPartner);
}

export async function getPartnerById(id: string): Promise<Partner | undefined> {
  const snap = await getDoc(doc(db, 'partners', id));
  return snap.exists() ? mapPartner(snap) : undefined;
}

export async function getProducts(): Promise<ShopProduct[]> {
  const snap = await getDocs(collection(db, 'products'));
  return snap.docs.map(mapProduct);
}

type CreatePartnerInput = {
  name: string;
  logo: string;
  category: PartnerCategory;
  description: string;
  website?: string;
  perkTitle: string;
  perkDetails?: string;
  perkCode?: string;
};

/** Listing a business is VIP-only — enforced in the UI at list-business.tsx. */
export async function createPartner(userId: string, input: CreatePartnerInput): Promise<string> {
  const docRef = await addDoc(collection(db, 'partners'), {
    ...input,
    website: input.website ?? null,
    perkDetails: input.perkDetails ?? null,
    perkCode: input.perkCode ?? null,
    vipOnly: false,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

type CreateProductInput = {
  name: string;
  image: string;
  price: number;
  description: string;
  partnerId?: string;
  partnerName?: string;
};

export async function createProduct(userId: string, input: CreateProductInput): Promise<string> {
  const docRef = await addDoc(collection(db, 'products'), {
    ...input,
    partnerId: input.partnerId ?? null,
    partnerName: input.partnerName ?? null,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}