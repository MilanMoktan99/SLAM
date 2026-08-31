import { EventCategory, EventPricingType, FormField } from '@/types/models';

export type EventDraft = {
  title: string;
  category: EventCategory;
  image: string;
  date: string;
  time: string;
  location: string;
  description: string;
  pricingType: EventPricingType;
  standardPrice?: number;
  vipPrice?: number;
  capacity: number;
  formFields: FormField[];
};

/**
 * Holds the in-progress event between the "details" step and the
 * "form builder" step. Kept in a module-level variable rather than route
 * params because the draft includes a base64 image, which is far too large
 * to pass through a URL. Cleared once the event is published.
 */
let draft: EventDraft | null = null;

export function setEventDraft(next: EventDraft) {
  draft = next;
}

export function getEventDraft(): EventDraft | null {
  return draft;
}

export function clearEventDraft() {
  draft = null;
}