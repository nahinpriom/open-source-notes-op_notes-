// Encryption utilities using Web Crypto API
// Provides AES-256-GCM encryption for local-first security

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

export class CryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoError';
  }
}

/**
 * Derive an AES key from a password using PBKDF2
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.slice(0) as unknown as ArrayBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random encryption key for session use
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a CryptoKey to a base64 string for storage
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

/**
 * Import a base64 key string back to a CryptoKey
 */
export async function importKey(keyData: string): Promise<CryptoKey> {
  const raw = base64ToArrayBuffer(keyData);
  return crypto.subtle.importKey(
    'raw',
    raw.slice(0) as unknown as ArrayBuffer,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with AES-256-GCM
 */
export async function encrypt(
  data: string,
  key: CryptoKey
): Promise<{ iv: string; ciphertext: string; tag: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(data);

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    plaintext
  );

  // For AES-GCM, the auth tag is appended to the ciphertext
  const encryptedArray = new Uint8Array(encrypted);
  const tagLength = 16;
  const ciphertext = encryptedArray.slice(0, -tagLength);
  const tag = encryptedArray.slice(-tagLength);

  return {
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertext),
    tag: arrayBufferToBase64(tag),
  };
}

/**
 * Decrypt data with AES-256-GCM
 */
export async function decrypt(
  iv: string,
  ciphertext: string,
  tag: string,
  key: CryptoKey
): Promise<string> {
  const ivArray = base64ToArrayBuffer(iv);
  const ciphertextArray = base64ToArrayBuffer(ciphertext);
  const tagArray = base64ToArrayBuffer(tag);

  // Reconstruct the encrypted data: ciphertext + auth tag
  const combined = new Uint8Array(ciphertextArray.length + tagArray.length);
  combined.set(ciphertextArray, 0);
  combined.set(tagArray, ciphertextArray.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivArray.slice(0) as unknown as ArrayBuffer },
    key,
    combined.slice(0) as unknown as ArrayBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Encrypt a note's content with a password-derived key
 */
export async function encryptNoteContent(
  content: string,
  password: string
): Promise<{ iv: string; salt: string; ciphertext: string; tag: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await deriveKey(password, salt);
  const encrypted = await encrypt(content, key);

  return {
    ...encrypted,
    salt: arrayBufferToBase64(salt),
  };
}

/**
 * Decrypt a note's content with a password
 */
export async function decryptNoteContent(
  iv: string,
  salt: string,
  ciphertext: string,
  tag: string,
  password: string
): Promise<string> {
  const saltArray = base64ToArrayBuffer(salt);
  const key = await deriveKey(password, saltArray);
  return decrypt(iv, ciphertext, tag, key);
}

/**
 * Generate a secure random password for account recovery
 */
export function generateRecoveryKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 32;
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues)
    .map((v) => chars[v % chars.length])
    .join('');
}

// Utility functions
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Hash a password using SHA-256 (for local verification only)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hash);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}
