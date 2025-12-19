/**
 * Base error class for WebMoney operations.
 */
export class WmError extends Error {
    /**
     * Creates a new WmError instance.
     * @param message - Human-readable error message
     * @param code - Error code identifier
     * @param interfaceName - Name of the interface where the error occurred
     * @param details - Additional error details
     */
    constructor(
        message: string,
        public readonly code: string,
        public readonly interfaceName: string,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'WmError';
        Object.setPrototypeOf(this, WmError.prototype);
    }
}

/**
 * Error returned by the WebMoney API with retval and retdesc.
 */
export class WmApiError extends WmError {
    /**
     * Creates a new WmApiError instance.
     * @param message - Human-readable error message
     * @param retval - Return value from WebMoney API (error code)
     * @param retdesc - Return description from WebMoney API
     * @param interfaceName - Name of the interface where the error occurred
     */
    constructor(
        message: string,
        public readonly retval: number,
        public readonly retdesc: string,
        interfaceName: string
    ) {
        super(message, 'API_ERROR', interfaceName, { retval, retdesc });
        this.name = 'WmApiError';
        Object.setPrototypeOf(this, WmApiError.prototype);
    }
}

/**
 * Network-related error (connection failures, timeouts, etc.).
 */
export class WmNetworkError extends WmError {
    /**
     * Creates a new WmNetworkError instance.
     * @param message - Human-readable error message
     * @param interfaceName - Name of the interface where the error occurred
     * @param cause - Original error that caused this network error
     */
    constructor(
        message: string,
        interfaceName: string,
        public readonly cause?: Error
    ) {
        super(message, 'NETWORK_ERROR', interfaceName, { cause });
        this.name = 'WmNetworkError';
        Object.setPrototypeOf(this, WmNetworkError.prototype);
    }
}

/**
 * Validation error for request parameters.
 */
export class WmValidationError extends WmError {
    /**
     * Creates a new WmValidationError instance.
     * @param message - Human-readable error message
     * @param interfaceName - Name of the interface where the error occurred
     * @param field - Name of the field that failed validation
     */
    constructor(
        message: string,
        interfaceName: string,
        public readonly field: string
    ) {
        super(message, 'VALIDATION_ERROR', interfaceName, { field });
        this.name = 'WmValidationError';
        Object.setPrototypeOf(this, WmValidationError.prototype);
    }
}

/**
 * XML parsing or generation error.
 */
export class WmXmlError extends WmError {
    /**
     * Creates a new WmXmlError instance.
     * @param message - Human-readable error message
     * @param interfaceName - Name of the interface where the error occurred
     * @param xmlContent - Partial XML content that caused the error
     */
    constructor(
        message: string,
        interfaceName: string,
        public readonly xmlContent?: string
    ) {
        super(message, 'XML_ERROR', interfaceName, { xmlContent });
        this.name = 'WmXmlError';
        Object.setPrototypeOf(this, WmXmlError.prototype);
    }
}
