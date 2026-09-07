import { ShopProduct } from '@/types/models';

// Placeholder shop listings — replace with a Firestore "products" collection.
export const mockProducts: ShopProduct[] = [
  {
    id: 'prd-1',
    name: 'SLAM Water Bottle',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80',
    price: 35,
    description: 'Insulated stainless steel bottle with the SLAM Society emblem.',
    partnerName: 'SLAM Society',
  },
  {
    id: 'prd-2',
    name: 'SLAM Tote Bag',
    image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80',
    price: 25,
    description: 'Heavyweight canvas tote — perfect for events, markets and beach days.',
    partnerName: 'SLAM Society',
  },
  {
    id: 'prd-3',
    name: 'Gwapa Glow Serum',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80',
    price: 49,
    description: 'Vitamin C brightening serum. SLAM members get 20% off with code SLAM20.',
    partnerId: 'ptr-gwapa-beauty',
    partnerName: 'Gwapa Beauty',
  },
  {
    id: 'prd-4',
    name: 'Zoe Alexandria Signet Ring',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80',
    price: 120,
    description: 'Handcrafted gold-plated signet ring. Free cleaning kit for SLAM members.',
    partnerId: 'ptr-zoe-alexandria',
    partnerName: 'Zoe Alexandria Jewellery',
  },
  {
    id: 'prd-5',
    name: 'Sans Drinks Discovery Pack',
    image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=600&q=80',
    price: 59,
    description: 'A curated mixed case of non-alcoholic favourites to try at home.',
    partnerId: 'ptr-sans-drinks',
    partnerName: 'Sans Drinks',
  },
  {
    id: 'prd-6',
    name: 'SLAM Hat',
    image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80',
    price: 30,
    description: 'Embroidered cap in SLAM pink. Also redeemable with SLAM Points.',
    partnerName: 'SLAM Society',
  },
];