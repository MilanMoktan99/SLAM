import { FormField } from '@/types/models';

/**
 * Every event form starts with these standard attendee details. Hosts can
 * remove or reorder them in the form builder, and add their own questions
 * on top (e.g. "What do you hope to get from this event?").
 */
export const defaultFormFields: FormField[] = [
  { id: 'firstName', label: 'First name', type: 'text', required: true },
  { id: 'lastName', label: 'Last name', type: 'text', required: true },
  { id: 'email', label: 'Email', type: 'email', required: true },
  { id: 'phone', label: 'Phone', type: 'phone', required: true },
  { id: 'address', label: 'Address', type: 'text', required: false },
];