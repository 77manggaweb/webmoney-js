import {
    WmError,
    WmApiError,
    WmNetworkError,
    WmValidationError,
    WmXmlError,
} from '../../src/errors/WmError';

describe('WmError', () => {
    describe('WmError base class', () => {
        it('should create an error instance with all properties', () => {
            const error = new WmError('Test error', 'TEST_CODE', 'TestInterface', {
                extra: 'data',
            });

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(WmError);
            expect(error.message).toBe('Test error');
            expect(error.code).toBe('TEST_CODE');
            expect(error.interfaceName).toBe('TestInterface');
            expect(error.details).toEqual({ extra: 'data' });
            expect(error.name).toBe('WmError');
        });

        it('should have code property defined in constructor', () => {
            const error = new WmError('Test', 'CODE', 'Interface');
            expect(error.code).toBe('CODE');
            expect(typeof error.code).toBe('string');
        });

        it('should have interfaceName property defined in constructor', () => {
            const error = new WmError('Test', 'CODE', 'Interface');
            expect(error.interfaceName).toBe('Interface');
            expect(typeof error.interfaceName).toBe('string');
        });

        it('should have details property as readonly', () => {
            const details = { extra: 'data' };
            const error = new WmError('Test', 'CODE', 'Interface', details);
            expect(error.details).toEqual(details);
        });

        it('should work with Error.prototype methods', () => {
            const error = new WmError('Test error', 'CODE', 'Interface');
            expect(error.toString()).toContain('Test error');
            expect(error.stack).toBeDefined();
        });

        it('should create error with optional details parameter', () => {
            const error = new WmError('Test', 'CODE', 'Interface');
            expect(error.details).toBeUndefined();
        });

        it('should preserve error instanceof checks', () => {
            const error = new WmError('Test', 'CODE', 'Interface');
            expect(error instanceof WmError).toBe(true);
            expect(error instanceof Error).toBe(true);
        });
    });

    describe('WmApiError', () => {
        it('should create an API error with retval and retdesc', () => {
            const error = new WmApiError('API error', 1, 'API Error Description', 'X1Interface');

            expect(error).toBeInstanceOf(WmError);
            expect(error).toBeInstanceOf(WmApiError);
            expect(error.message).toBe('API error');
            expect(error.code).toBe('API_ERROR');
            expect(error.retval).toBe(1);
            expect(error.retdesc).toBe('API Error Description');
            expect(error.interfaceName).toBe('X1Interface');
            expect(error.name).toBe('WmApiError');
        });

        it('should store retval and retdesc in details', () => {
            const error = new WmApiError('API error', 123, 'Error description', 'Interface');
            expect(error.details).toEqual({
                retval: 123,
                retdesc: 'Error description',
            });
        });

        it('should preserve error chain', () => {
            const error = new WmApiError('Nested error', 999, 'Server error', 'X2Interface');
            expect(error instanceof WmApiError).toBe(true);
            expect(error instanceof WmError).toBe(true);
            expect(error instanceof Error).toBe(true);
        });

        it('should handle various error codes', () => {
            const codes = [0, 1, 99, 999, 32000];
            codes.forEach((code) => {
                const error = new WmApiError('Test', code, 'Description', 'Interface');
                expect(error.retval).toBe(code);
            });
        });

        it('should handle long error descriptions', () => {
            const longDesc = 'A'.repeat(1000);
            const error = new WmApiError('Test', 1, longDesc, 'Interface');
            expect(error.retdesc).toBe(longDesc);
        });
    });

    describe('WmNetworkError', () => {
        it('should create a network error with cause', () => {
            const cause = new Error('Connection timeout');
            const error = new WmNetworkError('Network failed', 'X1Interface', cause);

            expect(error).toBeInstanceOf(WmError);
            expect(error).toBeInstanceOf(WmNetworkError);
            expect(error.message).toBe('Network failed');
            expect(error.code).toBe('NETWORK_ERROR');
            expect(error.interfaceName).toBe('X1Interface');
            expect(error.cause).toEqual(cause);
            expect(error.name).toBe('WmNetworkError');
        });

        it('should store cause in details', () => {
            const cause = new Error('Connection timeout');
            const error = new WmNetworkError('Network failed', 'Interface', cause);
            expect(error.details).toEqual({ cause });
        });

        it('should work without cause parameter', () => {
            const error = new WmNetworkError('Network failed', 'Interface');
            expect(error.cause).toBeUndefined();
            expect(error.details).toEqual({ cause: undefined });
        });

        it('should handle various error types as cause', () => {
            const typeErrors: any[] = [
                new Error('Generic error'),
                new TypeError('Type error'),
                new RangeError('Range error'),
                new SyntaxError('Syntax error'),
            ];

            typeErrors.forEach((cause) => {
                const error = new WmNetworkError('Network error', 'Interface', cause);
                expect(error.cause).toEqual(cause);
            });
        });

        it('should preserve error chain', () => {
            const cause = new Error('Original cause');
            const error = new WmNetworkError('Network error', 'Interface', cause);
            expect(error instanceof WmNetworkError).toBe(true);
            expect(error instanceof WmError).toBe(true);
            expect(error instanceof Error).toBe(true);
        });
    });

    describe('WmValidationError', () => {
        it('should create a validation error with field', () => {
            const error = new WmValidationError('Validation failed', 'X1Interface', 'wmid');

            expect(error).toBeInstanceOf(WmError);
            expect(error).toBeInstanceOf(WmValidationError);
            expect(error.message).toBe('Validation failed');
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.interfaceName).toBe('X1Interface');
            expect(error.field).toBe('wmid');
            expect(error.name).toBe('WmValidationError');
        });

        it('should store field in details', () => {
            const error = new WmValidationError('Invalid WMID', 'Interface', 'wmid');
            expect(error.details).toEqual({ field: 'wmid' });
        });

        it('should handle various field names', () => {
            const fields = ['wmid', 'purse', 'amount', 'description', 'reqn'];
            fields.forEach((field) => {
                const error = new WmValidationError('Invalid', 'Interface', field);
                expect(error.field).toBe(field);
            });
        });

        it('should preserve error chain', () => {
            const error = new WmValidationError('Invalid field', 'Interface', 'field');
            expect(error instanceof WmValidationError).toBe(true);
            expect(error instanceof WmError).toBe(true);
            expect(error instanceof Error).toBe(true);
        });

        it('should work with empty field name', () => {
            const error = new WmValidationError('Error', 'Interface', '');
            expect(error.field).toBe('');
        });
    });

    describe('WmXmlError', () => {
        it('should create an XML error with xmlContent', () => {
            const xmlContent = '<error>Invalid XML</error>';
            const error = new WmXmlError('XML parsing failed', 'X1Interface', xmlContent);

            expect(error).toBeInstanceOf(WmError);
            expect(error).toBeInstanceOf(WmXmlError);
            expect(error.message).toBe('XML parsing failed');
            expect(error.code).toBe('XML_ERROR');
            expect(error.interfaceName).toBe('X1Interface');
            expect(error.xmlContent).toBe(xmlContent);
            expect(error.name).toBe('WmXmlError');
        });

        it('should store xmlContent in details', () => {
            const xmlContent = '<root><element>data</element></root>';
            const error = new WmXmlError('XML error', 'Interface', xmlContent);
            expect(error.details).toEqual({ xmlContent });
        });

        it('should work without xmlContent parameter', () => {
            const error = new WmXmlError('XML error', 'Interface');
            expect(error.xmlContent).toBeUndefined();
            expect(error.details).toEqual({ xmlContent: undefined });
        });

        it('should handle large XML content', () => {
            const largeXml = '<root>' + '<element>data</element>'.repeat(100) + '</root>';
            const error = new WmXmlError('Error', 'Interface', largeXml);
            expect(error.xmlContent).toBe(largeXml);
        });

        it('should preserve error chain', () => {
            const error = new WmXmlError('XML error', 'Interface', '<root/>');
            expect(error instanceof WmXmlError).toBe(true);
            expect(error instanceof WmError).toBe(true);
            expect(error instanceof Error).toBe(true);
        });

        it('should handle special characters in XML content', () => {
            const xmlContent = '<root><element attr="&lt;&gt;&quot;">&amp;</element></root>';
            const error = new WmXmlError('Error', 'Interface', xmlContent);
            expect(error.xmlContent).toBe(xmlContent);
        });
    });

    describe('Error inheritance and instanceof checks', () => {
        it('should correctly identify error types', () => {
            const baseError = new WmError('Test', 'CODE', 'Interface');
            const apiError = new WmApiError('Test', 1, 'Desc', 'Interface');
            const networkError = new WmNetworkError('Test', 'Interface');
            const validationError = new WmValidationError('Test', 'Interface', 'field');
            const xmlError = new WmXmlError('Test', 'Interface');

            expect(baseError instanceof WmError).toBe(true);
            expect(apiError instanceof WmApiError).toBe(true);
            expect(apiError instanceof WmError).toBe(true);
            expect(networkError instanceof WmNetworkError).toBe(true);
            expect(networkError instanceof WmError).toBe(true);
            expect(validationError instanceof WmValidationError).toBe(true);
            expect(validationError instanceof WmError).toBe(true);
            expect(xmlError instanceof WmXmlError).toBe(true);
            expect(xmlError instanceof WmError).toBe(true);
        });

        it('should all be instances of Error', () => {
            const errors = [
                new WmError('Test', 'CODE', 'Interface'),
                new WmApiError('Test', 1, 'Desc', 'Interface'),
                new WmNetworkError('Test', 'Interface'),
                new WmValidationError('Test', 'Interface', 'field'),
                new WmXmlError('Test', 'Interface'),
            ];

            errors.forEach((error) => {
                expect(error instanceof Error).toBe(true);
            });
        });
    });

    describe('Error messages and naming', () => {
        it('should have correct error names', () => {
            expect(new WmError('Test', 'CODE', 'Interface').name).toBe('WmError');
            expect(new WmApiError('Test', 1, 'Desc', 'Interface').name).toBe('WmApiError');
            expect(new WmNetworkError('Test', 'Interface').name).toBe('WmNetworkError');
            expect(new WmValidationError('Test', 'Interface', 'field').name).toBe(
                'WmValidationError'
            );
            expect(new WmXmlError('Test', 'Interface').name).toBe('WmXmlError');
        });

        it('should have correct error codes', () => {
            expect(new WmError('Test', 'CUSTOM', 'Interface').code).toBe('CUSTOM');
            expect(new WmApiError('Test', 1, 'Desc', 'Interface').code).toBe('API_ERROR');
            expect(new WmNetworkError('Test', 'Interface').code).toBe('NETWORK_ERROR');
            expect(new WmValidationError('Test', 'Interface', 'f').code).toBe('VALIDATION_ERROR');
            expect(new WmXmlError('Test', 'Interface').code).toBe('XML_ERROR');
        });
    });

    describe('Error serialization', () => {
        it('should be serializable to string', () => {
            const errors = [
                new WmError('Test', 'CODE', 'Interface'),
                new WmApiError('Test', 1, 'Desc', 'Interface'),
                new WmNetworkError('Test', 'Interface'),
                new WmValidationError('Test', 'Interface', 'field'),
                new WmXmlError('Test', 'Interface'),
            ];

            errors.forEach((error) => {
                const str = error.toString();
                expect(typeof str).toBe('string');
                expect(str.length).toBeGreaterThan(0);
            });
        });

        it('should have stack trace', () => {
            const errors = [
                new WmError('Test', 'CODE', 'Interface'),
                new WmApiError('Test', 1, 'Desc', 'Interface'),
                new WmNetworkError('Test', 'Interface'),
                new WmValidationError('Test', 'Interface', 'field'),
                new WmXmlError('Test', 'Interface'),
            ];

            errors.forEach((error) => {
                expect(error.stack).toBeDefined();
                expect(error.stack!.length).toBeGreaterThan(0);
            });
        });
    });
});
