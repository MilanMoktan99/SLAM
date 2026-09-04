import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Firebase Storage now requires the Blaze (pay-as-you-go) billing plan even
 * for free-tier-sized usage, and Blaze needs a card on file — not available
 * right now. Workaround: resize the photo down small, compress it hard, and
 * store it as a base64 data URI directly inside the user's Firestore
 * document instead of as a separate Storage file. No billing plan needed.
 *
 * Trade-offs worth knowing:
 * - Firestore documents cap out at 1MB total — 400x400 keeps this
 *   comfortably under that, but there's no room for full-resolution photos.
 * - Every profile read now carries the photo's bytes with it (heavier than
 *   just a URL string) — fine at this app's scale, not ideal at large scale.
 * - Once Blaze becomes available, swap this for a real Storage upload;
 *   nothing calling this function needs to change, just what's inside it.
 */
export async function prepareProfilePhoto(localUri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 400, height: 400 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  if (!manipulated.base64) {
    throw new Error('Could not process the selected photo. Please try a different one.');
  }

  // Rough safety check against Firestore's 1MB document cap — this should
  // never realistically trigger at 400x400/0.6 compression, but fails with a
  // clear message instead of a cryptic Firestore error if it somehow does.
  const approxBytes = (manipulated.base64.length * 3) / 4;
  if (approxBytes > 700_000) {
    throw new Error('That photo is too large even after compression. Please try a different one.');
  }

  return `data:image/jpeg;base64,${manipulated.base64}`;
}

/**
 * Same base64-into-Firestore approach as above, but sized for a feed post:
 * wider (900px, aspect ratio preserved) and compressed harder, since post
 * images are displayed much larger than an avatar.
 *
 * Video is deliberately not supported here — even a few seconds of footage
 * is several MB, far past Firestore's 1MB document cap, so there's no
 * base64 workaround that fits. Video needs real file storage (Firebase
 * Storage on the Blaze plan, or an external host).
 */
export async function preparePostPhoto(localUri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 900 } }], // height omitted — keeps the original aspect ratio
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  if (!manipulated.base64) {
    throw new Error('Could not process the selected photo. Please try a different one.');
  }

  const approxBytes = (manipulated.base64.length * 3) / 4;
  if (approxBytes > 700_000) {
    throw new Error('That photo is too large even after compression. Please try a smaller one.');
  }

  return `data:image/jpeg;base64,${manipulated.base64}`;
}