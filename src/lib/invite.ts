import { randomBytes } from 'crypto';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_INVITE_LENGTH = 6;

export function generateInviteCode(length: number = DEFAULT_INVITE_LENGTH): string {
  const bytes = randomBytes(length);
  let result = '';

  for (let i = 0; i < length; i += 1) {
    const index = bytes[i] % INVITE_ALPHABET.length;
    result += INVITE_ALPHABET.charAt(index);
  }

  return result;
}
