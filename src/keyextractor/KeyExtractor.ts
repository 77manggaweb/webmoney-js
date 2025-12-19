import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import { MD4 } from '../signer/MD4';

export class KeyExtractor {
    private static readonly BYTE_SIZE = 8;
    private static readonly INT32_SIZE = 32;
    private static readonly HASH_SIZE = 128;

    private static readonly MAGIC_NUMBER_SIZE = 2;
    private static readonly MARK_POSITION = 2;
    private static readonly MARK_SIZE = 2;
    private static readonly PROOF_POSITION = 4;
    private static readonly PROOF_SIZE = 16;
    private static readonly BODY_SIZE_POSITION = 20;
    private static readonly BODY_SIZE_SIZE = 4;
    private static readonly HEADER_SIZE =
        KeyExtractor.MAGIC_NUMBER_SIZE +
        KeyExtractor.MARK_SIZE +
        KeyExtractor.PROOF_SIZE +
        KeyExtractor.BODY_SIZE_SIZE;

    private static readonly D_SIZE_POSITION = 28;
    private static readonly D_SIZE_SIZE = 2;
    private static readonly D_POSITION = 30;
    private static readonly MODULUS_SIZE_SIZE = 2;

    private static readonly ID_LENGTH = 12;
    private static readonly MAXIMUM_ID = 999999999999;

    private static readonly MIN_PASSWORD_LENGTH = 1;
    private static readonly MAX_PASSWORD_LENGTH = 50;

    private static readonly MAGIC_NUMBER = new Uint8Array([0x81, 0x00]);

    private readonly keyFilePath: string;
    private readonly wmid: string;
    private readonly password: string;

    constructor(keyFilePath: string, wmid: string, password: string) {
        if (!keyFilePath) {
            throw new Error('Key file path cannot be null or empty');
        }
        if (!wmid) {
            throw new Error('WMID cannot be null or empty');
        }
        if (!password) {
            throw new Error('Password cannot be null or empty');
        }
        if (
            password.length < KeyExtractor.MIN_PASSWORD_LENGTH ||
            password.length > KeyExtractor.MAX_PASSWORD_LENGTH
        ) {
            throw new Error(
                `Password length must be between ${KeyExtractor.MIN_PASSWORD_LENGTH} and ${KeyExtractor.MAX_PASSWORD_LENGTH}`
            );
        }

        this.keyFilePath = keyFilePath;
        this.wmid = wmid;
        this.password = password;
    }

    /**
     * Extracts and decrypts the key file, returning XML representation of the RSA key
     */
    public async extract(): Promise<string> {
        const encrypted = await fs.promises.readFile(this.keyFilePath);

        if (encrypted.length === 0) {
            throw new Error('Encrypted file is empty');
        }

        for (let pos = 0; pos < KeyExtractor.MAGIC_NUMBER.length; pos++) {
            if (encrypted[pos] !== KeyExtractor.MAGIC_NUMBER[pos]) {
                throw new Error(
                    'Invalid key file format: Bad magic number. The file may be corrupted or not a valid WebMoney key file (.kwm).'
                );
            }
        }

        const idBytes = KeyExtractor.idToBytes(this.wmid);

        const passwordBuffer = iconv.encode(this.password, 'windows-1251');
        const passwordBytes = new Uint8Array(passwordBuffer);

        let decrypted = this.transform(encrypted, idBytes, passwordBytes, false);

        decrypted.fill(
            0,
            KeyExtractor.MARK_POSITION,
            KeyExtractor.MARK_POSITION + KeyExtractor.MARK_SIZE
        );

        let valid = this.check(decrypted);

        if (!valid) {
            decrypted = this.transform(encrypted, idBytes, passwordBytes, true);

            decrypted.fill(
                0,
                KeyExtractor.MARK_POSITION,
                KeyExtractor.MARK_POSITION + KeyExtractor.MARK_SIZE
            );

            valid = this.check(decrypted);

            if (!valid) {
                throw new Error(
                    'Authentication failed: Wrong WMID or password. Please verify your credentials and try again.'
                );
            }
        }

        const { modulus, d } = this.initialize(decrypted);

        const modulusString = modulus.toString('base64');
        const dString = d.toString('base64');

        return `<RSAKeyValue><Modulus>${modulusString}</Modulus><D>${dString}</D></RSAKeyValue>`;
    }

    /**
     * Converts WMID (string or number) to 12-byte array in format "000000000000"
     */
    private static idToBytes(id: string | number): Uint8Array {
        let idNum: number;

        if (typeof id === 'string') {
            const cleanedId = id.replace(/\D/g, '');
            if (!cleanedId) {
                throw new Error(`Invalid WMID: ${id}`);
            }
            idNum = parseInt(cleanedId, 10);
        } else {
            idNum = id;
        }

        if (idNum < 0 || idNum > KeyExtractor.MAXIMUM_ID) {
            throw new Error(`WMID must be between 0 and ${KeyExtractor.MAXIMUM_ID}`);
        }

        const idString = idNum.toString().padStart(KeyExtractor.ID_LENGTH, '0');
        const idBytes = iconv.encode(idString, 'windows-1251');

        if (idBytes.length !== KeyExtractor.ID_LENGTH) {
            throw new Error(`ID bytes length must be ${KeyExtractor.ID_LENGTH}`);
        }

        return new Uint8Array(idBytes);
    }

    /**
     * Transforms encrypted data using XOR with hash of id+password combination
     */
    private transform(input: Buffer, id: Uint8Array, password: Uint8Array, half: boolean): Buffer {
        if (input.length === 0) {
            throw new Error('Input cannot be empty');
        }

        if (id.length !== KeyExtractor.ID_LENGTH) {
            throw new Error(`ID length must be ${KeyExtractor.ID_LENGTH}`);
        }

        if (password.length === 0) {
            throw new Error('Password cannot be empty');
        }

        const passwordLength = half ? Math.floor(password.length / 2) : password.length;
        const combination = new Uint8Array(id.length + passwordLength);

        combination.set(id, 0);
        combination.set(password.slice(0, passwordLength), id.length);

        try {
            return this.transformWithCombination(input, combination);
        } finally {
            combination.fill(0);
        }
    }

    /**
     * Transforms input using XOR with hash of combination
     */
    private transformWithCombination(input: Buffer, combination: Uint8Array): Buffer {
        if (input.length === 0) {
            throw new Error('Input cannot be empty');
        }

        if (combination.length === 0) {
            throw new Error('Combination cannot be empty');
        }

        if (input.length <= KeyExtractor.D_POSITION) {
            throw new Error("The 'RSA' 'D' parameter is missing.");
        }

        const hash = this.computeHash(combination, 0, combination.length);
        const output = Buffer.alloc(input.length);
        input.copy(output, 0, 0, KeyExtractor.D_POSITION);

        for (let pos = KeyExtractor.D_POSITION; pos < input.length; pos++) {
            output[pos] =
                input[pos] ^
                hash[
                    (pos - KeyExtractor.D_POSITION) %
                        (KeyExtractor.HASH_SIZE / KeyExtractor.BYTE_SIZE)
                ];
        }

        return output;
    }

    /**
     * Checks if decrypted data is valid by comparing hash
     */
    private check(decrypted: Buffer): boolean {
        if (decrypted.length === 0) {
            throw new Error('Decrypted data cannot be empty');
        }

        if (decrypted.length < KeyExtractor.BODY_SIZE_POSITION + KeyExtractor.BODY_SIZE_SIZE) {
            throw new Error('Size of the body is missing.');
        }

        const view = new DataView(decrypted.buffer, decrypted.byteOffset, decrypted.length);
        const bodyLength = view.getInt32(KeyExtractor.BODY_SIZE_POSITION, true);

        if (decrypted.length - KeyExtractor.HEADER_SIZE < bodyLength) {
            throw new Error('Incorrect length of the body.');
        }

        const proof = new Uint32Array(
            KeyExtractor.PROOF_SIZE / (KeyExtractor.INT32_SIZE / KeyExtractor.BYTE_SIZE)
        );
        for (let i = 0; i < proof.length; i++) {
            proof[i] = view.getUint32(KeyExtractor.PROOF_POSITION + i * 4, true);
        }

        decrypted.fill(
            0,
            KeyExtractor.PROOF_POSITION,
            KeyExtractor.PROOF_POSITION + KeyExtractor.PROOF_SIZE
        );

        const hash = this.computeUInt32Hash(decrypted, 0, KeyExtractor.HEADER_SIZE + bodyLength);

        for (let pos = 0; pos < KeyExtractor.HASH_SIZE / KeyExtractor.INT32_SIZE; pos++) {
            if (proof[pos] !== hash[pos]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Computes MD4 hash and converts to UInt32 array
     */
    private computeUInt32Hash(value: Buffer, offset: number, count: number): Uint32Array {
        if (offset < 0 || offset > value.length) {
            throw new Error('Invalid offset');
        }

        if (count < 0 || offset + count > value.length) {
            throw new Error('Invalid count');
        }

        const bHash = this.computeHash(value, offset, count);
        const uHash = new Uint32Array(KeyExtractor.HASH_SIZE / KeyExtractor.INT32_SIZE);

        const view = new DataView(bHash.buffer, bHash.byteOffset, bHash.length);
        for (let i = 0; i < uHash.length; i++) {
            uHash[i] = view.getUint32(i * 4, true);
        }

        return uHash;
    }

    /**
     * Computes MD4 hash of value
     */
    private computeHash(value: Buffer | Uint8Array, offset: number, count: number): Uint8Array {
        if (offset < 0 || offset > value.length) {
            throw new Error('Invalid offset');
        }

        if (count < 0 || offset + count > value.length) {
            throw new Error('Invalid count');
        }

        const slice =
            value instanceof Buffer
                ? new Uint8Array(value.buffer, value.byteOffset + offset, count)
                : value.slice(offset, offset + count);

        return MD4.calculateFromBytes(slice);
    }

    /**
     * Extracts modulus and D from decrypted data
     */
    private initialize(decrypted: Buffer): { modulus: Buffer; d: Buffer } {
        if (decrypted.length === 0) {
            throw new Error('Decrypted data cannot be empty');
        }

        if (decrypted.length < KeyExtractor.D_SIZE_POSITION + KeyExtractor.D_SIZE_SIZE) {
            throw new Error("Size of the 'RSA' 'D' parameter is missing.");
        }

        const view = new DataView(decrypted.buffer, decrypted.byteOffset, decrypted.length);

        const dLength = view.getUint16(KeyExtractor.D_SIZE_POSITION, true);

        if (decrypted.length < KeyExtractor.D_POSITION + dLength) {
            throw new Error("Incorrect length of the 'RSA' 'D' parameter.");
        }

        const d = Buffer.from(
            decrypted.slice(KeyExtractor.D_POSITION, KeyExtractor.D_POSITION + dLength)
        );

        let pos = KeyExtractor.D_SIZE_POSITION + KeyExtractor.D_SIZE_SIZE + dLength;

        if (decrypted.length < pos + KeyExtractor.MODULUS_SIZE_SIZE) {
            throw new Error("Size of the 'RSA' 'Modulus' parameter is missing.");
        }

        const modulusLength = view.getUint16(pos, true);

        pos += KeyExtractor.MODULUS_SIZE_SIZE;

        if (decrypted.length < pos + modulusLength) {
            throw new Error("Incorrect length of the 'RSA' 'Modulus' parameter.");
        }

        const modulus = Buffer.from(decrypted.slice(pos, pos + modulusLength));

        return { modulus, d };
    }
}
