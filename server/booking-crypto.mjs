const encoder = new TextEncoder();
const decoder = new TextDecoder();
function encode(bytes) { return btoa(String.fromCharCode(...bytes)); }
function decode(text) { return Uint8Array.from(atob(text), char => char.charCodeAt(0)); }
export async function createReservationCrypto(secret) {
  const raw = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  const authKey = await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return {
    async seal(data) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(data)));
      return `${encode(iv)}.${encode(new Uint8Array(encrypted))}`;
    },
    async open(value) {
      const [iv, encrypted] = value.split('.');
      return JSON.parse(decoder.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(iv) }, key, decode(encrypted))));
    },
    async auth(value) { return encode(new Uint8Array(await crypto.subtle.sign('HMAC', authKey, encoder.encode(value)))); },
  };
}
