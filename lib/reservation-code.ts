const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeReservationCode(): string {
  let body = "";
  for (let i = 0; i < 4; i++) {
    body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `SSC-${body}`;
}
