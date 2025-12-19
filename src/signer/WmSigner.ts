import { MD4 } from './MD4';
import * as iconv from 'iconv-lite';

export class WmSigner {
    private readonly _modulus: bigint;
    private readonly _power: bigint;

    constructor(key: string) {
        const modulusMatch = key.match(/<Modulus>([^<]+)<\/Modulus>/);
        const powerMatch = key.match(/<D>([^<]+)<\/D>/);

        if (!modulusMatch || !powerMatch) {
            throw new Error('Invalid key format: missing Modulus or D element');
        }

        const modulusB64 = modulusMatch[1];
        const powerB64 = powerMatch[1];

        if (!modulusB64 || !powerB64) {
            throw new Error('Invalid key format: empty Modulus or D value');
        }

        this._modulus = this.base64ToBigInt(modulusB64, true);
        this._power = this.base64ToBigInt(powerB64, true);
    }

    private base64ToBigInt(base64: string, littleEndian: boolean = false): bigint {
        let bytes: Uint8Array;
        if (typeof Buffer !== 'undefined') {
            bytes = new Uint8Array(Buffer.from(base64, 'base64'));
        } else {
            const binaryString = atob(base64);
            bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
        }

        if (littleEndian) {
            return this.bytesToBigIntLittleEndian(bytes);
        }

        return this.bytesToBigInt(bytes);
    }

    private bytesToBigInt(bytes: Uint8Array): bigint {
        let result = BigInt(0);
        for (let i = bytes.length - 1; i >= 0; i--) {
            result = (result << BigInt(8)) | BigInt(bytes[i]);
        }
        return result;
    }

    private bytesToBigIntLittleEndian(bytes: Uint8Array): bigint {
        let result = BigInt(0);
        for (let i = 0; i < bytes.length; i++) {
            result = result | (BigInt(bytes[i]) << BigInt(i * 8));
        }
        return result;
    }

    private packLittleEndian(value: number, size: number): Uint8Array {
        const bytes = new Uint8Array(size);
        const view = new DataView(bytes.buffer);

        switch (size) {
            case 2:
                view.setUint16(0, value, true);
                break;
            case 4:
                view.setUint32(0, value, true);
                break;
            default:
                throw new Error(`Unsupported pack size: ${size}`);
        }

        return bytes;
    }

    private reverseHexBytes(hex: string): string {
        let result = '';
        for (let i = 0; i < hex.length; i += 4) {
            const chunk = hex.substring(i, i + 4);
            result = chunk + result;
        }
        return result;
    }

    private encodeString(data: string, encoding: string): Uint8Array {
        switch (encoding.toLowerCase()) {
            case 'utf-8':
                return new TextEncoder().encode(data);
            case 'windows-1251': {
                const buffer = iconv.encode(data, 'windows-1251');
                return new Uint8Array(buffer);
            }
            default:
                throw new Error(
                    `Unsupported encoding: ${encoding}. Supported encodings: utf-8, windows-1251`
                );
        }
    }

    public sign(data: string, encoding: string = 'windows-1251'): string {
        const dataBytes = this.encodeString(data, encoding);
        const md4Hash = MD4.calculateFromBytes(dataBytes);

        let base = new Uint8Array(md4Hash);

        const lengthBytes = this.packLittleEndian(base.length, 2);
        const finalBase = new Uint8Array(lengthBytes.length + base.length);
        finalBase.set(lengthBytes);
        finalBase.set(base, lengthBytes.length);

        const baseBigInt = this.bytesToBigIntLittleEndian(finalBase);

        const dec = this.modPow(baseBigInt, this._power, this._modulus);

        let hexadecimal = dec.toString(16);

        hexadecimal = '0'.repeat(132 - hexadecimal.length) + hexadecimal;

        const hexReversed = this.reverseHexBytes(hexadecimal);

        return hexReversed.toLowerCase();
    }

    private modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
        let result = BigInt(1);
        base = base % modulus;

        while (exponent > BigInt(0)) {
            if (exponent % BigInt(2) === BigInt(1)) {
                result = (result * base) % modulus;
            }
            exponent = exponent >> BigInt(1);
            base = (base * base) % modulus;
        }

        return result;
    }
}
