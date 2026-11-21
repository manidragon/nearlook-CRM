import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.VAULT_ENCRYPTION_KEY || 'default_secret_key_nearlook_agency_2026_aes256_mustbe32bytes!';

// Ensure key is exactly 32 bytes
function getValidKey(): Buffer {
  return crypto.createHash('sha256').update(SECRET_KEY).digest();
}

/**
 * Encrypt sensitive credential strings (WordPress passwords, Meta API keys, Hosting root logins)
 */
export function encryptCredential(plainText: string): { encryptedData: string; iv: string } {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getValidKey(), iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt credential');
  }
}

/**
 * Decrypt credential using stored IV and AES-256-CBC cipher
 */
export function decryptCredential(encryptedData: string, ivHex: string): string {
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getValidKey(), iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '***Decryption Failed (Invalid Key)***';
  }
}
