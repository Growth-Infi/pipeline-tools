import CryptoJS from 'crypto-js';
import { config } from './config';

const SECRET_KEY = config.encryptionKey

if (!SECRET_KEY) {
    throw new Error('ENCRYPTION_KEY is not set in your .env file');
}

export const encryptData = (data: string): string => {
    try {
        return CryptoJS.AES.encrypt(data, SECRET_KEY!).toString();
    } catch (e) {
        console.error("Encryption error:", e);
        return "";
    }
};

export const decryptData = (ciphertext: string): string => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY!);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted;
    } catch (e) {
        console.error("Decryption error:", e);
        return "";
    }
};

