import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import { KeyExtractor } from '../../src/keyextractor/KeyExtractor';
import { MD4 } from '../../src/signer/MD4';

jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
    },
}));

describe('KeyExtractor', () => {
    const mockReadFile = fs.promises.readFile as jest.Mock;

    function createValidKeyBuffer(
        wmid: string,
        password: string,
        useHalfPassword: boolean = false
    ): Buffer {
        const MAGIC_NUMBER = [0x81, 0x00];
        const MARK = [0x01, 0x00];
        const PROOF_SIZE = 16;
        const BODY_SIZE_SIZE = 4;

        const d = Buffer.from('testD1234567890', 'utf-8');
        const modulus = Buffer.from('testModulus123456789012345678901234567890', 'utf-8');

        const dSize = d.length;
        const modulusSize = modulus.length;

        const reservedSize = 4;
        const dSizeSize = 2;
        const modulusSizeSize = 2;
        const bodySize = reservedSize + dSizeSize + dSize + modulusSizeSize + modulusSize;

        const header = Buffer.alloc(24);
        header.set(MAGIC_NUMBER, 0);
        header.set(MARK, 2);

        const body = Buffer.alloc(bodySize);
        body.fill(0, 0, reservedSize);
        body.writeUInt16LE(dSize, reservedSize);
        d.copy(body, reservedSize + dSizeSize);
        body.writeUInt16LE(modulusSize, reservedSize + dSizeSize + dSize);
        modulus.copy(body, reservedSize + dSizeSize + dSize + modulusSizeSize);

        header.writeInt32LE(bodySize, 20);

        const idBytes = iconv.encode(wmid.padStart(12, '0'), 'windows-1251');
        const passwordBytes = iconv.encode(password, 'windows-1251');
        const passwordLength = useHalfPassword
            ? Math.floor(passwordBytes.length / 2)
            : passwordBytes.length;
        const combination = new Uint8Array(idBytes.length + passwordLength);
        combination.set(idBytes, 0);
        combination.set(passwordBytes.slice(0, passwordLength), idBytes.length);

        const hash = MD4.calculateFromBytes(combination);

        const temp = Buffer.concat([header, body]);
        temp.fill(0, 4, 4 + PROOF_SIZE);
        temp.fill(0, 2, 4);

        const proofHash = MD4.calculateFromBytes(
            new Uint8Array(temp.buffer, temp.byteOffset, header.length + bodySize)
        );
        const proof = Buffer.from(proofHash.slice(0, PROOF_SIZE));

        proof.copy(header, 4);

        const encrypted = Buffer.concat([header, body]);
        const hashForXor = MD4.calculateFromBytes(combination);
        const startPos = 30;

        for (let pos = startPos; pos < encrypted.length; pos++) {
            encrypted[pos] ^= hashForXor[(pos - startPos) % (128 / 8)];
        }

        return encrypted;
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create KeyExtractor instance with valid parameters', () => {
            expect(
                () => new KeyExtractor('/path/to/key.kwm', '123456789012', 'password')
            ).not.toThrow();
        });

        it('should throw error for null or empty key file path', () => {
            expect(() => new KeyExtractor('', '123456789012', 'password')).toThrow(
                'Key file path cannot be null or empty'
            );
            expect(() => new KeyExtractor(null as any, '123456789012', 'password')).toThrow(
                'Key file path cannot be null or empty'
            );
        });

        it('should throw error for null or empty WMID', () => {
            expect(() => new KeyExtractor('/path/to/key.kwm', '', 'password')).toThrow(
                'WMID cannot be null or empty'
            );
            expect(() => new KeyExtractor('/path/to/key.kwm', null as any, 'password')).toThrow(
                'WMID cannot be null or empty'
            );
        });

        it('should throw error for null or empty password', () => {
            expect(() => new KeyExtractor('/path/to/key.kwm', '123456789012', '')).toThrow(
                'Password cannot be null or empty'
            );
            expect(() => new KeyExtractor('/path/to/key.kwm', '123456789012', null as any)).toThrow(
                'Password cannot be null or empty'
            );
        });

        it('should throw error for password too long', () => {
            const longPassword = 'a'.repeat(51);
            expect(
                () => new KeyExtractor('/path/to/key.kwm', '123456789012', longPassword)
            ).toThrow('Password length must be between 1 and 50');
        });

        it('should accept password at minimum length', () => {
            expect(() => new KeyExtractor('/path/to/key.kwm', '123456789012', 'a')).not.toThrow();
        });

        it('should accept password at maximum length', () => {
            const maxPassword = 'a'.repeat(50);
            expect(
                () => new KeyExtractor('/path/to/key.kwm', '123456789012', maxPassword)
            ).not.toThrow();
        });
    });

    describe('extract', () => {
        it('should successfully extract key with valid parameters', async () => {
            const wmid = '123456789012';
            const password = 'testpassword';
            const keyBuffer = createValidKeyBuffer(wmid, password);

            mockReadFile.mockResolvedValueOnce(keyBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', wmid, password);
            const result = await extractor.extract();

            expect(result).toContain('<RSAKeyValue>');
            expect(result).toContain('<Modulus>');
            expect(result).toContain('<D>');
            expect(result).toContain('</Modulus>');
            expect(result).toContain('</D>');
            expect(result).toContain('</RSAKeyValue>');
            expect(mockReadFile).toHaveBeenCalledWith('/path/to/key.kwm');
        });

        it('should extract key using half password when full password fails', async () => {
            const wmid = '123456789012';
            const password = 'testpassword';
            const keyBuffer = createValidKeyBuffer(wmid, password, true);

            mockReadFile.mockResolvedValueOnce(keyBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', wmid, password);
            const result = await extractor.extract();

            expect(result).toContain('<RSAKeyValue>');
            expect(result).toContain('<Modulus>');
            expect(result).toContain('<D>');
        });

        it('should throw error for empty encrypted file', async () => {
            mockReadFile.mockResolvedValueOnce(Buffer.alloc(0));

            const extractor = new KeyExtractor('/path/to/key.kwm', '123456789012', 'password');
            await expect(extractor.extract()).rejects.toThrow('Encrypted file is empty');
        });

        it('should throw error for bad magic number', async () => {
            const invalidBuffer = Buffer.from([0x00, 0x00, 0x01, 0x00]);
            mockReadFile.mockResolvedValueOnce(invalidBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', '123456789012', 'password');
            await expect(extractor.extract()).rejects.toThrow('Bad magic number.');
        });

        it('should throw error for wrong WMID', async () => {
            const wmid = '123456789012';
            const password = 'testpassword';
            const keyBuffer = createValidKeyBuffer(wmid, password);

            mockReadFile.mockResolvedValueOnce(keyBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', '999999999999', password);
            await expect(extractor.extract()).rejects.toThrow('Wrong WMID or password.');
        });

        it('should throw error for wrong password', async () => {
            const wmid = '123456789012';
            const password = 'testpassword';
            const keyBuffer = createValidKeyBuffer(wmid, password);

            mockReadFile.mockResolvedValueOnce(keyBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', wmid, 'wrongpassword');
            await expect(extractor.extract()).rejects.toThrow('Wrong WMID or password.');
        });

        it('should handle file read errors', async () => {
            mockReadFile.mockRejectedValueOnce(new Error('File not found'));

            const extractor = new KeyExtractor('/path/to/key.kwm', '123456789012', 'password');
            await expect(extractor.extract()).rejects.toThrow('File not found');
        });

        it('should handle WMID with non-numeric characters', async () => {
            const wmid = '123456789012';
            const password = 'testpassword';
            const keyBuffer = createValidKeyBuffer(wmid, password);

            mockReadFile.mockResolvedValueOnce(keyBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', 'WM-123456789012', password);
            const result = await extractor.extract();

            expect(result).toContain('<RSAKeyValue>');
        });

        it('should handle WMID as number string', async () => {
            const wmid = '123456789012';
            const password = 'testpassword';
            const keyBuffer = createValidKeyBuffer(wmid, password);

            mockReadFile.mockResolvedValueOnce(keyBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', '123456789012', password);
            const result = await extractor.extract();

            expect(result).toContain('<RSAKeyValue>');
        });

        it('should handle Cyrillic characters in password', async () => {
            const wmid = '123456789012';
            const password = 'Пароль';
            const keyBuffer = createValidKeyBuffer(wmid, password);

            mockReadFile.mockResolvedValueOnce(keyBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', wmid, password);
            const result = await extractor.extract();

            expect(result).toContain('<RSAKeyValue>');
        });

        it('should return base64 encoded modulus and D', async () => {
            const wmid = '123456789012';
            const password = 'testpassword';
            const keyBuffer = createValidKeyBuffer(wmid, password);

            mockReadFile.mockResolvedValueOnce(keyBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', wmid, password);
            const result = await extractor.extract();

            const modulusMatch = result.match(/<Modulus>(.*?)<\/Modulus>/);
            const dMatch = result.match(/<D>(.*?)<\/D>/);

            expect(modulusMatch).toBeTruthy();
            expect(dMatch).toBeTruthy();

            if (modulusMatch && dMatch) {
                const modulus = modulusMatch[1];
                const d = dMatch[1];

                expect(modulus).toBeTruthy();
                expect(d).toBeTruthy();
                expect(/^[A-Za-z0-9+/=]+$/.test(modulus)).toBe(true);
                expect(/^[A-Za-z0-9+/=]+$/.test(d)).toBe(true);
            }
        });
    });

    describe('edge cases', () => {
        it('should handle single character password', async () => {
            const wmid = '123456789012';
            const password = 'a';
            const keyBuffer = createValidKeyBuffer(wmid, password);

            mockReadFile.mockResolvedValueOnce(keyBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', wmid, password);
            const result = await extractor.extract();

            expect(result).toContain('<RSAKeyValue>');
        });

        it('should handle maximum length password', async () => {
            const wmid = '123456789012';
            const password = 'a'.repeat(50);
            const keyBuffer = createValidKeyBuffer(wmid, password);

            mockReadFile.mockResolvedValueOnce(keyBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', wmid, password);
            const result = await extractor.extract();

            expect(result).toContain('<RSAKeyValue>');
        });

        it('should handle WMID with leading zeros', async () => {
            const wmid = '000000000001';
            const password = 'testpassword';
            const keyBuffer = createValidKeyBuffer(wmid, password);

            mockReadFile.mockResolvedValueOnce(keyBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', '1', password);
            const result = await extractor.extract();

            expect(result).toContain('<RSAKeyValue>');
        });

        it('should handle special characters in password', async () => {
            const wmid = '123456789012';
            const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            const keyBuffer = createValidKeyBuffer(wmid, password);

            mockReadFile.mockResolvedValueOnce(keyBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', wmid, password);
            const result = await extractor.extract();

            expect(result).toContain('<RSAKeyValue>');
        });

        it('should handle password with spaces', async () => {
            const wmid = '123456789012';
            const password = 'my password with spaces';
            const keyBuffer = createValidKeyBuffer(wmid, password);

            mockReadFile.mockResolvedValueOnce(keyBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', wmid, password);
            const result = await extractor.extract();

            expect(result).toContain('<RSAKeyValue>');
        });

        it('should handle file path with special characters', () => {
            expect(
                () => new KeyExtractor('/path/with spaces/key.kwm', '123456789012', 'password')
            ).not.toThrow();
            expect(
                () => new KeyExtractor('/path/with-special/key.kwm', '123456789012', 'password')
            ).not.toThrow();
        });
    });

    describe('error handling', () => {
        it('should handle file system errors', async () => {
            mockReadFile.mockRejectedValueOnce(new Error('Permission denied'));

            const extractor = new KeyExtractor('/path/to/key.kwm', '123456789012', 'password');
            await expect(extractor.extract()).rejects.toThrow('Permission denied');
        });

        it('should handle buffer too small for header', async () => {
            const smallBuffer = Buffer.from([0x81, 0x00]);
            mockReadFile.mockResolvedValueOnce(smallBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', '123456789012', 'password');
            await expect(extractor.extract()).rejects.toThrow();
        });
    });

    describe('idToBytes validation', () => {
        it('should handle invalid WMID format', async () => {
            const wmid = '123456789012';
            const password = 'testpassword';
            const keyBuffer = createValidKeyBuffer(wmid, password);

            mockReadFile.mockResolvedValueOnce(keyBuffer);

            const extractor = new KeyExtractor('/path/to/key.kwm', 'ABC', password);
            await expect(extractor.extract()).rejects.toThrow();
        });
    });
});
