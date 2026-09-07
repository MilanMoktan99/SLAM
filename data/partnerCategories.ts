import { PartnerCategory } from '@/types/models';

export const PARTNER_CATEGORIES: { key: PartnerCategory; label: string }[] = [
  { key: 'beauty', label: 'Beauty & Skin' },
  { key: 'wellness', label: 'Health & Wellness' },
  { key: 'business', label: 'Business Services' },
  { key: 'fashion', label: 'Fashion & Jewellery' },
  { key: 'food', label: 'Food & Drink' },
  { key: 'kids', label: 'Kids & Family' },
  { key: 'retreats', label: 'Retreats & Travel' },
  { key: 'home', label: 'Home & Events' },
  { key: 'other', label: 'Other' },
];

export function categoryLabel(key: PartnerCategory): string {
  return PARTNER_CATEGORIES.find((c) => c.key === key)?.label ?? 'Other';
}