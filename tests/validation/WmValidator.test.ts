import { WmValidator } from '../../src/validation/WmValidator';
import { WmValidationError } from '../../src/errors/WmError';

describe('WmValidator', () => {
    describe('validateWmid', () => {
        it('should accept valid WMID (12 digits)', () => {
            expect(() => {
                WmValidator.validateWmid('374625125435');
            }).not.toThrow();
        });

        it('should throw for empty WMID', () => {
            expect(() => {
                WmValidator.validateWmid('');
            }).toThrow(WmValidationError);
        });

        it('should throw for null WMID', () => {
            expect(() => {
                WmValidator.validateWmid(null as any);
            }).toThrow(WmValidationError);
        });

        it('should throw for undefined WMID', () => {
            expect(() => {
                WmValidator.validateWmid(undefined as any);
            }).toThrow(WmValidationError);
        });

        it('should throw for WMID with less than 12 digits', () => {
            expect(() => {
                WmValidator.validateWmid('37462512543');
            }).toThrow(WmValidationError);
        });

        it('should throw for WMID with more than 12 digits', () => {
            expect(() => {
                WmValidator.validateWmid('3746251254351');
            }).toThrow(WmValidationError);
        });

        it('should throw for WMID with non-digit characters', () => {
            expect(() => {
                WmValidator.validateWmid('37462512543a');
            }).toThrow(WmValidationError);
        });

        it('should throw for WMID with spaces', () => {
            expect(() => {
                WmValidator.validateWmid('37462512 543');
            }).toThrow(WmValidationError);
        });

        it('should throw for WMID with special characters', () => {
            expect(() => {
                WmValidator.validateWmid('374625125-43');
            }).toThrow(WmValidationError);
        });

        it('should include interface name in error', () => {
            try {
                WmValidator.validateWmid('invalid', 'TestInterface');
                fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(WmValidationError);
                expect((error as WmValidationError).interfaceName).toBe('TestInterface');
            }
        });

        it('should include field name in error', () => {
            try {
                WmValidator.validateWmid('invalid');
                fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(WmValidationError);
                expect((error as WmValidationError).field).toBe('wmid');
            }
        });

        it('should use default interface name if not provided', () => {
            try {
                WmValidator.validateWmid('invalid');
                fail('Should have thrown');
            } catch (error) {
                expect((error as WmValidationError).interfaceName).toBe('unknown');
            }
        });

        it('should accept multiple valid WMIDs', () => {
            const validWmids = ['000000000000', '111111111111', '999999999999', '374625125435'];

            validWmids.forEach((wmid) => {
                expect(() => {
                    WmValidator.validateWmid(wmid);
                }).not.toThrow();
            });
        });
    });

    describe('validatePurse', () => {
        it('should accept valid purse format', () => {
            expect(() => {
                WmValidator.validatePurse('Z374625125435');
            }).not.toThrow();
        });

        it('should accept all valid currency letters', () => {
            const letters = 'ZRDECXGHKUVYPTFM'.split('');
            letters.forEach((letter) => {
                expect(() => {
                    WmValidator.validatePurse(`${letter}374625125435`);
                }).not.toThrow();
            });
        });

        it('should throw for empty purse', () => {
            expect(() => {
                WmValidator.validatePurse('');
            }).toThrow(WmValidationError);
        });

        it('should throw for null purse', () => {
            expect(() => {
                WmValidator.validatePurse(null as any);
            }).toThrow(WmValidationError);
        });

        it('should throw for undefined purse', () => {
            expect(() => {
                WmValidator.validatePurse(undefined as any);
            }).toThrow(WmValidationError);
        });

        it('should throw for invalid currency letter', () => {
            expect(() => {
                WmValidator.validatePurse('A374625125435');
            }).toThrow(WmValidationError);
        });

        it('should throw for lowercase currency letter', () => {
            expect(() => {
                WmValidator.validatePurse('z374625125435');
            }).toThrow(WmValidationError);
        });

        it('should throw for purse with insufficient digits', () => {
            expect(() => {
                WmValidator.validatePurse('Z37462512543');
            }).toThrow(WmValidationError);
        });

        it('should throw for purse with too many digits', () => {
            expect(() => {
                WmValidator.validatePurse('Z3746251254351');
            }).toThrow(WmValidationError);
        });

        it('should throw for purse with non-digit suffix', () => {
            expect(() => {
                WmValidator.validatePurse('Z37462512543a');
            }).toThrow(WmValidationError);
        });

        it('should throw for purse with spaces', () => {
            expect(() => {
                WmValidator.validatePurse('Z 374625125435');
            }).toThrow(WmValidationError);
        });

        it('should include field name in error', () => {
            try {
                WmValidator.validatePurse('invalid');
                fail('Should have thrown');
            } catch (error) {
                expect((error as WmValidationError).field).toBe('purse');
            }
        });
    });

    describe('validateAmount', () => {
        it('should accept positive numbers', () => {
            expect(() => {
                WmValidator.validateAmount(100);
            }).not.toThrow();
        });

        it('should accept small positive amounts', () => {
            expect(() => {
                WmValidator.validateAmount(0.01);
            }).not.toThrow();
        });

        it('should accept large amounts', () => {
            expect(() => {
                WmValidator.validateAmount(999999999);
            }).not.toThrow();
        });

        it('should throw for zero amount', () => {
            expect(() => {
                WmValidator.validateAmount(0);
            }).toThrow(WmValidationError);
        });

        it('should throw for negative amount', () => {
            expect(() => {
                WmValidator.validateAmount(-100);
            }).toThrow(WmValidationError);
        });

        it('should throw for undefined amount', () => {
            expect(() => {
                WmValidator.validateAmount(undefined as any);
            }).toThrow(WmValidationError);
        });

        it('should throw for null amount', () => {
            expect(() => {
                WmValidator.validateAmount(null as any);
            }).toThrow(WmValidationError);
        });

        it('should throw for NaN', () => {
            expect(() => {
                WmValidator.validateAmount(NaN);
            }).toThrow(WmValidationError);
        });

        it('should throw for Infinity', () => {
            expect(() => {
                WmValidator.validateAmount(Infinity);
            }).toThrow(WmValidationError);
        });

        it('should throw for negative Infinity', () => {
            expect(() => {
                WmValidator.validateAmount(-Infinity);
            }).toThrow(WmValidationError);
        });

        it('should include field name in error', () => {
            try {
                WmValidator.validateAmount(-10);
                fail('Should have thrown');
            } catch (error) {
                expect((error as WmValidationError).field).toBe('amount');
            }
        });
    });

    describe('validateDescription', () => {
        it('should accept non-empty description', () => {
            expect(() => {
                WmValidator.validateDescription('Test description');
            }).not.toThrow();
        });

        it('should accept description with special characters', () => {
            expect(() => {
                WmValidator.validateDescription('Test: with @special #chars!');
            }).not.toThrow();
        });

        it('should accept Unicode description', () => {
            expect(() => {
                WmValidator.validateDescription('Тестовое описание');
            }).not.toThrow();
        });

        it('should throw for empty description', () => {
            expect(() => {
                WmValidator.validateDescription('');
            }).toThrow(WmValidationError);
        });

        it('should throw for null description', () => {
            expect(() => {
                WmValidator.validateDescription(null as any);
            }).toThrow(WmValidationError);
        });

        it('should throw for undefined description', () => {
            expect(() => {
                WmValidator.validateDescription(undefined as any);
            }).toThrow(WmValidationError);
        });

        it('should throw for whitespace-only description', () => {
            expect(() => {
                WmValidator.validateDescription('   ');
            }).toThrow(WmValidationError);
        });

        it('should throw for tab-only description', () => {
            expect(() => {
                WmValidator.validateDescription('\t\t');
            }).toThrow(WmValidationError);
        });

        it('should throw for newline-only description', () => {
            expect(() => {
                WmValidator.validateDescription('\n\n');
            }).toThrow(WmValidationError);
        });

        it('should include field name in error', () => {
            try {
                WmValidator.validateDescription('');
                fail('Should have thrown');
            } catch (error) {
                expect((error as WmValidationError).field).toBe('desc');
            }
        });
    });

    describe('validateReqn', () => {
        it('should accept positive integers', () => {
            expect(() => {
                WmValidator.validateReqn(1);
            }).not.toThrow();
        });

        it('should accept large positive integers', () => {
            expect(() => {
                WmValidator.validateReqn(999999999);
            }).not.toThrow();
        });

        it('should throw for zero', () => {
            expect(() => {
                WmValidator.validateReqn(0);
            }).toThrow(WmValidationError);
        });

        it('should throw for negative integer', () => {
            expect(() => {
                WmValidator.validateReqn(-1);
            }).toThrow(WmValidationError);
        });

        it('should throw for float', () => {
            expect(() => {
                WmValidator.validateReqn(1.5);
            }).toThrow(WmValidationError);
        });

        it('should throw for NaN', () => {
            expect(() => {
                WmValidator.validateReqn(NaN);
            }).toThrow(WmValidationError);
        });

        it('should throw for Infinity', () => {
            expect(() => {
                WmValidator.validateReqn(Infinity);
            }).toThrow(WmValidationError);
        });

        it('should include field name in error', () => {
            try {
                WmValidator.validateReqn(0);
                fail('Should have thrown');
            } catch (error) {
                expect((error as WmValidationError).field).toBe('reqn');
            }
        });
    });

    describe('validateRequired', () => {
        it('should pass for non-null values', () => {
            expect(() => {
                WmValidator.validateRequired('value', 'field');
            }).not.toThrow();
        });

        it('should pass for empty string', () => {
            expect(() => {
                WmValidator.validateRequired('', 'field');
            }).not.toThrow();
        });

        it('should pass for zero', () => {
            expect(() => {
                WmValidator.validateRequired(0, 'field');
            }).not.toThrow();
        });

        it('should pass for false', () => {
            expect(() => {
                WmValidator.validateRequired(false, 'field');
            }).not.toThrow();
        });

        it('should pass for empty array', () => {
            expect(() => {
                WmValidator.validateRequired([], 'field');
            }).not.toThrow();
        });

        it('should pass for empty object', () => {
            expect(() => {
                WmValidator.validateRequired({}, 'field');
            }).not.toThrow();
        });

        it('should throw for null', () => {
            expect(() => {
                WmValidator.validateRequired(null, 'field');
            }).toThrow(WmValidationError);
        });

        it('should throw for undefined', () => {
            expect(() => {
                WmValidator.validateRequired(undefined, 'field');
            }).toThrow(WmValidationError);
        });

        it('should include field name in error message', () => {
            try {
                WmValidator.validateRequired(null, 'myField');
                fail('Should have thrown');
            } catch (error) {
                expect((error as WmValidationError).message).toContain('myField');
            }
        });

        it('should include field name in error details', () => {
            try {
                WmValidator.validateRequired(null, 'myField');
                fail('Should have thrown');
            } catch (error) {
                expect((error as WmValidationError).field).toBe('myField');
            }
        });

        it('should use custom interface name', () => {
            try {
                WmValidator.validateRequired(null, 'field', 'CustomInterface');
                fail('Should have thrown');
            } catch (error) {
                expect((error as WmValidationError).interfaceName).toBe('CustomInterface');
            }
        });
    });

    describe('Error behavior', () => {
        it('should throw WmValidationError instances', () => {
            const validators = [
                () => WmValidator.validateWmid('invalid'),
                () => WmValidator.validatePurse('invalid'),
                () => WmValidator.validateAmount(-1),
                () => WmValidator.validateDescription(''),
                () => WmValidator.validateReqn(0),
                () => WmValidator.validateRequired(null, 'field'),
            ];

            validators.forEach((fn) => {
                try {
                    fn();
                    fail('Should have thrown');
                } catch (error) {
                    expect(error).toBeInstanceOf(WmValidationError);
                }
            });
        });

        it('should set error code to VALIDATION_ERROR', () => {
            try {
                WmValidator.validateWmid('invalid');
            } catch (error) {
                expect((error as WmValidationError).code).toBe('VALIDATION_ERROR');
            }
        });

        it('should set error name to WmValidationError', () => {
            try {
                WmValidator.validateWmid('invalid');
            } catch (error) {
                expect((error as WmValidationError).name).toBe('WmValidationError');
            }
        });
    });

    describe('Interface name parameter', () => {
        it('should use provided interface name', () => {
            try {
                WmValidator.validateWmid('invalid', 'X1Interface');
            } catch (error) {
                expect((error as WmValidationError).interfaceName).toBe('X1Interface');
            }
        });

        it('should use default unknown if not provided', () => {
            try {
                WmValidator.validateWmid('invalid');
            } catch (error) {
                expect((error as WmValidationError).interfaceName).toBe('unknown');
            }
        });

        it('should work with all validation methods', () => {
            const methods = [
                (intf: string) => WmValidator.validateWmid('inv', intf),
                (intf: string) => WmValidator.validatePurse('inv', intf),
                (intf: string) => WmValidator.validateAmount(-1, intf),
                (intf: string) => WmValidator.validateDescription('', intf),
                (intf: string) => WmValidator.validateReqn(0, intf),
                (intf: string) => WmValidator.validateRequired(null, 'f', intf),
            ];

            methods.forEach((fn) => {
                try {
                    fn('TestInterface');
                } catch (error) {
                    expect((error as WmValidationError).interfaceName).toBe('TestInterface');
                }
            });
        });
    });

    describe('Static class behavior', () => {
        it('should have all methods accessible as static', () => {
            expect(typeof WmValidator.validateWmid).toBe('function');
            expect(typeof WmValidator.validatePurse).toBe('function');
            expect(typeof WmValidator.validateAmount).toBe('function');
            expect(typeof WmValidator.validateDescription).toBe('function');
            expect(typeof WmValidator.validateReqn).toBe('function');
            expect(typeof WmValidator.validateRequired).toBe('function');
        });
    });
});
