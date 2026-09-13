import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Universal bypass code for testing. Any account can use this instead of the
 * real emailed code.
 *
 * TODO(launch): remove this before going live — it lets anyone skip
 * verification entirely.
 */
const BYPASS_CODE = '6767';

const CODE_EXPIRY_MINUTES = 10;

/**
 * EmailJS is optional. Fill these in from your EmailJS dashboard
 * (emailjs.com → Account → API Keys, and Email Templates) via .env:
 *
 *   EXPO_PUBLIC_EMAILJS_SERVICE_ID=service_xxx
 *   EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=template_xxx
 *   EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=xxxxxxxx
 *
 * Your EmailJS template can use these variables:
 *   {{to_email}}        — recipient (put this in the template's "To Email" field)
 *   {{code}}            — the 4-digit code
 *   {{expiry_minutes}}  — how long it's valid, e.g. "10"
 *   {{expiry_time}}     — clock time it expires, e.g. "4:35 PM"
 *
 * If these aren't set, the code is logged to the Metro console instead so
 * you can still test the whole flow without signing up for anything.
 */
const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;

const emailJsConfigured = !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function sendCodeByEmail(email: string, code: string): Promise<boolean> {
  if (!emailJsConfigured) {
    // Dev fallback — no email service configured yet.
    console.log(`[verification] Code for ${email}: ${code}  (or use bypass code ${BYPASS_CODE})`);
    return false;
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,
        code,
        expiry_minutes: String(CODE_EXPIRY_MINUTES),
        expiry_time: new Date(Date.now() + CODE_EXPIRY_MINUTES * 60_000).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        }),
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Could not send the verification email. ${detail}`);
  }
  return true;
}

type SendResult = { sent: boolean; devCode?: string };

/**
 * Generates a fresh code, stores it against the user, and emails it.
 * Returns sent:false when EmailJS isn't configured, along with the code so
 * the UI can surface it during development.
 */
export async function sendVerificationCode(userId: string, email: string): Promise<SendResult> {
  const code = generateCode();

  await setDoc(
    doc(db, 'users', userId, 'private', 'verification'),
    { code, email, createdAt: serverTimestamp(), expiresAt: Date.now() + CODE_EXPIRY_MINUTES * 60_000 },
    { merge: true }
  );

  const sent = await sendCodeByEmail(email, code);
  return sent ? { sent: true } : { sent: false, devCode: code };
}

type VerifyResult = { success: boolean; message?: string };

export async function verifyCode(userId: string, entered: string): Promise<VerifyResult> {
  const trimmed = entered.trim();

  if (trimmed === BYPASS_CODE) {
    await markVerified(userId);
    return { success: true };
  }

  const snap = await getDoc(doc(db, 'users', userId, 'private', 'verification'));
  if (!snap.exists()) {
    return { success: false, message: 'No code found — try resending it.' };
  }

  const data = snap.data();
  if (data.expiresAt && Date.now() > data.expiresAt) {
    return { success: false, message: 'That code has expired. Tap resend to get a new one.' };
  }
  if (data.code !== trimmed) {
    return { success: false, message: "That code doesn't match. Please check and try again." };
  }

  await markVerified(userId);
  return { success: true };
}

async function markVerified(userId: string): Promise<void> {
  await setDoc(doc(db, 'users', userId), { emailVerified: true }, { merge: true });
}

export { BYPASS_CODE, emailJsConfigured };