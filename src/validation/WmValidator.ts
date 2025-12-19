import { WmValidationError } from '../errors/WmError';

/**
 * Validation utility for WebMoney-specific data formats.
 */
export class WmValidator {
    /**
     * Regular expression for validating WMID format (12 digits).
     */
    private static readonly WMID_REGEX = /^\d{12}$/;

    /**
     * Regular expression for validating WebMoney purse format.
     * Format: One letter (Z,R,D,E,C,X,G,H,K,U,V,Y,P,T,F,M) followed by 12 digits.
     */
    private static readonly PURSE_REGEX = /^[ZRDECXGHKUVYPTFM]\d{12}$/;

    /**
     * Validates a WebMoney ID (WMID).
     * @param wmid - The WMID to validate
     * @param interfaceName - Name of the interface (for error reporting)
     * @throws WmValidationError if the WMID is invalid
     */
    static validateWmid(wmid: string, interfaceName: string = 'unknown'): void {
        if (!wmid) {
            throw new WmValidationError('WMID is required', interfaceName, 'wmid');
        }

        if (!WmValidator.WMID_REGEX.test(wmid)) {
            throw new WmValidationError('WMID must be exactly 12 digits', interfaceName, 'wmid');
        }
    }

    /**
     * Validates a WebMoney purse.
     * @param purse - The purse to validate
     * @param interfaceName - Name of the interface (for error reporting)
     * @throws WmValidationError if the purse is invalid
     */
    static validatePurse(purse: string, interfaceName: string = 'unknown'): void {
        if (!purse) {
            throw new WmValidationError('Purse is required', interfaceName, 'purse');
        }

        if (!WmValidator.PURSE_REGEX.test(purse)) {
            throw new WmValidationError(
                'Purse must start with a valid currency letter (Z,R,D,E,C,X,G,H,K,U,V,Y,P,T,F,M) followed by 12 digits',
                interfaceName,
                'purse'
            );
        }
    }

    /**
     * Validates an amount value.
     * @param amount - The amount to validate
     * @param interfaceName - Name of the interface (for error reporting)
     * @throws WmValidationError if the amount is invalid
     */
    static validateAmount(amount: number, interfaceName: string = 'unknown'): void {
        if (amount === undefined || amount === null) {
            throw new WmValidationError('Amount is required', interfaceName, 'amount');
        }

        if (!Number.isFinite(amount)) {
            throw new WmValidationError(
                `Amount must be a finite number (got ${amount})`,
                interfaceName,
                'amount'
            );
        }

        if (amount <= 0) {
            throw new WmValidationError(
                `Amount must be positive (got ${amount})`,
                interfaceName,
                'amount'
            );
        }
    }

    /**
     * Validates a description string (non-empty).
     * @param desc - The description to validate
     * @param interfaceName - Name of the interface (for error reporting)
     * @throws WmValidationError if the description is invalid
     */
    static validateDescription(desc: string, interfaceName: string = 'unknown'): void {
        if (!desc || desc.trim().length === 0) {
            throw new WmValidationError(
                'Description is required and cannot be empty',
                interfaceName,
                'desc'
            );
        }
    }

    /**
     * Validates a request number (must be positive integer).
     * @param reqn - The request number to validate
     * @param interfaceName - Name of the interface (for error reporting)
     * @throws WmValidationError if the request number is invalid
     */
    static validateReqn(reqn: number, interfaceName: string = 'unknown'): void {
        if (!Number.isInteger(reqn) || reqn <= 0) {
            throw new WmValidationError(
                'Request number must be a positive integer',
                interfaceName,
                'reqn'
            );
        }
    }

    /**
     * Checks if a value is defined (not null or undefined).
     * @param value - The value to check
     * @param fieldName - Name of the field
     * @param interfaceName - Name of the interface (for error reporting)
     * @throws WmValidationError if the value is null or undefined
     */
    static validateRequired(
        value: any,
        fieldName: string,
        interfaceName: string = 'unknown'
    ): void {
        if (value === null || value === undefined) {
            throw new WmValidationError(`${fieldName} is required`, interfaceName, fieldName);
        }
    }
}
