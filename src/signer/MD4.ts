export class MD4 {
    private static readonly _IV_A = 0x67452301;
    private static readonly _IV_B = 0xefcdab89;
    private static readonly _IV_C = 0x98badcfe;
    private static readonly _IV_D = 0x10325476;

    private static readonly _K1 = 0x00000000;
    private static readonly _K2 = 0x5a827999;
    private static readonly _K3 = 0x6ed9eba1;

    private static _F(X: number, Y: number, Z: number): number {
        return (X & Y) | (~X & Z);
    }

    private static _G(X: number, Y: number, Z: number): number {
        return (X & Y) | (X & Z) | (Y & Z);
    }

    private static _H(X: number, Y: number, Z: number): number {
        return X ^ Y ^ Z;
    }

    private static _rol(n: number, shift: number, width: number = 32): number {
        return ((n << shift) | (n >>> (width - shift))) & 0xffffffff;
    }

    private static _padMessage(messageBytes: Uint8Array): Uint8Array {
        const messageLenBits = messageBytes.length * 8;
        const paddedMessage = new Uint8Array(messageBytes);

        const withPadding = new Uint8Array(paddedMessage.length + 1);
        withPadding.set(paddedMessage);
        withPadding[paddedMessage.length] = 0x80;

        let paddingLength = 0;
        while ((withPadding.length + paddingLength) % 64 !== 56) {
            paddingLength++;
        }

        const finalLength = withPadding.length + paddingLength + 8;
        const result = new Uint8Array(finalLength);
        result.set(withPadding);

        const lengthBytes = new Uint8Array(8);
        const view = new DataView(lengthBytes.buffer);
        view.setBigUint64(0, BigInt(messageLenBits), true);
        result.set(lengthBytes, withPadding.length + paddingLength);

        return result;
    }

    private static _transformBlock(
        block: Uint8Array,
        A: number,
        B: number,
        C: number,
        D: number
    ): [number, number, number, number] {
        const X: number[] = [];
        for (let i = 0; i < 16; i++) {
            const view = new DataView(block.buffer, block.byteOffset + i * 4, 4);
            X[i] = view.getUint32(0, true);
        }

        const AA = A,
            BB = B,
            CC = C,
            DD = D;

        A = MD4._rol((A + MD4._F(B, C, D) + X[0] + MD4._K1) & 0xffffffff, 3);
        D = MD4._rol((D + MD4._F(A, B, C) + X[1] + MD4._K1) & 0xffffffff, 7);
        C = MD4._rol((C + MD4._F(D, A, B) + X[2] + MD4._K1) & 0xffffffff, 11);
        B = MD4._rol((B + MD4._F(C, D, A) + X[3] + MD4._K1) & 0xffffffff, 19);
        A = MD4._rol((A + MD4._F(B, C, D) + X[4] + MD4._K1) & 0xffffffff, 3);
        D = MD4._rol((D + MD4._F(A, B, C) + X[5] + MD4._K1) & 0xffffffff, 7);
        C = MD4._rol((C + MD4._F(D, A, B) + X[6] + MD4._K1) & 0xffffffff, 11);
        B = MD4._rol((B + MD4._F(C, D, A) + X[7] + MD4._K1) & 0xffffffff, 19);
        A = MD4._rol((A + MD4._F(B, C, D) + X[8] + MD4._K1) & 0xffffffff, 3);
        D = MD4._rol((D + MD4._F(A, B, C) + X[9] + MD4._K1) & 0xffffffff, 7);
        C = MD4._rol((C + MD4._F(D, A, B) + X[10] + MD4._K1) & 0xffffffff, 11);
        B = MD4._rol((B + MD4._F(C, D, A) + X[11] + MD4._K1) & 0xffffffff, 19);
        A = MD4._rol((A + MD4._F(B, C, D) + X[12] + MD4._K1) & 0xffffffff, 3);
        D = MD4._rol((D + MD4._F(A, B, C) + X[13] + MD4._K1) & 0xffffffff, 7);
        C = MD4._rol((C + MD4._F(D, A, B) + X[14] + MD4._K1) & 0xffffffff, 11);
        B = MD4._rol((B + MD4._F(C, D, A) + X[15] + MD4._K1) & 0xffffffff, 19);

        A = MD4._rol((A + MD4._G(B, C, D) + X[0] + MD4._K2) & 0xffffffff, 3);
        D = MD4._rol((D + MD4._G(A, B, C) + X[4] + MD4._K2) & 0xffffffff, 5);
        C = MD4._rol((C + MD4._G(D, A, B) + X[8] + MD4._K2) & 0xffffffff, 9);
        B = MD4._rol((B + MD4._G(C, D, A) + X[12] + MD4._K2) & 0xffffffff, 13);
        A = MD4._rol((A + MD4._G(B, C, D) + X[1] + MD4._K2) & 0xffffffff, 3);
        D = MD4._rol((D + MD4._G(A, B, C) + X[5] + MD4._K2) & 0xffffffff, 5);
        C = MD4._rol((C + MD4._G(D, A, B) + X[9] + MD4._K2) & 0xffffffff, 9);
        B = MD4._rol((B + MD4._G(C, D, A) + X[13] + MD4._K2) & 0xffffffff, 13);
        A = MD4._rol((A + MD4._G(B, C, D) + X[2] + MD4._K2) & 0xffffffff, 3);
        D = MD4._rol((D + MD4._G(A, B, C) + X[6] + MD4._K2) & 0xffffffff, 5);
        C = MD4._rol((C + MD4._G(D, A, B) + X[10] + MD4._K2) & 0xffffffff, 9);
        B = MD4._rol((B + MD4._G(C, D, A) + X[14] + MD4._K2) & 0xffffffff, 13);
        A = MD4._rol((A + MD4._G(B, C, D) + X[3] + MD4._K2) & 0xffffffff, 3);
        D = MD4._rol((D + MD4._G(A, B, C) + X[7] + MD4._K2) & 0xffffffff, 5);
        C = MD4._rol((C + MD4._G(D, A, B) + X[11] + MD4._K2) & 0xffffffff, 9);
        B = MD4._rol((B + MD4._G(C, D, A) + X[15] + MD4._K2) & 0xffffffff, 13);

        A = MD4._rol((A + MD4._H(B, C, D) + X[0] + MD4._K3) & 0xffffffff, 3);
        D = MD4._rol((D + MD4._H(A, B, C) + X[8] + MD4._K3) & 0xffffffff, 9);
        C = MD4._rol((C + MD4._H(D, A, B) + X[4] + MD4._K3) & 0xffffffff, 11);
        B = MD4._rol((B + MD4._H(C, D, A) + X[12] + MD4._K3) & 0xffffffff, 15);
        A = MD4._rol((A + MD4._H(B, C, D) + X[2] + MD4._K3) & 0xffffffff, 3);
        D = MD4._rol((D + MD4._H(A, B, C) + X[10] + MD4._K3) & 0xffffffff, 9);
        C = MD4._rol((C + MD4._H(D, A, B) + X[6] + MD4._K3) & 0xffffffff, 11);
        B = MD4._rol((B + MD4._H(C, D, A) + X[14] + MD4._K3) & 0xffffffff, 15);
        A = MD4._rol((A + MD4._H(B, C, D) + X[1] + MD4._K3) & 0xffffffff, 3);
        D = MD4._rol((D + MD4._H(A, B, C) + X[9] + MD4._K3) & 0xffffffff, 9);
        C = MD4._rol((C + MD4._H(D, A, B) + X[5] + MD4._K3) & 0xffffffff, 11);
        B = MD4._rol((B + MD4._H(C, D, A) + X[13] + MD4._K3) & 0xffffffff, 15);
        A = MD4._rol((A + MD4._H(B, C, D) + X[3] + MD4._K3) & 0xffffffff, 3);
        D = MD4._rol((D + MD4._H(A, B, C) + X[11] + MD4._K3) & 0xffffffff, 9);
        C = MD4._rol((C + MD4._H(D, A, B) + X[7] + MD4._K3) & 0xffffffff, 11);
        B = MD4._rol((B + MD4._H(C, D, A) + X[15] + MD4._K3) & 0xffffffff, 15);

        A = (A + AA) & 0xffffffff;
        B = (B + BB) & 0xffffffff;
        C = (C + CC) & 0xffffffff;
        D = (D + DD) & 0xffffffff;

        return [A, B, C, D];
    }

    private static _stringToUtf8Bytes(str: string): Uint8Array {
        const bytes: number[] = [];
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            if (charCode < 0x80) {
                bytes.push(charCode);
            } else if (charCode < 0x800) {
                bytes.push(0xc0 | (charCode >> 6));
                bytes.push(0x80 | (charCode & 0x3f));
            } else if (charCode < 0xd800 || charCode >= 0xe000) {
                bytes.push(0xe0 | (charCode >> 12));
                bytes.push(0x80 | ((charCode >> 6) & 0x3f));
                bytes.push(0x80 | (charCode & 0x3f));
            } else {
                i++;
                const charCode2 = str.charCodeAt(i);
                const codePoint = 0x10000 + (((charCode & 0x3ff) << 10) | (charCode2 & 0x3ff));
                bytes.push(0xf0 | (codePoint >> 18));
                bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
                bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
                bytes.push(0x80 | (codePoint & 0x3f));
            }
        }
        return new Uint8Array(bytes);
    }

    public static calculate(message: string): Uint8Array {
        const messageBytes = MD4._stringToUtf8Bytes(message);
        return MD4.calculateFromBytes(messageBytes);
    }

    public static calculateFromBytes(messageBytes: Uint8Array): Uint8Array {
        const paddedMessage = MD4._padMessage(messageBytes);
        let A = MD4._IV_A;
        let B = MD4._IV_B;
        let C = MD4._IV_C;
        let D = MD4._IV_D;

        for (let i = 0; i < paddedMessage.length; i += 64) {
            const block = paddedMessage.slice(i, i + 64);
            [A, B, C, D] = MD4._transformBlock(block, A, B, C, D);
        }

        const hash = new Uint8Array(16);
        const view = new DataView(hash.buffer);
        view.setUint32(0, A, true);
        view.setUint32(4, B, true);
        view.setUint32(8, C, true);
        view.setUint32(12, D, true);

        return hash;
    }

    public static calculateHex(message: string): string {
        const hash = MD4.calculate(message);
        return Array.from(hash)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }
}
