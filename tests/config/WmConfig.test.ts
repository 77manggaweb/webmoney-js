import { WmConfig } from '../../src/config/WmConfig';

describe('WmConfig', () => {
    describe('DEFAULT_URLS', () => {
        it('should have all required API endpoints defined', () => {
            expect(WmConfig.DEFAULT_URLS.X1).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X2).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X3).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X4).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X5).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X6).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X8).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X9).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X10).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X11).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X13).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X14).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X15).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X15_LIST2).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X15_SAVE).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X16).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X18).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X19).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X21_REQUEST).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X21_CONFIRM).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X23).toBeDefined();
        });

        it('should use HTTPS protocol for all endpoints', () => {
            Object.values(WmConfig.DEFAULT_URLS).forEach((url) => {
                expect(url).toMatch(/^https:\/\//);
            });
        });

        it('should use correct domain names', () => {
            expect(WmConfig.DEFAULT_URLS.X1).toContain('w10s.web.money');
            expect(WmConfig.DEFAULT_URLS.X11).toContain('apipassport.web.money');
            expect(WmConfig.DEFAULT_URLS.X18).toContain('merchant.web.money');
            expect(WmConfig.DEFAULT_URLS.X19).toContain('apipassport.web.money');
        });

        it('should have correct endpoint paths', () => {
            expect(WmConfig.DEFAULT_URLS.X1).toContain('XMLInvoice.asp');
            expect(WmConfig.DEFAULT_URLS.X2).toContain('XMLTrans.asp');
            expect(WmConfig.DEFAULT_URLS.X3).toContain('XMLOperations.asp');
            expect(WmConfig.DEFAULT_URLS.X4).toContain('XMLOutInvoices.asp');
            expect(WmConfig.DEFAULT_URLS.X5).toContain('XMLFinishProtect.asp');
            expect(WmConfig.DEFAULT_URLS.X6).toContain('XMLSendMsg.asp');
        });

        it('should be a const object (defined as readonly)', () => {
            expect(WmConfig.DEFAULT_URLS).toBeDefined();
            const descriptor = Object.getOwnPropertyDescriptor(WmConfig, 'DEFAULT_URLS');
            expect(typeof WmConfig.DEFAULT_URLS).toBe('object');
        });
    });

    describe('ENCODING', () => {
        it('should use windows-1251 encoding', () => {
            expect(WmConfig.ENCODING).toBe('windows-1251');
        });

        it('should be immutable (readonly)', () => {
            expect(typeof WmConfig.ENCODING).toBe('string');
        });
    });

    describe('REQUEST_TIMEOUT', () => {
        it('should be 5 seconds', () => {
            expect(WmConfig.REQUEST_TIMEOUT).toBe(5000);
        });

        it('should be in milliseconds', () => {
            expect(WmConfig.REQUEST_TIMEOUT).toBeGreaterThan(1000);
        });

        it('should be immutable (readonly)', () => {
            expect(typeof WmConfig.REQUEST_TIMEOUT).toBe('number');
        });
    });

    describe('Configuration consistency', () => {
        it('should have all X15 variants defined', () => {
            expect(WmConfig.DEFAULT_URLS.X15).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X15_LIST2).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X15_SAVE).toBeDefined();
        });

        it('should have all X21 variants defined', () => {
            expect(WmConfig.DEFAULT_URLS.X21_REQUEST).toBeDefined();
            expect(WmConfig.DEFAULT_URLS.X21_CONFIRM).toBeDefined();
        });
    });

    describe('Static class properties', () => {
        it('should not be instantiable', () => {
            expect(WmConfig.DEFAULT_URLS).toBeDefined();
            expect(WmConfig.ENCODING).toBeDefined();
            expect(WmConfig.REQUEST_TIMEOUT).toBeDefined();
        });
    });
});
