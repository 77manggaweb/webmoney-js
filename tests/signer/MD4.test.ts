import { MD4 } from '../../src/signer/MD4';

describe('MD4', () => {
    describe('calculate', () => {
        it('should calculate MD4 hash for empty string', () => {
            const hash = MD4.calculate('');
            expect(hash).toBeInstanceOf(Uint8Array);
            expect(hash.length).toBe(16);
        });

        it('should calculate MD4 hash for simple string', () => {
            const hash = MD4.calculate('hello');
            expect(hash).toBeInstanceOf(Uint8Array);
            expect(hash.length).toBe(16);
        });

        it('should calculate consistent hash for same input', () => {
            const hash1 = MD4.calculate('test');
            const hash2 = MD4.calculate('test');
            expect(hash1).toEqual(hash2);
        });

        it('should calculate different hashes for different inputs', () => {
            const hash1 = MD4.calculate('test1');
            const hash2 = MD4.calculate('test2');
            expect(hash1).not.toEqual(hash2);
        });

        it('should handle longer strings', () => {
            const longString = 'a'.repeat(1000);
            const hash = MD4.calculate(longString);
            expect(hash).toBeInstanceOf(Uint8Array);
            expect(hash.length).toBe(16);
        });

        it('should handle Unicode characters', () => {
            const hash = MD4.calculate('Привет мир 🌍');
            expect(hash).toBeInstanceOf(Uint8Array);
            expect(hash.length).toBe(16);
        });

        it('should handle special characters', () => {
            const hash = MD4.calculate('!@#$%^&*()_+-=[]{}|;:,.<>?');
            expect(hash).toBeInstanceOf(Uint8Array);
            expect(hash.length).toBe(16);
        });
    });

    describe('calculateFromBytes', () => {
        it('should calculate hash from byte array', () => {
            const bytes = new Uint8Array([72, 101, 108, 108, 111]);
            const hash = MD4.calculateFromBytes(bytes);
            expect(hash).toBeInstanceOf(Uint8Array);
            expect(hash.length).toBe(16);
        });

        it('should calculate consistent hash for same bytes', () => {
            const bytes = new Uint8Array([1, 2, 3, 4, 5]);
            const hash1 = MD4.calculateFromBytes(bytes);
            const hash2 = MD4.calculateFromBytes(bytes);
            expect(hash1).toEqual(hash2);
        });

        it('should handle empty byte array', () => {
            const bytes = new Uint8Array([]);
            const hash = MD4.calculateFromBytes(bytes);
            expect(hash).toBeInstanceOf(Uint8Array);
            expect(hash.length).toBe(16);
        });

        it('should handle large byte arrays', () => {
            const bytes = new Uint8Array(10000);
            for (let i = 0; i < bytes.length; i++) {
                bytes[i] = i % 256;
            }
            const hash = MD4.calculateFromBytes(bytes);
            expect(hash).toBeInstanceOf(Uint8Array);
            expect(hash.length).toBe(16);
        });
    });

    describe('calculateHex', () => {
        it('should return hex string representation', () => {
            const hex = MD4.calculateHex('hello');
            expect(typeof hex).toBe('string');
            expect(hex.length).toBe(32);
            expect(/^[0-9a-f]+$/.test(hex)).toBe(true);
        });

        it('should return consistent hex for same input', () => {
            const hex1 = MD4.calculateHex('test');
            const hex2 = MD4.calculateHex('test');
            expect(hex1).toBe(hex2);
        });

        it('should return different hex for different inputs', () => {
            const hex1 = MD4.calculateHex('test1');
            const hex2 = MD4.calculateHex('test2');
            expect(hex1).not.toBe(hex2);
        });

        it('should return lowercase hex characters', () => {
            const hex = MD4.calculateHex('test');
            expect(hex).toBe(hex.toLowerCase());
        });

        it('should pad hex values with leading zeros', () => {
            const hex = MD4.calculateHex('a');
            expect(hex.length).toBe(32);
            for (let i = 0; i < hex.length; i += 2) {
                const byte = hex.substring(i, i + 2);
                expect(byte.length).toBe(2);
            }
        });

        it('should handle empty string', () => {
            const hex = MD4.calculateHex('');
            expect(hex.length).toBe(32);
            expect(/^[0-9a-f]+$/.test(hex)).toBe(true);
        });
    });

    describe('MD4 known test vectors', () => {
        it('should match RFC 1320 test vector for empty string', () => {
            const hex = MD4.calculateHex('');
            expect(hex).toBe('31d6cfe0d16ae931b73c59d7e0c089c0');
        });

        it('should match RFC 1320 test vector for "a"', () => {
            const hex = MD4.calculateHex('a');
            expect(hex).toBe('bde52cb31de33e46245e05fbdbd6fb24');
        });

        it('should match RFC 1320 test vector for "abc"', () => {
            const hex = MD4.calculateHex('abc');
            expect(hex).toBe('a448017aaf21d8525fc10ae87aa6729d');
        });

        it('should match RFC 1320 test vector for "message digest"', () => {
            const hex = MD4.calculateHex('message digest');
            expect(hex).toBe('d9130a8164549fe818874806e1c7014b');
        });

        it('should match RFC 1320 test vector for alphabet', () => {
            const hex = MD4.calculateHex('abcdefghijklmnopqrstuvwxyz');
            expect(hex).toBe('d79e1c308aa5bbcdeea8ed63df412da9');
        });

        it('should match RFC 1320 test vector for alphanumeric', () => {
            const hex = MD4.calculateHex(
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            );
            expect(hex).toBe('043f8582f241db351ce627e153e7f0e4');
        });

        it('should match RFC 1320 test vector for repeated digits', () => {
            const hex = MD4.calculateHex(
                '12345678901234567890123456789012345678901234567890123456789012345678901234567890'
            );
            expect(hex).toBe('e33b4ddc9c38f2199c3e7b164fcc0536');
        });
    });

    describe('Edge cases', () => {
        it('should handle strings with null bytes', () => {
            const str = 'test\u0000test';
            const hash = MD4.calculate(str);
            expect(hash.length).toBe(16);
        });

        it('should handle emoji in strings', () => {
            const hash = MD4.calculate('Hello 😊 World');
            expect(hash.length).toBe(16);
        });

        it('should handle strings at block boundaries (64 bytes)', () => {
            const str = 'a'.repeat(64);
            const hash = MD4.calculate(str);
            expect(hash.length).toBe(16);
        });

        it('should handle strings just over block boundary', () => {
            const str = 'a'.repeat(65);
            const hash = MD4.calculate(str);
            expect(hash.length).toBe(16);
        });

        it('should handle very long strings efficiently', () => {
            const str = 'a'.repeat(100000);
            const start = Date.now();
            const hash = MD4.calculate(str);
            const elapsed = Date.now() - start;

            expect(hash.length).toBe(16);
            expect(elapsed).toBeLessThan(5000);
        });
    });
});
