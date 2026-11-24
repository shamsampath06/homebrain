import type { EmergencyContact } from '../types';

export interface SosRecipient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

/** Household SOS email recipients that always receive an alert, even if no contacts are saved. */
export const DEFAULT_SOS_RECIPIENTS: SosRecipient[] = [
  { id: 'default-sos-harley', name: 'Harley Sham', email: 'harleysham6925@gmail.com', phone: '' },
  { id: 'default-sos-sham', name: 'Sham Sampath', email: 'shamsampth06@gmail.com', phone: '' }
];

const isRealEmail = (email?: string) =>
  Boolean(email && email.includes('@') && !email.trim().toLowerCase().endsWith('.internal'));

/** Saved emergency contacts plus the default household recipients, de-duplicated by email. */
export function getSosRecipients(contacts: EmergencyContact[]): SosRecipient[] {
  const list: SosRecipient[] = [];
  const seen = new Set<string>();
  const push = (r: SosRecipient) => {
    const key = r.email ? r.email.trim().toLowerCase() : `phone:${r.phone}`;
    if (seen.has(key)) return;
    seen.add(key);
    list.push({ ...r, email: r.email.trim().toLowerCase() });
  };
  contacts.forEach(c => push({ id: c.id, name: c.name, phone: c.phone || '', email: isRealEmail(c.email) ? c.email! : '' }));
  DEFAULT_SOS_RECIPIENTS.forEach(push);
  return list;
}
