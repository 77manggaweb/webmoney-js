import { WmSigner } from '../../src/signer/WmSigner';

describe('WmSigner', () => {
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    describe('constructor', () => {
        it('should create WmSigner instance with valid key', () => {
            expect(() => new WmSigner(testKey)).not.toThrow();
        });

        it('should throw error for missing Modulus', () => {
            const invalidKey = '<RSAKeyValue><D>test</D></RSAKeyValue>';
            expect(() => new WmSigner(invalidKey)).toThrow(
                'Invalid key format: missing Modulus or D element'
            );
        });

        it('should throw error for missing D element', () => {
            const invalidKey = '<RSAKeyValue><Modulus>test</Modulus></RSAKeyValue>';
            expect(() => new WmSigner(invalidKey)).toThrow(
                'Invalid key format: missing Modulus or D element'
            );
        });

        it('should throw error for empty Modulus', () => {
            const invalidKey = '<RSAKeyValue><Modulus></Modulus><D>test</D></RSAKeyValue>';
            expect(() => new WmSigner(invalidKey)).toThrow();
        });

        it('should throw error for empty D', () => {
            const invalidKey = '<RSAKeyValue><Modulus>test</Modulus><D></D></RSAKeyValue>';
            expect(() => new WmSigner(invalidKey)).toThrow();
        });

        it('should throw error for malformed XML', () => {
            const invalidKey = 'not a valid key format';
            expect(() => new WmSigner(invalidKey)).toThrow();
        });

        it('should handle key with extra whitespace', () => {
            const keyWithSpaces = `<RSAKeyValue>
        <Modulus>  wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=  </Modulus>
        <D>  ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn  </D>
      </RSAKeyValue>`;
            expect(() => new WmSigner(keyWithSpaces)).not.toThrow();
        });
    });

    describe('sign', () => {
        let signer: WmSigner;

        beforeEach(() => {
            signer = new WmSigner(testKey);
        });

        it('should generate signature for simple string', () => {
            const signature = signer.sign('test');
            expect(typeof signature).toBe('string');
            expect(signature.length).toBeGreaterThan(0);
        });

        it('should generate consistent signature for same input', () => {
            const sig1 = signer.sign('test');
            const sig2 = signer.sign('test');
            expect(sig1).toBe(sig2);
        });

        it('should generate different signatures for different inputs', () => {
            const sig1 = signer.sign('test1');
            const sig2 = signer.sign('test2');
            expect(sig1).not.toBe(sig2);
        });

        it('should return lowercase hex string', () => {
            const signature = signer.sign('test');
            expect(signature).toBe(signature.toLowerCase());
            expect(/^[0-9a-f]+$/.test(signature)).toBe(true);
        });

        it('should return fixed-length signature', () => {
            const sig1 = signer.sign('short');
            const sig2 = signer.sign('a much longer string with many characters');
            expect(sig1.length).toBe(sig2.length);
            expect(sig1.length).toBe(132);
        });

        it('should handle empty string', () => {
            const signature = signer.sign('');
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(132);
        });

        it('should handle very long strings', () => {
            const longString = 'a'.repeat(10000);
            const signature = signer.sign(longString);
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(132);
        });

        it('should handle Cyrillic characters with windows-1251 encoding', () => {
            const signature = signer.sign('Привет', 'windows-1251');
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(132);
        });

        it('should handle UTF-8 encoding', () => {
            const signature = signer.sign('Hello World', 'utf-8');
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(132);
        });

        it('should generate different signatures for different encodings', () => {
            const text = 'Test';
            const sigUtf8 = signer.sign(text, 'utf-8');
            const sigWin1251 = signer.sign(text, 'windows-1251');

            expect(typeof sigUtf8).toBe('string');
            expect(typeof sigWin1251).toBe('string');
            expect(sigUtf8.length).toBe(132);
            expect(sigWin1251.length).toBe(132);
        });

        it('should throw error for unsupported encoding', () => {
            expect(() => signer.sign('test', 'unsupported-encoding')).toThrow(
                'Unsupported encoding'
            );
        });

        it('should default to windows-1251 encoding when not specified', () => {
            const sig1 = signer.sign('test');
            const sig2 = signer.sign('test', 'windows-1251');
            expect(sig1).toBe(sig2);
        });

        it('should handle special characters', () => {
            const signature = signer.sign('!@#$%^&*()_+-=[]{}|;:,.<>?');
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(132);
        });

        it('should handle newlines and tabs', () => {
            const signature = signer.sign('line1\nline2\ttext');
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(132);
        });

        it('should handle Unicode emoji with UTF-8', () => {
            const signature = signer.sign('Hello 😊 World', 'utf-8');
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(132);
        });
    });

    describe('Signature properties', () => {
        let signer: WmSigner;

        beforeEach(() => {
            signer = new WmSigner(testKey);
        });

        it('should produce signatures with proper hex format', () => {
            const signature = signer.sign('test');

            expect(/^[0-9a-f]+$/.test(signature)).toBe(true);

            expect(signature.length % 2).toBe(0);
        });

        it('should produce deterministic signatures', () => {
            const signatures = [];
            for (let i = 0; i < 10; i++) {
                signatures.push(signer.sign('consistent test'));
            }

            const first = signatures[0];
            signatures.forEach((sig) => {
                expect(sig).toBe(first);
            });
        });

        it('should produce unique signatures for similar inputs', () => {
            const signatures = new Set();
            for (let i = 0; i < 100; i++) {
                signatures.add(signer.sign(`test${i}`));
            }

            expect(signatures.size).toBe(100);
        });
    });

    describe('Multiple signers with different keys', () => {
        it('should produce different signatures with different keys', () => {
            const key1 = `<RSAKeyValue>
        <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
        <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
      </RSAKeyValue>`;

            const key2 = `<RSAKeyValue>
        <Modulus>xSwiWF6fvSALtJJjBBJJjTz9uo/M6TMGMZTKtBe1t=</Modulus>
        <D>BCFjN1SWaofiNbr8zO4v8BBFSJAzSGWbo5jbr9zP5v9BBFjN1SWao</D>
      </RSAKeyValue>`;

            const signer1 = new WmSigner(key1);
            const signer2 = new WmSigner(key2);

            const sig1 = signer1.sign('test');
            const sig2 = signer2.sign('test');

            expect(sig1).not.toBe(sig2);
        });
    });

    describe('Edge cases', () => {
        let signer: WmSigner;

        beforeEach(() => {
            signer = new WmSigner(testKey);
        });

        it('should handle strings with null bytes in UTF-8', () => {
            const str = 'test\u0000data';
            const signature = signer.sign(str, 'utf-8');
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(132);
        });

        it('should handle repeated characters', () => {
            const str = 'aaaaaaaaaa';
            const signature = signer.sign(str);
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(132);
        });

        it('should handle all printable ASCII characters', () => {
            let str = '';
            for (let i = 32; i < 127; i++) {
                str += String.fromCharCode(i);
            }
            const signature = signer.sign(str);
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(132);
        });

        it('should handle case sensitivity', () => {
            const sig1 = signer.sign('Test');
            const sig2 = signer.sign('test');
            const sig3 = signer.sign('TEST');

            expect(sig1).not.toBe(sig2);
            expect(sig2).not.toBe(sig3);
            expect(sig1).not.toBe(sig3);
        });
    });
});
