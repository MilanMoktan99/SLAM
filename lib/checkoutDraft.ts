import { FormResponses } from '@/types/models';

/**
 * Holds the attendee's answers between the checkout form and the payment
 * screen (paid events only). Same reasoning as eventDraft — this never
 * touches the URL, so responses stay out of route params.
 */
let responses: FormResponses | null = null;

export function setCheckoutResponses(next: FormResponses) {
  responses = next;
}

export function getCheckoutResponses(): FormResponses | null {
  return responses;
}

export function clearCheckoutResponses() {
  responses = null;
}