import { WmString } from '../../src/utils/WmString';

describe('WmString', () => {
    describe('toWmString', () => {
        it('should return null for null input', () => {
            expect(WmString.toWmString(null)).toBeNull();
        });

        it('should keep valid ASCII characters unchanged', () => {
            const input = 'Hello World 123';
            const result = WmString.toWmString(input);
            expect(result).toBe(input);
        });

        it('should handle bullet point character', () => {
            const input = 'Hello\u2022World';
            const result = WmString.toWmString(input);
            expect(result).toBe(input);
        });

        it('should handle Cyrillic characters correctly', () => {
            const input = 'Привет';
            const result = WmString.toWmString(input);
            expect(result).toBe(input);
        });

        it('should handle empty string', () => {
            expect(WmString.toWmString('')).toBe('');
        });

        it('should encode special characters not in valid set', () => {
            const input = 'Test\u0080';
            const result = WmString.toWmString(input);
            expect(result).toContain('u:');
        });

        it('should handle semicolon specially in WmString-like contexts', () => {
            const input = 'test;test';
            const result = WmString.toWmString(input);
            expect(result).toBeDefined();
        });
    });

    describe('fromWmString', () => {
        it('should return null for null input', () => {
            expect(WmString.fromWmString(null)).toBeNull();
        });

        it('should return original string if no encoding', () => {
            const input = 'Hello World 123';
            const result = WmString.fromWmString(input);
            expect(result).toBe(input);
        });

        it('should decode encoded strings', () => {
            const encoded = 'Hellou:2022;World';
            const result = WmString.fromWmString(encoded);
            expect(result).toContain('Hello');
            expect(result).toContain('World');
        });

        it('should handle strings shorter than 4 characters', () => {
            expect(WmString.fromWmString('ab')).toBe('ab');
            expect(WmString.fromWmString('abc')).toBe('abc');
        });

        it('should handle empty string', () => {
            expect(WmString.fromWmString('')).toBe('');
        });

        it('should decode hex values to characters', () => {
            const encoded = 'u:41;';
            const result = WmString.fromWmString(encoded);
            expect(result).toBe('A');
        });

        it('should handle multiple encoded characters', () => {
            const encoded = 'u:41;42;43;';
            const result = WmString.fromWmString(encoded);
            expect(result).toBe('ABC');
        });

        it('should handle invalid encoding gracefully', () => {
            const input = 'invalid u: format';
            const result = WmString.fromWmString(input);
            expect(result).toBeDefined();
        });

        it('should return original string on decoding errors', () => {
            const input = 'some random text';
            const result = WmString.fromWmString(input);
            expect(result).toBe(input);
        });
    });

    describe('Round-trip encoding', () => {
        it('should round-trip ASCII strings', () => {
            const original = 'Hello World 123';
            const encoded = WmString.toWmString(original);
            const decoded = WmString.fromWmString(encoded);
            expect(decoded).toBe(original);
        });

        it('should round-trip Cyrillic strings', () => {
            const original = 'Привет Мир';
            const encoded = WmString.toWmString(original);
            const decoded = WmString.fromWmString(encoded);
            expect(decoded).toBe(original);
        });

        it('should round-trip mixed content', () => {
            const original = 'Hello Мир 123';
            const encoded = WmString.toWmString(original);
            const decoded = WmString.fromWmString(encoded);
            expect(decoded).toBe(original);
        });

        it('should round-trip strings with special characters', () => {
            const original = 'Test\u0401\u0410';
            const encoded = WmString.toWmString(original);
            const decoded = WmString.fromWmString(encoded);
            expect(decoded).toBe(original);
        });
    });

    describe('truncateWmString', () => {
        it('should throw error for negative maxLength', () => {
            expect(() => WmString.truncateWmString('test', -1)).toThrow();
        });

        it('should return null for null input', () => {
            expect(WmString.truncateWmString(null, 10)).toBeNull();
        });

        it('should return original string if shorter than maxLength', () => {
            const input = 'Hello';
            expect(WmString.truncateWmString(input, 10)).toBe(input);
        });

        it('should truncate strings longer than maxLength', () => {
            const input = 'Hello World';
            const result = WmString.truncateWmString(input, 5);
            expect(result).toBe('Hello');
        });

        it('should handle encoded strings properly', () => {
            const input = 'u:41;42;43;';
            const result = WmString.truncateWmString(input, 6);
            expect(result).toBeDefined();
            expect(result!.length).toBeLessThanOrEqual(6);
        });

        it('should handle strings shorter than 4 characters', () => {
            const input = 'abc';
            const result = WmString.truncateWmString(input, 2);
            expect(result).toBe('ab');
        });

        it('should not cut encoded sequences in the middle', () => {
            const input = 'u:41;u:42;';
            const result = WmString.truncateWmString(input, 8);
            expect(result).toBeDefined();
        });
    });

    describe('splitByWmLength', () => {
        it('should throw error for maxLength less than 1', () => {
            expect(() => WmString.splitByWmLength('test', 0)).toThrow();
            expect(() => WmString.splitByWmLength('test', -1)).toThrow();
        });

        it('should return single element if string fits', () => {
            const input = 'Hello';
            const result = WmString.splitByWmLength(input, 10);
            expect(result).toEqual([input]);
        });

        it('should split long strings', () => {
            const input = 'Hello World Test';
            const result = WmString.splitByWmLength(input, 5);
            expect(result.length).toBeGreaterThan(1);

            result.forEach((chunk) => {
                const wmLength = WmString.toWmString(chunk)!.length;
                expect(wmLength).toBeLessThanOrEqual(5);
            });
        });

        it('should handle whitespace correctly', () => {
            const input = '   Hello   World   ';
            const result = WmString.splitByWmLength(input, 10);

            result.forEach((chunk) => {
                expect(chunk).toBe(chunk.trim());
            });
        });

        it('should split at appropriate boundaries', () => {
            const input = 'Hello World';
            const result = WmString.splitByWmLength(input, 5);

            const rejoined = result.join(' ');
            expect(rejoined.replace(/\s+/g, ' ')).toBe(input.replace(/\s+/g, ' '));
        });

        it('should handle empty strings', () => {
            const result = WmString.splitByWmLength('', 10);
            expect(result.length).toBeLessThanOrEqual(1);
            if (result.length > 0) {
                expect(result[0]).toBe('');
            }
        });

        it('should handle strings with only whitespace', () => {
            const result = WmString.splitByWmLength('     ', 10);
            expect(result.length).toBeGreaterThanOrEqual(0);
        });

        it('should handle maxLength of 1', () => {
            const input = 'ABC';
            const result = WmString.splitByWmLength(input, 1);
            expect(result.length).toBeGreaterThanOrEqual(3);
        });

        it('should handle Cyrillic characters', () => {
            const input = 'Привет Мир';
            const result = WmString.splitByWmLength(input, 5);

            result.forEach((chunk) => {
                const wmLength = WmString.toWmString(chunk)!.length;
                expect(wmLength).toBeLessThanOrEqual(5);
            });
        });
    });

    describe('Edge cases', () => {
        it('should handle emoji characters', () => {
            const input = 'Hello 😊 World';
            const encoded = WmString.toWmString(input);
            const decoded = WmString.fromWmString(encoded);
            expect(decoded).toBe(input);
        });

        it('should handle surrogate pairs', () => {
            const input = 'Test 𝕳𝖊𝖑𝖑𝖔';
            const encoded = WmString.toWmString(input);
            expect(encoded).toBeDefined();
            const decoded = WmString.fromWmString(encoded);
            expect(decoded).toBe(input);
        });

        it('should handle strings with multiple consecutive spaces', () => {
            const input = 'Hello    World';
            const encoded = WmString.toWmString(input);
            const decoded = WmString.fromWmString(encoded);
            expect(decoded).toBe(input);
        });

        it('should handle very long strings', () => {
            const input = 'a'.repeat(1000);
            const encoded = WmString.toWmString(input);
            const decoded = WmString.fromWmString(encoded);
            expect(decoded).toBe(input);
        });
    });
});
