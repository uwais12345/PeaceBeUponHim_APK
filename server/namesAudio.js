import { NAMES_OF_ALLAH } from '../src/services/namesOfAllah.js';

export async function getNameAudio(number) {
  if (!Number.isInteger(number) || number < 1 || number > NAMES_OF_ALLAH.length) {
    throw new RangeError('Name number must be between 1 and 99.');
  }

  const padded = String(number).padStart(3, '0');
  const response = await fetch(`https://www.islamicity.org/mediaassets/MP3/other/covers/99-names-of-Allah/${padded}.mp3`, {
    headers: { 'User-Agent': 'PeaceBeUponHimApp/1.0' },
  });
  const contentType = response.headers.get('content-type') ?? 'audio/mpeg';

  if (!response.ok) {
    throw new Error(`Arabic audio provider returned HTTP ${response.status}.`);
  }

  return {
    audio: new Uint8Array(await response.arrayBuffer()),
    contentType,
  };
}
