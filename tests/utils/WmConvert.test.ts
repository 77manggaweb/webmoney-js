import { WmConvert } from '../../src/utils/WmConvert';

describe('WmConvert', () => {
    describe('toWmCurrency', () => {
        it('should convert number to WebMoney currency format', () => {
            expect(WmConvert.toWmCurrency(10.5)).toBe('10.5');
            expect(WmConvert.toWmCurrency(10.0)).toBe('10');
            expect(WmConvert.toWmCurrency(10.5)).toBe('10.5');
            expect(WmConvert.toWmCurrency(1234.56)).toBe('1234.56');
        });

        it('should handle whole numbers', () => {
            expect(WmConvert.toWmCurrency(100)).toBe('100');
            expect(WmConvert.toWmCurrency(0)).toBe('0');
        });

        it('should remove trailing zeros', () => {
            expect(WmConvert.toWmCurrency(10.1)).toBe('10.1');
            expect(WmConvert.toWmCurrency(10.2)).toBe('10.2');
        });
    });

    describe('fromWmDateTime', () => {
        it('should convert WebMoney datetime string to Date', () => {
            const result = WmConvert.fromWmDateTime('20231225 14:30:45');
            expect(result.getFullYear()).toBe(2023);
            expect(result.getMonth()).toBe(11);
            expect(result.getDate()).toBe(25);
            expect(result.getHours()).toBe(14);
            expect(result.getMinutes()).toBe(30);
            expect(result.getSeconds()).toBe(45);
        });

        it('should handle empty string', () => {
            const result = WmConvert.fromWmDateTime('');
            expect(result.getTime()).toBe(0);
        });

        it('should parse standard date format', () => {
            const result = WmConvert.fromWmDateTime('2023-12-25T14:30:45');
            expect(result.getFullYear()).toBe(2023);
            expect(result.getMonth()).toBe(11);
            expect(result.getDate()).toBe(25);
        });

        it('should return Unix epoch for invalid input', () => {
            const result = WmConvert.fromWmDateTime('invalid');
            expect(isNaN(result.getTime())).toBe(true);
        });
    });

    describe('toWmDate', () => {
        it('should convert Date to WebMoney date format', () => {
            const date = new Date(2023, 11, 25);
            const result = WmConvert.toWmDate(date);
            expect(result).toBe('20231225');
        });

        it('should pad single-digit values with zeros', () => {
            const date = new Date(2023, 0, 5);
            const result = WmConvert.toWmDate(date);
            expect(result).toBe('20230105');
        });
    });

    describe('fromWmDate', () => {
        it('should convert WebMoney date string to Date', () => {
            const result = WmConvert.fromWmDate('20231225');
            expect(result.getFullYear()).toBe(2023);
            expect(result.getMonth()).toBe(11);
            expect(result.getDate()).toBe(25);
            expect(result.getHours()).toBe(0);
            expect(result.getMinutes()).toBe(0);
            expect(result.getSeconds()).toBe(0);
        });

        it('should handle dates with single digits', () => {
            const result = WmConvert.fromWmDate('20230105');
            expect(result.getFullYear()).toBe(2023);
            expect(result.getMonth()).toBe(0);
            expect(result.getDate()).toBe(5);
        });
    });

    describe('Round-trip conversions', () => {
        it('should round-trip date conversions', () => {
            const originalDate = new Date(2023, 11, 25);
            const wmDate = WmConvert.toWmDate(originalDate);
            const parsedDate = WmConvert.fromWmDate(wmDate);

            expect(parsedDate.getFullYear()).toBe(originalDate.getFullYear());
            expect(parsedDate.getMonth()).toBe(originalDate.getMonth());
            expect(parsedDate.getDate()).toBe(originalDate.getDate());
        });
    });

    describe('toWmDateTime', () => {
        it('should convert Date to WebMoney datetime format', () => {
            const date = new Date(2023, 11, 25, 14, 30, 45);
            const result = WmConvert.toWmDateTime(date);
            expect(result).toBe('20231225 14:30:45');
        });

        it('should pad single-digit values with zeros', () => {
            const date = new Date(2023, 0, 5, 9, 5, 3);
            const result = WmConvert.toWmDateTime(date);
            expect(result).toBe('20230105 09:05:03');
        });

        it('should handle midnight', () => {
            const date = new Date(2023, 0, 1, 0, 0, 0);
            const result = WmConvert.toWmDateTime(date);
            expect(result).toBe('20230101 00:00:00');
        });
    });

    describe('parseDateTime', () => {
        it('should parse WebMoney datetime format', () => {
            const result = WmConvert.parseDateTime('20231225 14:30:45');
            expect(result.getFullYear()).toBe(2023);
            expect(result.getMonth()).toBe(11);
            expect(result.getDate()).toBe(25);
            expect(result.getHours()).toBe(14);
            expect(result.getMinutes()).toBe(30);
            expect(result.getSeconds()).toBe(45);
        });

        it('should parse standard date format as fallback', () => {
            const result = WmConvert.parseDateTime('2023-12-25T14:30:45');
            expect(result.getFullYear()).toBe(2023);
            expect(result.getMonth()).toBe(11);
            expect(result.getDate()).toBe(25);
        });

        it('should return Unix epoch for invalid input', () => {
            const result = WmConvert.parseDateTime('invalid');
            expect(result.getTime()).toBe(0);
        });

        it('should handle empty string', () => {
            const result = WmConvert.parseDateTime('');
            expect(result.getTime()).toBe(0);
        });
    });

    describe('toDecimal', () => {
        it('should convert string to decimal', () => {
            expect(WmConvert.toDecimal('123.45')).toBe(123.45);
            expect(WmConvert.toDecimal('100')).toBe(100);
            expect(WmConvert.toDecimal('0')).toBe(0);
        });

        it('should handle number input', () => {
            expect(WmConvert.toDecimal(123.45)).toBe(123.45);
            expect(WmConvert.toDecimal(100)).toBe(100);
        });

        it('should handle comma as decimal separator', () => {
            expect(WmConvert.toDecimal('123,45')).toBeCloseTo(123.45, 2);
        });
    });

    describe('toInt', () => {
        it('should convert string to integer', () => {
            expect(WmConvert.toInt('123')).toBe(123);
            expect(WmConvert.toInt('100')).toBe(100);
            expect(WmConvert.toInt('0')).toBe(0);
        });

        it('should handle number input', () => {
            expect(WmConvert.toInt(123.45)).toBe(123);
            expect(WmConvert.toInt(100)).toBe(100);
        });

        it('should return 0 for invalid input', () => {
            expect(WmConvert.toInt('invalid')).toBe(0);
            expect(WmConvert.toInt('')).toBe(0);
        });
    });

    describe('toBool', () => {
        it('should convert true values', () => {
            expect(WmConvert.toBool('true')).toBe(true);
            expect(WmConvert.toBool('y')).toBe(true);
            expect(WmConvert.toBool('yes')).toBe(true);
            expect(WmConvert.toBool('1')).toBe(true);
            expect(WmConvert.toBool('да')).toBe(true);
        });

        it('should convert false values', () => {
            expect(WmConvert.toBool('false')).toBe(false);
            expect(WmConvert.toBool('n')).toBe(false);
            expect(WmConvert.toBool('no')).toBe(false);
            expect(WmConvert.toBool('0')).toBe(false);
            expect(WmConvert.toBool('anything')).toBe(false);
        });

        it('should return false for empty or whitespace', () => {
            expect(WmConvert.toBool('')).toBe(false);
            expect(WmConvert.toBool('   ')).toBe(false);
        });

        it('should be case insensitive', () => {
            expect(WmConvert.toBool('TRUE')).toBe(true);
            expect(WmConvert.toBool('Yes')).toBe(true);
            expect(WmConvert.toBool('FALSE')).toBe(false);
        });
    });
});
