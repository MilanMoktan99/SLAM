/** Simple referral code generator — e.g. "MILAN47". Good enough for MVP; not
 * guaranteed globally unique without a Firestore uniqueness check, but
 * collision odds are low enough to not block on for now. */
export function generateReferralCode(name: string): string {
  const base = (name.trim().split(' ')[0] || 'SLAM').toUpperCase().replace(/[^A-Z]/g, '') || 'SLAM';
  const suffix = Math.floor(10 + Math.random() * 90);
  return `${base}${suffix}`;
}