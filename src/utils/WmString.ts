export class WmString {
    private static readonly _cyrillicGeneral100CollationChars: string[] = [
        '\u0000',
        '\u0001',
        '\u0002',
        '\u0003',
        '\u0004',
        '\u0005',
        '\u0006',
        '\u0007',
        '\u0008',
        '\u0009',
        '\u000A',
        '\u000B',
        '\u000C',
        '\u000D',
        '\u000E',
        '\u000F',
        '\u0010',
        '\u0011',
        '\u0012',
        '\u0013',
        '\u0014',
        '\u0015',
        '\u0016',
        '\u0017',
        '\u0018',
        '\u0019',
        '\u001A',
        '\u001B',
        '\u001C',
        '\u001D',
        '\u001E',
        '\u001F',
        '\u0020',
        '\u0021',
        '\u0022',
        '\u0023',
        '\u0024',
        '\u0025',
        '\u0026',
        '\u0027',
        '\u0028',
        '\u0029',
        '\u002A',
        '\u002B',
        '\u002C',
        '\u002D',
        '\u002E',
        '\u002F',
        '\u0030',
        '\u0031',
        '\u0032',
        '\u0033',
        '\u0034',
        '\u0035',
        '\u0036',
        '\u0037',
        '\u0038',
        '\u0039',
        '\u003A',
        '\u003B',
        '\u003C',
        '\u003D',
        '\u003E',
        '\u003F',
        '\u0040',
        '\u0041',
        '\u0042',
        '\u0043',
        '\u0044',
        '\u0045',
        '\u0046',
        '\u0047',
        '\u0048',
        '\u0049',
        '\u004A',
        '\u004B',
        '\u004C',
        '\u004D',
        '\u004E',
        '\u004F',
        '\u0050',
        '\u0051',
        '\u0052',
        '\u0053',
        '\u0054',
        '\u0055',
        '\u0056',
        '\u0057',
        '\u0058',
        '\u0059',
        '\u005A',
        '\u005B',
        '\u005C',
        '\u005D',
        '\u005E',
        '\u005F',
        '\u0060',
        '\u0061',
        '\u0062',
        '\u0063',
        '\u0064',
        '\u0065',
        '\u0066',
        '\u0067',
        '\u0068',
        '\u0069',
        '\u006A',
        '\u006B',
        '\u006C',
        '\u006D',
        '\u006E',
        '\u006F',
        '\u0070',
        '\u0071',
        '\u0072',
        '\u0073',
        '\u0074',
        '\u0075',
        '\u0076',
        '\u0077',
        '\u0078',
        '\u0079',
        '\u007A',
        '\u007B',
        '\u007C',
        '\u007D',
        '\u007E',
        '\u007F',
        '\u0098',
        '\u00A0',
        '\u00A4',
        '\u00A6',
        '\u00A7',
        '\u00A9',
        '\u00AB',
        '\u00AC',
        '\u00AD',
        '\u00AE',
        '\u00B0',
        '\u00B1',
        '\u00B5',
        '\u00B6',
        '\u00B7',
        '\u00BB',
        '\u0401',
        '\u0402',
        '\u0403',
        '\u0404',
        '\u0405',
        '\u0406',
        '\u0407',
        '\u0408',
        '\u0409',
        '\u040A',
        '\u040B',
        '\u040C',
        '\u040E',
        '\u040F',
        '\u0410',
        '\u0411',
        '\u0412',
        '\u0413',
        '\u0414',
        '\u0415',
        '\u0416',
        '\u0417',
        '\u0418',
        '\u0419',
        '\u041A',
        '\u041B',
        '\u041C',
        '\u041D',
        '\u041E',
        '\u041F',
        '\u0420',
        '\u0421',
        '\u0422',
        '\u0423',
        '\u0424',
        '\u0425',
        '\u0426',
        '\u0427',
        '\u0428',
        '\u0429',
        '\u042A',
        '\u042B',
        '\u042C',
        '\u042D',
        '\u042E',
        '\u042F',
        '\u0430',
        '\u0431',
        '\u0432',
        '\u0433',
        '\u0434',
        '\u0435',
        '\u0436',
        '\u0437',
        '\u0438',
        '\u0439',
        '\u043A',
        '\u043B',
        '\u043C',
        '\u043D',
        '\u043E',
        '\u043F',
        '\u0440',
        '\u0441',
        '\u0442',
        '\u0443',
        '\u0444',
        '\u0445',
        '\u0446',
        '\u0447',
        '\u0448',
        '\u0449',
        '\u044A',
        '\u044B',
        '\u044C',
        '\u044D',
        '\u044E',
        '\u044F',
        '\u0451',
        '\u0452',
        '\u0453',
        '\u0454',
        '\u0455',
        '\u0456',
        '\u0457',
        '\u0458',
        '\u0459',
        '\u045A',
        '\u045B',
        '\u045C',
        '\u045E',
        '\u045F',
        '\u0490',
        '\u0491',
        '\u2013',
        '\u2014',
        '\u2018',
        '\u2019',
        '\u201A',
        '\u201C',
        '\u201D',
        '\u201E',
        '\u2020',
        '\u2021',
        '\u2022',
        '\u2026',
        '\u2030',
        '\u2039',
        '\u203A',
        '\u20AC',
        '\u2116',
        '\u2122',
    ];

    private static readonly ToWmStringState = {
        NORMAL: 0,
        ENCODE: 1,
    } as const;

    private static readonly FromWmStringState = {
        NORMAL: 0,
        DECODE: 1,
    } as const;

    private static isHexDigit(x: string): boolean {
        return ('0' <= x && x <= '9') || ('a' <= x && x <= 'f') || ('A' <= x && x <= 'F');
    }

    private static toHexUtf16(ch: string): string[] {
        const codePoint = ch.codePointAt(0)!;

        if (codePoint <= 0xffff) {
            return [codePoint.toString(16)];
        }

        const adjusted = codePoint - 0x10000;
        const highSurrogate = 0xd800 + (adjusted >> 10);
        const lowSurrogate = 0xdc00 + (adjusted & 0x3ff);

        return [highSurrogate.toString(16), lowSurrogate.toString(16)];
    }

    private static isValid(ch: string): boolean {
        return WmString._cyrillicGeneral100CollationChars.includes(ch);
    }

    private static isWmStringLike(sBuilder: string, endIndex: number): boolean {
        if (endIndex === 0) {
            return false;
        }

        if (!WmString.isHexDigit(sBuilder[endIndex - 1])) {
            return false;
        }

        for (let i = endIndex - 2; i > 0; i--) {
            const ch = sBuilder[i];
            if (ch === ':' && i > 0 && sBuilder[i - 1] === 'u') {
                return true;
            }
            if (
                !WmString.isHexDigit(ch) &&
                (ch !== ';' || i <= 0 || !WmString.isHexDigit(sBuilder[i - 1]))
            ) {
                return false;
            }
        }
        return false;
    }

    static toWmString(s: string | null): string | null {
        if (s === null) {
            return null;
        }

        const output: string[] = [];
        let state: (typeof WmString.ToWmStringState)[keyof typeof WmString.ToWmStringState] =
            WmString.ToWmStringState.NORMAL;

        let i = 0;
        while (i < s.length) {
            const ch = s[i];
            const isValid = WmString.isValid(ch);

            if (state === WmString.ToWmStringState.NORMAL) {
                if (ch === ';' && WmString.isWmStringLike(output.join(''), output.length)) {
                    state = WmString.ToWmStringState.ENCODE;
                    output.push('u:');
                    const hexValues = WmString.toHexUtf16(ch);
                    for (const hexVal of hexValues) {
                        output.push(hexVal);
                        output.push(';');
                    }
                    i++;
                } else if (isValid) {
                    output.push(ch);
                    i++;
                } else {
                    state = WmString.ToWmStringState.ENCODE;
                    output.push('u:');
                }
            } else if (state === WmString.ToWmStringState.ENCODE) {
                if (isValid) {
                    state = WmString.ToWmStringState.NORMAL;
                } else {
                    const hexValues = WmString.toHexUtf16(ch);
                    for (const hexVal of hexValues) {
                        output.push(hexVal);
                        output.push(';');
                    }
                    i++;
                }
            } else {
                throw new Error('InvalidOperationException');
            }
        }

        return output.join('');
    }

    static fromWmString(s: string | null): string | null {
        try {
            return WmString.fromWmStringImpl(s);
        } catch {
            return s;
        }
    }

    private static fromWmStringImpl(s: string | null): string | null {
        if (s === null) {
            return null;
        }

        const length = s.length;
        if (length < 4) {
            return s;
        }

        const output: string[] = [];
        const buffer: string[] = [];
        const prefixBuffer: string[] = [];

        let state: (typeof WmString.FromWmStringState)[keyof typeof WmString.FromWmStringState] =
            WmString.FromWmStringState.NORMAL;

        let i = 0;
        while (i < length) {
            const ch = s[i];

            if (state === WmString.FromWmStringState.NORMAL) {
                if (ch === 'u' && i + 1 < length && s[i + 1] === ':') {
                    state = WmString.FromWmStringState.DECODE;
                    prefixBuffer.length = 0;
                    prefixBuffer.push('u', ':');
                    i += 2;
                } else {
                    output.push(ch);
                    i++;
                }
            } else if (state === WmString.FromWmStringState.DECODE) {
                buffer.length = 0;
                let j = i;
                while (j < length && state === WmString.FromWmStringState.DECODE) {
                    const x = s[j];
                    if (WmString.isHexDigit(x)) {
                        buffer.push(x);
                    } else if (x === ';') {
                        if (buffer.length === 0) {
                            i = j + 1;
                            state = WmString.FromWmStringState.NORMAL;
                            output.push(...prefixBuffer);
                            prefixBuffer.length = 0;
                            output.push(';');
                        } else {
                            const sValue = buffer.join('');
                            buffer.length = 0;
                            try {
                                const intValue = parseInt(sValue, 16);
                                const charValue = String.fromCodePoint(intValue);
                                output.push(charValue);
                            } catch {
                                output.push('u:');
                                output.push(sValue);
                                output.push(';');
                            }
                            prefixBuffer.length = 0;
                        }
                    } else {
                        i = j;
                        state = WmString.FromWmStringState.NORMAL;
                        output.push(...prefixBuffer);
                        prefixBuffer.length = 0;
                        if (buffer.length > 0) {
                            output.push(...buffer);
                            buffer.length = 0;
                        }
                        break;
                    }
                    j++;
                }

                if (j === length) {
                    i = j;
                    output.push(...prefixBuffer);
                    prefixBuffer.length = 0;
                    if (buffer.length > 0) {
                        output.push(...buffer);
                        buffer.length = 0;
                    }
                }
            } else {
                throw new Error('InvalidOperationException');
            }
        }

        output.push(...prefixBuffer);
        return output.join('');
    }

    static truncateWmString(s: string | null, maxLength: number): string | null {
        if (maxLength < 0) {
            throw new Error('maxLength cannot be less than zero.');
        }

        if (s === null) {
            return null;
        }

        const length = s.length;
        if (length <= maxLength) {
            return s;
        }
        if (length < 4) {
            return s.substring(0, maxLength);
        }

        let outputLength = 0;
        let codeExceedsMaxLength = false;
        let state: (typeof WmString.FromWmStringState)[keyof typeof WmString.FromWmStringState] =
            WmString.FromWmStringState.NORMAL;

        let i = 0;
        while (i < length && outputLength < maxLength && !codeExceedsMaxLength) {
            const ch = s[i];

            if (state === WmString.FromWmStringState.NORMAL) {
                if (ch === 'u' && i + 1 < length && s[i + 1] === ':') {
                    const codeStart = i + 2;
                    const codeEnd = WmString.indexOfCodeEnd(s, codeStart);
                    if (codeEnd !== codeStart) {
                        if (codeEnd + 1 > maxLength) {
                            codeExceedsMaxLength = true;
                        } else {
                            i = codeEnd + 1;
                            outputLength = codeEnd + 1;
                            state = WmString.FromWmStringState.DECODE;
                        }
                    } else {
                        outputLength++;
                        i++;
                    }
                } else {
                    outputLength++;
                    i++;
                }
            } else if (state === WmString.FromWmStringState.DECODE) {
                const codeStart = i;
                const codeEnd = WmString.indexOfCodeEnd(s, codeStart);
                if (codeEnd !== codeStart) {
                    if (codeEnd + 1 > maxLength) {
                        codeExceedsMaxLength = true;
                    } else {
                        i = codeEnd + 1;
                        outputLength = codeEnd + 1;
                    }
                } else {
                    state = WmString.FromWmStringState.NORMAL;
                }
            } else {
                throw new Error('InvalidOperationException');
            }
        }

        return s.substring(0, outputLength);
    }

    private static indexOfCodeEnd(s: string, codeStart: number): number {
        let hasDigits = false;
        let hasSemicolon = false;

        let result = codeStart;
        while (result < s.length) {
            const ch = s[result];

            if (WmString.isHexDigit(ch)) {
                hasDigits = true;
            } else if (ch === ';') {
                hasSemicolon = true;
                break;
            } else {
                break;
            }
            result++;
        }

        return hasDigits && hasSemicolon ? result : codeStart;
    }

    static splitByWmLength(ordinalStr: string, maxLength: number): string[] {
        if (maxLength < 1) {
            throw new Error('max_length must be at least 1');
        }

        const wmStr = WmString.toWmString(ordinalStr)!;

        if (wmStr.length <= maxLength) {
            return [ordinalStr];
        }

        const result: string[] = [];
        let currentPos = 0;

        while (currentPos < ordinalStr.length) {
            while (currentPos < ordinalStr.length && /\s/.test(ordinalStr[currentPos])) {
                currentPos++;
            }

            if (currentPos >= ordinalStr.length) {
                break;
            }

            let bestEnd = -1;
            for (let endPos = currentPos; endPos < ordinalStr.length; endPos++) {
                const substring = ordinalStr.substring(currentPos, endPos + 1);
                if (WmString.toWmString(substring)!.length <= maxLength) {
                    bestEnd = endPos;
                } else {
                    break;
                }
            }

            if (bestEnd !== -1) {
                const chunk = ordinalStr.substring(currentPos, bestEnd + 1);
                const trimmedChunk = chunk.replace(/\s+$/, '');
                if (trimmedChunk) {
                    result.push(trimmedChunk);
                }
                currentPos = bestEnd + 1;
            } else {
                result.push(ordinalStr[currentPos]);
                currentPos++;
            }
        }

        return result;
    }
}
