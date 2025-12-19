import { WmLogger } from '../../src/utils/WmLogger';

describe('WmLogger', () => {
    let originalCallback: any;

    beforeEach(() => {
        WmLogger.clearLogger();
    });

    describe('setLogger', () => {
        it('should set a custom logging callback', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);

            WmLogger.info('test message');
            expect(callback).toHaveBeenCalledWith('info', 'test message', undefined);
        });

        it('should replace previous callback when set again', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            WmLogger.setLogger(callback1);
            WmLogger.debug('message');
            expect(callback1).toHaveBeenCalled();

            WmLogger.setLogger(callback2);
            WmLogger.debug('message');
            expect(callback2).toHaveBeenCalled();
        });

        it('should work with complex callback functions', () => {
            const logs: any[] = [];
            WmLogger.setLogger((level, message, data) => {
                logs.push({ level, message, data });
            });

            WmLogger.info('test');
            expect(logs).toEqual([{ level: 'info', message: 'test', data: undefined }]);
        });
    });

    describe('clearLogger', () => {
        it('should clear the logging callback', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);
            WmLogger.clearLogger();

            WmLogger.info('test message');
            expect(callback).not.toHaveBeenCalled();
        });

        it('should allow logging without callback after clear', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);
            WmLogger.clearLogger();

            expect(() => {
                WmLogger.debug('message');
                WmLogger.info('message');
                WmLogger.warn('message');
                WmLogger.error('message');
            }).not.toThrow();
        });

        it('should be callable multiple times', () => {
            expect(() => {
                WmLogger.clearLogger();
                WmLogger.clearLogger();
                WmLogger.clearLogger();
            }).not.toThrow();
        });
    });

    describe('debug', () => {
        it('should call callback with debug level', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);

            WmLogger.debug('debug message');
            expect(callback).toHaveBeenCalledWith('debug', 'debug message', undefined);
        });

        it('should pass data parameter to callback', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);
            const data = { key: 'value' };

            WmLogger.debug('debug message', data);
            expect(callback).toHaveBeenCalledWith('debug', 'debug message', data);
        });

        it('should not call callback when logger is not set', () => {
            const callback = jest.fn();
            expect(() => {
                WmLogger.debug('message');
            }).not.toThrow();
        });

        it('should handle empty message', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);

            WmLogger.debug('');
            expect(callback).toHaveBeenCalledWith('debug', '', undefined);
        });

        it('should handle various data types', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);

            const dataValues = [
                { obj: 'ect' },
                ['array', 'data'],
                'string data',
                123,
                true,
                null,
                undefined,
            ];

            dataValues.forEach((data) => {
                callback.mockClear();
                WmLogger.debug('message', data);
                expect(callback).toHaveBeenCalledWith('debug', 'message', data);
            });
        });
    });

    describe('info', () => {
        it('should call callback with info level', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);

            WmLogger.info('info message');
            expect(callback).toHaveBeenCalledWith('info', 'info message', undefined);
        });

        it('should pass data parameter to callback', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);
            const data = { info: 'data' };

            WmLogger.info('info message', data);
            expect(callback).toHaveBeenCalledWith('info', 'info message', data);
        });

        it('should not call callback when logger is not set', () => {
            expect(() => {
                WmLogger.info('message');
            }).not.toThrow();
        });

        it('should handle long messages', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);
            const longMessage = 'a'.repeat(10000);

            WmLogger.info(longMessage);
            expect(callback).toHaveBeenCalledWith('info', longMessage, undefined);
        });
    });

    describe('warn', () => {
        it('should call callback with warn level', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);

            WmLogger.warn('warning message');
            expect(callback).toHaveBeenCalledWith('warn', 'warning message', undefined);
        });

        it('should pass data parameter to callback', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);
            const data = { warning: 'details' };

            WmLogger.warn('warning message', data);
            expect(callback).toHaveBeenCalledWith('warn', 'warning message', data);
        });

        it('should not call callback when logger is not set', () => {
            expect(() => {
                WmLogger.warn('message');
            }).not.toThrow();
        });

        it('should work with error objects as data', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);
            const error = new Error('test error');

            WmLogger.warn('warning', error);
            expect(callback).toHaveBeenCalledWith('warn', 'warning', error);
        });
    });

    describe('error', () => {
        it('should call callback with error level', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);

            WmLogger.error('error message');
            expect(callback).toHaveBeenCalledWith('error', 'error message', undefined);
        });

        it('should pass data parameter to callback', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);
            const data = { error: 'details' };

            WmLogger.error('error message', data);
            expect(callback).toHaveBeenCalledWith('error', 'error message', data);
        });

        it('should not call callback when logger is not set', () => {
            expect(() => {
                WmLogger.error('message');
            }).not.toThrow();
        });

        it('should work with Error objects as data', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);
            const error = new Error('test error');
            error.stack = 'stack trace';

            WmLogger.error('error', error);
            expect(callback).toHaveBeenCalledWith('error', 'error', error);
        });
    });

    describe('Log levels', () => {
        it('should support all log levels', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);

            WmLogger.debug('debug');
            WmLogger.info('info');
            WmLogger.warn('warn');
            WmLogger.error('error');

            expect(callback).toHaveBeenCalledTimes(4);
            expect(callback.mock.calls[0][0]).toBe('debug');
            expect(callback.mock.calls[1][0]).toBe('info');
            expect(callback.mock.calls[2][0]).toBe('warn');
            expect(callback.mock.calls[3][0]).toBe('error');
        });

        it('should pass correct level to callback', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);

            const levels: Array<{ fn: () => void; level: string }> = [
                { fn: () => WmLogger.debug('msg'), level: 'debug' },
                { fn: () => WmLogger.info('msg'), level: 'info' },
                { fn: () => WmLogger.warn('msg'), level: 'warn' },
                { fn: () => WmLogger.error('msg'), level: 'error' },
            ];

            levels.forEach(({ fn, level }) => {
                callback.mockClear();
                fn();
                expect(callback.mock.calls[0][0]).toBe(level);
            });
        });
    });

    describe('Multiple logging calls', () => {
        it('should handle multiple logging calls in sequence', () => {
            const logs: any[] = [];
            WmLogger.setLogger((level, message, data) => {
                logs.push({ level, message, data });
            });

            WmLogger.debug('debug 1');
            WmLogger.info('info 1');
            WmLogger.warn('warn 1');
            WmLogger.error('error 1');

            expect(logs.length).toBe(4);
            expect(logs[0].level).toBe('debug');
            expect(logs[1].level).toBe('info');
            expect(logs[2].level).toBe('warn');
            expect(logs[3].level).toBe('error');
        });

        it('should maintain log order', () => {
            const logs: string[] = [];
            WmLogger.setLogger((level, message) => {
                logs.push(message);
            });

            const messages = ['first', 'second', 'third', 'fourth', 'fifth'];
            messages.forEach((msg) => WmLogger.info(msg));

            expect(logs).toEqual(messages);
        });
    });

    describe('Data handling', () => {
        it('should pass undefined when no data provided', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);

            WmLogger.info('message');
            expect(callback.mock.calls[0][2]).toBeUndefined();
        });

        it('should pass data as-is without modification', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);

            const complexData = {
                nested: {
                    deeply: {
                        nested: [1, 2, 3],
                    },
                },
                fn: () => 'function',
            };

            WmLogger.info('message', complexData);
            expect(callback.mock.calls[0][2]).toBe(complexData);
        });

        it('should handle circular references in data', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);

            const circularData: any = { name: 'test' };
            circularData.self = circularData;

            expect(() => {
                WmLogger.info('message', circularData);
            }).not.toThrow();

            expect(callback).toHaveBeenCalled();
        });
    });

    describe('Edge cases', () => {
        it('should handle Unicode characters in messages', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);

            WmLogger.info('Unicode: 日本語 🚀 Ελληνικά');
            expect(callback).toHaveBeenCalledWith('info', 'Unicode: 日本語 🚀 Ελληνικά', undefined);
        });

        it('should handle special characters in messages', () => {
            const callback = jest.fn();
            WmLogger.setLogger(callback);

            const special = 'Special: \n\t\r\\ "quotes" \'single\'';
            WmLogger.info(special);
            expect(callback).toHaveBeenCalledWith('info', special, undefined);
        });

        it('should not throw when callback throws', () => {
            const callback = jest.fn(() => {
                throw new Error('Callback error');
            });
            WmLogger.setLogger(callback);

            expect(() => {
                WmLogger.info('message');
            }).toThrow('Callback error');
        });
    });

    describe('Static behavior', () => {
        it('should maintain state across multiple operations', () => {
            const logs: any[] = [];
            const callback = (level: string, message: string, data?: any) => {
                logs.push({ level, message, data });
            };

            WmLogger.setLogger(callback);

            WmLogger.debug('msg1');
            WmLogger.info('msg2');

            expect(logs.length).toBe(2);

            WmLogger.clearLogger();

            WmLogger.debug('msg3');

            expect(logs.length).toBe(2);
        });

        it('should have only static methods', () => {
            expect(typeof WmLogger.setLogger).toBe('function');
            expect(typeof WmLogger.clearLogger).toBe('function');
            expect(typeof WmLogger.debug).toBe('function');
            expect(typeof WmLogger.info).toBe('function');
            expect(typeof WmLogger.warn).toBe('function');
            expect(typeof WmLogger.error).toBe('function');
        });
    });
});
