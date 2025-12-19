/**
 * WebMoney conversion utilities
 */
export class WmConvert {
    /**
     * Decimal separator used in WebMoney API
     */
    private static readonly DECIMAL_SEPARATOR = '.';

    /**
     * Converts a number to WebMoney currency format
     * @param input - The number to convert
     * @returns Formatted string with proper decimal separator
     */
    static toWmCurrency(input: number): string {
        const decimalSeparator = WmConvert.DECIMAL_SEPARATOR;
        let output = input.toFixed(2).replace(/\.?0+$/, '');
        const currentDecimalSeparator = (1.1).toLocaleString().charAt(1);
        if (currentDecimalSeparator !== decimalSeparator) {
            output = output.replace(currentDecimalSeparator, decimalSeparator);
        }
        return output;
    }

    /**
     * Converts any input to decimal (number in TypeScript)
     * @param input - The input to convert
     * @returns Converted number
     */
    static toDecimal(input: any): number {
        return this.toDoubleFromString(input.toString());
    }

    /**
     * Converts string to decimal (number in TypeScript)
     * @param input - The string to convert
     * @returns Converted number
     */
    private static toDoubleFromString(input: string): number {
        let output = 0;
        const decimalSeparator = (1.1).toLocaleString().charAt(1);

        if ('.' === decimalSeparator) {
            input = input.replace(',', decimalSeparator);
        } else {
            input = input.replace('.', decimalSeparator);
        }

        const separators = ',.';
        const lastSeparatorIndex = Math.max(input.lastIndexOf(','), input.lastIndexOf('.'));
        const firstSeparatorIndex = Math.min(
            input.indexOf(',') !== -1 ? input.indexOf(',') : input.length,
            input.indexOf('.') !== -1 ? input.indexOf('.') : input.length
        );

        if (firstSeparatorIndex < lastSeparatorIndex) {
            const inputArray = input.split('');

            for (let i = 0; i < lastSeparatorIndex; i++) {
                if (separators.includes(inputArray[i])) {
                    inputArray[i] = ' ';
                }
            }

            input = inputArray.join('');
        }

        input = input.replace(/\s/g, '');

        try {
            input = input.trim();
            output = parseFloat(input);
            if (isNaN(output)) {
                output = 0;
            }
        } catch {
            output = 0;
        }

        return output;
    }

    /**
     * Converts any input to integer
     * @param input - The input to convert
     * @returns Converted integer
     */
    static toInt(input: any): number {
        let output = 0;

        try {
            output = parseInt(input.toString(), 10);
            if (isNaN(output)) {
                output = 0;
            }
        } catch {
            output = 0;
        }

        return output;
    }

    /**
     * Converts string to boolean
     * @param input - The string to convert
     * @returns Converted boolean
     */
    static toBool(input: string): boolean {
        if (!input || input.trim() === '') {
            return false;
        }

        const lowerInput = input.toLowerCase();
        switch (lowerInput) {
            case 'true':
            case 'y':
            case 'yes':
            case 'да':
            case '1':
                return true;
            default:
                return false;
        }
    }

    /**
     * Converts Date to WebMoney datetime format
     * @param input - The Date to convert
     * @returns Formatted datetime string (yyyyMMdd HH:mm:ss)
     */
    static toWmDateTime(input: Date): string {
        const year = input.getFullYear();
        const month = String(input.getMonth() + 1).padStart(2, '0');
        const day = String(input.getDate()).padStart(2, '0');
        const hours = String(input.getHours()).padStart(2, '0');
        const minutes = String(input.getMinutes()).padStart(2, '0');
        const seconds = String(input.getSeconds()).padStart(2, '0');

        return `${year}${month}${day} ${hours}:${minutes}:${seconds}`;
    }

    /**
     * Converts WebMoney datetime string to Date
     * @param input - The datetime string to convert
     * @returns Converted Date object
     */
    static fromWmDateTime(input: string): Date {
        if (!input || input.trim() === '') {
            return new Date(0);
        }

        const standardDate = new Date(input);
        if (!isNaN(standardDate.getTime())) {
            return standardDate;
        }

        try {
            const year = parseInt(input.substring(0, 4), 10);
            const month = parseInt(input.substring(4, 6), 10);
            const day = parseInt(input.substring(6, 8), 10);
            const hour = parseInt(input.substring(9, 11), 10);
            const minutes = parseInt(input.substring(12, 14), 10);
            const seconds = parseInt(input.substring(15, 17), 10);

            return new Date(year, month - 1, day, hour, minutes, seconds);
        } catch {
            return new Date(0);
        }
    }

    /**
     * Converts Date to WebMoney date format
     * @param input - The Date to convert
     * @returns Formatted date string (yyyyMMdd)
     */
    static toWmDate(input: Date): string {
        const year = input.getFullYear();
        const month = String(input.getMonth() + 1).padStart(2, '0');
        const day = String(input.getDate()).padStart(2, '0');

        return `${year}${month}${day}`;
    }

    /**
     * Converts WebMoney date string to Date
     * @param input - The date string to convert (yyyyMMdd)
     * @returns Converted Date object
     */
    static fromWmDate(input: string): Date {
        const year = parseInt(input.substring(0, 4), 10);
        const month = parseInt(input.substring(4, 6), 10);
        const day = parseInt(input.substring(6, 8), 10);
        const hour = 0;
        const minutes = 0;
        const seconds = 0;

        return new Date(year, month - 1, day, hour, minutes, seconds);
    }

    /**
     * Tries to parse date with specific format
     * @param date - The date string to parse
     * @returns Parsed Date object
     */
    static parseDateTime(date: string): Date {
        const wmFormat = /^(\d{4})(\d{2})(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
        const match = date.match(wmFormat);

        if (match) {
            const [, year, month, day, hour, minutes, seconds] = match;
            return new Date(
                parseInt(year, 10),
                parseInt(month, 10) - 1,
                parseInt(day, 10),
                parseInt(hour, 10),
                parseInt(minutes, 10),
                parseInt(seconds, 10)
            );
        }

        const parsedDate = new Date(date);
        return isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
    }
}
