import {
    WmX21Interface,
    WmX21TrustRequestRequest,
    WmX21TrustConfirmRequest,
} from '../../src/interfaces/WmXmlX21Interface';

global.fetch = jest.fn();

describe('WmX21Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX21Interface;

    beforeEach(() => {
        wmInterface = new WmX21Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create instance with valid parameters', () => {
            expect(wmInterface).toBeInstanceOf(WmX21Interface);
        });

        it('should create instance with custom API URLs', () => {
            const customInterface = new WmX21Interface(
                testWmid,
                testKey,
                'https://custom1.api.url',
                'https://custom2.api.url'
            );
            expect(customInterface).toBeInstanceOf(WmX21Interface);
        });
    });

    describe('trustRequest', () => {
        const mockRequest: WmX21TrustRequestRequest = {
            lmi_payee_purse: 'Z123456789012',
            lmi_day_limit: 100,
            lmi_week_limit: 500,
            lmi_month_limit: 1000,
            lmi_clientnumber: '+79001234567',
            lmi_clientnumber_type: 1,
            lmi_sms_type: 1,
            lang: 'en',
        };

        it('should successfully initiate trust request', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <userdesc>SMS sent to your phone</userdesc>
          <trust purseid="PURSE123456">
            <realsmstype>1</realsmstype>
          </trust>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.trustRequest(mockRequest);

            expect(result).toBeDefined();
            expect(result.retval).toBe(0);
            expect(result.retdesc).toBe('Success');
            expect(result.userdesc).toBe('SMS sent to your phone');
            expect(result.trust).toBeDefined();
            expect(result.trust?.purseid).toBe('PURSE123456');
            expect(result.trust?.realsmstype).toBe('1');
        });

        it('should handle response without trust block', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
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

            const result = await wmInterface.trustRequest(mockRequest);

            expect(result.retval).toBe(0);
            expect(result.trust).toBeUndefined();
        });

        it('should handle response without userdesc', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
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

            const result = await wmInterface.trustRequest(mockRequest);

            expect(result.retval).toBe(0);
            expect(result.userdesc).toBeUndefined();
        });

        it('should handle API error response', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <retval>-1</retval>
          <retdesc>Invalid purse</retdesc>
          <userdesc>The specified purse does not exist</userdesc>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            const result = await wmInterface.trustRequest(mockRequest);

            expect(result.retval).toBe(-1);
            expect(result.retdesc).toBe('Invalid purse');
            expect(result.userdesc).toBe('The specified purse does not exist');
            expect(result.trust).toBeUndefined();
        });

        it('should handle HTTP error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            });

            await expect(wmInterface.trustRequest(mockRequest)).rejects.toThrow('HTTP error');
        });

        it('should handle HTML response instead of XML', async () => {
            const mockHtmlResponse = '<!DOCTYPE html><html><body>Error</body></html>';

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockHtmlResponse).buffer;
                },
            });

            await expect(wmInterface.trustRequest(mockRequest)).rejects.toThrow(
                'Received HTML response instead of XML'
            );
        });

        it('should handle empty response', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode('').buffer;
                },
            });

            await expect(wmInterface.trustRequest(mockRequest)).rejects.toThrow('Empty response');
        });

        it('should handle network error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(wmInterface.trustRequest(mockRequest)).rejects.toThrow('Network error');
        });

        it('should call correct API endpoint', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
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

            await wmInterface.trustRequest(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://merchant.web.money/conf/xml/XMLTrustRequest.asp',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/xml; charset=windows-1251',
                    }),
                })
            );
        });
    });

    describe('trustConfirm', () => {
        const mockRequest: WmX21TrustConfirmRequest = {
            lmi_purseid: 'Z123456789012',
            lmi_clientnumber_code: '123456',
            lang: 'en',
        };

        it('should successfully confirm trust with SMS code', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <userdesc>Trust confirmed successfully</userdesc>
          <trust id="999888777">
            <slavepurse>Z123456789012</slavepurse>
            <slavewmid>123456789012</slavewmid>
            <masterwmid>987654321098</masterwmid>
          </trust>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.trustConfirm(mockRequest);

            expect(result).toBeDefined();
            expect(result.retval).toBe(0);
            expect(result.retdesc).toBe('Success');
            expect(result.userdesc).toBe('Trust confirmed successfully');
            expect(result.trust).toBeDefined();
            expect(result.trust?.id).toBe('999888777');
            expect(result.trust?.slavepurse).toBe('Z123456789012');
            expect(result.trust?.slavewmid).toBe('123456789012');
            expect(result.trust?.masterwmid).toBe('987654321098');
        });

        it('should handle request without lang parameter', async () => {
            const requestWithoutLang: WmX21TrustConfirmRequest = {
                lmi_purseid: 'Z123456789012',
                lmi_clientnumber_code: '123456',
            };

            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
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

            const result = await wmInterface.trustConfirm(requestWithoutLang);

            expect(result.retval).toBe(0);
        });

        it('should handle response without trust block', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
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

            const result = await wmInterface.trustConfirm(mockRequest);

            expect(result.retval).toBe(0);
            expect(result.trust).toBeUndefined();
        });

        it('should handle response without userdesc', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
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

            const result = await wmInterface.trustConfirm(mockRequest);

            expect(result.retval).toBe(0);
            expect(result.userdesc).toBeUndefined();
        });

        it('should handle partial trust information', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <trust id="999888777">
            <slavepurse>Z123456789012</slavepurse>
          </trust>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.trustConfirm(mockRequest);

            expect(result.retval).toBe(0);
            expect(result.trust?.id).toBe('999888777');
            expect(result.trust?.slavepurse).toBe('Z123456789012');
            expect(result.trust?.slavewmid).toBeUndefined();
        });

        it('should handle API error response', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <retval>-2</retval>
          <retdesc>Invalid code</retdesc>
          <userdesc>The confirmation code is incorrect</userdesc>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            const result = await wmInterface.trustConfirm(mockRequest);

            expect(result.retval).toBe(-2);
            expect(result.retdesc).toBe('Invalid code');
            expect(result.userdesc).toBe('The confirmation code is incorrect');
            expect(result.trust).toBeUndefined();
        });

        it('should handle HTTP error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            });

            await expect(wmInterface.trustConfirm(mockRequest)).rejects.toThrow('HTTP error');
        });

        it('should handle HTML response instead of XML', async () => {
            const mockHtmlResponse = '<!DOCTYPE html><html><body>Error</body></html>';

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockHtmlResponse).buffer;
                },
            });

            await expect(wmInterface.trustConfirm(mockRequest)).rejects.toThrow(
                'Received HTML response instead of XML'
            );
        });

        it('should handle empty response', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode('').buffer;
                },
            });

            await expect(wmInterface.trustConfirm(mockRequest)).rejects.toThrow('Empty response');
        });

        it('should handle network error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(wmInterface.trustConfirm(mockRequest)).rejects.toThrow('Network error');
        });

        it('should call correct API endpoint', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
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

            await wmInterface.trustConfirm(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://merchant.web.money/conf/xml/XMLTrustConfirm.asp',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/xml; charset=windows-1251',
                    }),
                })
            );
        });
    });
});
