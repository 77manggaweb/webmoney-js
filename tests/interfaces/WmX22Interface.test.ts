import { WmX22Interface, WmX22Request } from '../../src/interfaces/WmXmlX22Interface';

global.fetch = jest.fn();

describe('WmX22Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX22Interface;

    beforeEach(() => {
        wmInterface = new WmX22Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create instance with valid parameters', () => {
            expect(wmInterface).toBeInstanceOf(WmX22Interface);
        });

        it('should create instance with custom API URL', () => {
            const customInterface = new WmX22Interface(testWmid, testKey, 'https://custom.api.url');
            expect(customInterface).toBeInstanceOf(WmX22Interface);
        });
    });

    describe('receiveTicket', () => {
        const mockRequest: WmX22Request = {
            validityperiodinhours: 24,
            lang: 'en',
            lmi_payee_purse: 'Z123456789012',
            lmi_payment_no: 'PAYMENT123',
            lmi_payment_amount: 100.5,
            lmi_payment_desc: 'Test payment description',
            lmi_onetimepay: 1,
            paymenttags: {
                LMI_PAYMENT_NOTIFICATION_URL: 'https://example.com/notify',
                LMI_SUCCESS_URL: 'https://example.com/success',
                LMI_FAILURE_URL: 'https://example.com/failure',
            },
        };

        it('should successfully receive ticket with full response', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <transtoken>TOKEN123456789</transtoken>
          <payurl>https://merchant.web.money/asp/WebFormPay.aspx?token=TOKEN123456789</payurl>
          <validityperiodinhours>24</validityperiodinhours>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.receiveTicket(mockRequest);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.retdesc).toBe('Success');
            expect(result.transtoken).toBe('TOKEN123456789');
            expect(result.payurl).toBe(
                'https://merchant.web.money/asp/WebFormPay.aspx?token=TOKEN123456789'
            );
            expect(result.validityperiodinhours).toBe('24');
        });

        it('should handle response without optional fields', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.receiveTicket(mockRequest);

            expect(result.retval).toBe(0);
            expect(result.retdesc).toBe('Success');
            expect(result.transtoken).toBeUndefined();
            expect(result.payurl).toBeUndefined();
            expect(result.validityperiodinhours).toBeUndefined();
        });

        it('should handle response with partial optional fields', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <transtoken>TOKEN123456789</transtoken>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.receiveTicket(mockRequest);

            expect(result.retval).toBe(0);
            expect(result.transtoken).toBe('TOKEN123456789');
            expect(result.payurl).toBeUndefined();
            expect(result.validityperiodinhours).toBeUndefined();
        });

        it('should handle API error response', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <reqn>1234567890</reqn>
          <retval>-3</retval>
          <retdesc>Invalid signature</retdesc>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            await expect(wmInterface.receiveTicket(mockRequest)).rejects.toThrow(
                'WebMoney API returned error code -3'
            );
        });

        it('should handle HTTP error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: async () => 'Server error',
            });

            await expect(wmInterface.receiveTicket(mockRequest)).rejects.toThrow('HTTP error');
        });

        it('should handle HTML response instead of XML', async () => {
            const mockHtmlResponse = '<html><body>Error page</body></html>';

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockHtmlResponse).buffer;
                },
            });

            await expect(wmInterface.receiveTicket(mockRequest)).rejects.toThrow(
                'Received HTML response instead of XML'
            );
        });

        it('should handle empty response', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    return new ArrayBuffer(0);
                },
            });

            await expect(wmInterface.receiveTicket(mockRequest)).rejects.toThrow('Empty response');
        });

        it('should handle network error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            await expect(wmInterface.receiveTicket(mockRequest)).rejects.toThrow('Network error');
        });

        it('should call correct API endpoint', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            await wmInterface.receiveTicket(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://merchant.web.money/conf/xml/XMLTransSave.asp',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/xml; charset=windows-1251',
                    }),
                })
            );
        });

        it('should include custom API URL in request', async () => {
            const customUrl = 'https://custom.merchant.api/endpoint';
            const customInterface = new WmX22Interface(testWmid, testKey, customUrl);

            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            await customInterface.receiveTicket(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(customUrl, expect.any(Object));
        });

        it('should include paymenttags in request', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            await wmInterface.receiveTicket(mockRequest);

            const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
            const requestBody = fetchCall[1].body;
            const bodyArray = Array.from(new Uint8Array(requestBody));
            const bodyText = new TextDecoder('windows-1251').decode(new Uint8Array(bodyArray));

            expect(bodyText).toContain('LMI_PAYMENT_NOTIFICATION_URL');
            expect(bodyText).toContain('https://example.com/notify');
            expect(bodyText).toContain('LMI_SUCCESS_URL');
            expect(bodyText).toContain('https://example.com/success');
            expect(bodyText).toContain('LMI_FAILURE_URL');
            expect(bodyText).toContain('https://example.com/failure');
        });

        it('should handle request without paymenttags', async () => {
            const requestWithoutTags: WmX22Request = {
                validityperiodinhours: 24,
                lang: 'en',
                lmi_payee_purse: 'Z123456789012',
                lmi_payment_no: 'PAYMENT123',
                lmi_payment_amount: 100.5,
                lmi_payment_desc: 'Test payment description',
                lmi_onetimepay: 1,
                paymenttags: {},
            };

            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.receiveTicket(requestWithoutTags);

            expect(result.retval).toBe(0);
        });

        it('should validate required fields', async () => {
            const invalidRequest = {
                validityperiodinhours: 24,
                lang: 'en',
                // Missing lmi_payee_purse
                lmi_payment_no: 'PAYMENT123',
                lmi_payment_amount: 100.5,
                lmi_payment_desc: 'Test payment description',
                lmi_onetimepay: 1,
                paymenttags: {},
            } as any;

            await expect(wmInterface.receiveTicket(invalidRequest)).rejects.toThrow();
        });

        it('should validate purse format', async () => {
            const invalidRequest: WmX22Request = {
                validityperiodinhours: 24,
                lang: 'en',
                lmi_payee_purse: 'INVALID_PURSE',
                lmi_payment_no: 'PAYMENT123',
                lmi_payment_amount: 100.5,
                lmi_payment_desc: 'Test payment description',
                lmi_onetimepay: 1,
                paymenttags: {},
            };

            await expect(wmInterface.receiveTicket(invalidRequest)).rejects.toThrow();
        });

        it('should validate payment amount', async () => {
            const invalidRequest: WmX22Request = {
                validityperiodinhours: 24,
                lang: 'en',
                lmi_payee_purse: 'Z123456789012',
                lmi_payment_no: 'PAYMENT123',
                lmi_payment_amount: -100, // Invalid negative amount
                lmi_payment_desc: 'Test payment description',
                lmi_onetimepay: 1,
                paymenttags: {},
            };

            await expect(wmInterface.receiveTicket(invalidRequest)).rejects.toThrow();
        });

        it('should handle different validity periods', async () => {
            const requestWithDifferentPeriod: WmX22Request = {
                validityperiodinhours: 48,
                lang: 'ru',
                lmi_payee_purse: 'Z123456789012',
                lmi_payment_no: 'PAYMENT123',
                lmi_payment_amount: 200.75,
                lmi_payment_desc: 'Test payment description',
                lmi_onetimepay: 0,
                paymenttags: {},
            };

            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <transtoken>TOKEN987654321</transtoken>
          <payurl>https://merchant.web.money/asp/WebFormPay.aspx?token=TOKEN987654321</payurl>
          <validityperiodinhours>48</validityperiodinhours>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.receiveTicket(requestWithDifferentPeriod);

            expect(result.retval).toBe(0);
            expect(result.validityperiodinhours).toBe('48');
        });
    });
});
