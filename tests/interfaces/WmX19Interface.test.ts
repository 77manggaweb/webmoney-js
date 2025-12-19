import { WmX19Interface, WmX19Request } from '../../src/interfaces/WmXmlX19Interface';

global.fetch = jest.fn();

describe('WmX19Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX19Interface;

    beforeEach(() => {
        wmInterface = new WmX19Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create instance with valid parameters', () => {
            expect(wmInterface).toBeInstanceOf(WmX19Interface);
        });

        it('should create instance with custom API URL', () => {
            const customInterface = new WmX19Interface(testWmid, testKey, 'https://custom.api.url');
            expect(customInterface).toBeInstanceOf(WmX19Interface);
        });
    });

    describe('checkUser', () => {
        const mockRequest: WmX19Request = {
            lang: 'en',
            operation: {
                type: 'check',
                direction: 0,
                pursetype: 'Z',
                amount: 100.0,
                id: 'OP123456',
            },
            userinfo: {
                wmid: '987654321098',
                pnomer: 'PASS123456',
                fname: 'John',
                iname: 'Doe',
            },
        };

        it('should successfully check user information', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <passport.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <retid>CHECK123</retid>
          <userinfo>
            <iname>John Doe</iname>
            <oname>Organization Name</oname>
          </userinfo>
        </passport.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.checkUser(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.retdesc).toBe('Success');
            expect(result.retid).toBe('CHECK123');
            expect(result.userinfo).toBeDefined();
            expect(result.userinfo?.iname).toBe('John Doe');
            expect(result.userinfo?.oname).toBe('Organization Name');
        });

        it('should handle minimal request parameters', async () => {
            const minimalRequest: WmX19Request = {
                lang: 'en',
                operation: {
                    type: 'check',
                    direction: 0,
                    pursetype: 'Z',
                    amount: 0,
                },
                userinfo: {
                    wmid: '987654321098',
                },
            };

            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <passport.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </passport.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.checkUser(minimalRequest, 1234567890);

            expect(result.retval).toBe(0);
        });

        it('should handle response without userinfo', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <passport.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </passport.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.checkUser(mockRequest, 1234567890);

            expect(result.retval).toBe(0);
            expect(result.userinfo).toBeUndefined();
        });

        it('should handle response without reqn', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <passport.response>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </passport.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.checkUser(mockRequest, 1234567890);

            expect(result.reqn).toBe(0);
            expect(result.retval).toBe(0);
        });

        it('should handle bank account information', async () => {
            const bankRequest: WmX19Request = {
                lang: 'en',
                operation: {
                    type: 'check',
                    direction: 0,
                    pursetype: 'Z',
                    amount: 0,
                },
                userinfo: {
                    wmid: '987654321098',
                    bank_name: 'Test Bank',
                    bank_account: '1234567890',
                },
            };

            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <passport.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </passport.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.checkUser(bankRequest, 1234567890);

            expect(result.retval).toBe(0);
        });

        it('should handle cryptocurrency information', async () => {
            const cryptoRequest: WmX19Request = {
                lang: 'en',
                operation: {
                    type: 'check',
                    direction: 0,
                    pursetype: 'Z',
                    amount: 0,
                },
                userinfo: {
                    wmid: '987654321098',
                    crypto_name: 'Bitcoin',
                    crypto_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                },
            };

            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <passport.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </passport.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.checkUser(cryptoRequest, 1234567890);

            expect(result.retval).toBe(0);
        });

        it('should handle e-money information', async () => {
            const emoneyRequest: WmX19Request = {
                lang: 'en',
                operation: {
                    type: 'check',
                    direction: 0,
                    pursetype: 'Z',
                    amount: 0,
                },
                userinfo: {
                    wmid: '987654321098',
                    emoney_name: 'PayPal',
                    emoney_id: 'test@paypal.com',
                },
            };

            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <passport.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </passport.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.checkUser(emoneyRequest, 1234567890);

            expect(result.retval).toBe(0);
        });

        it('should handle phone number', async () => {
            const phoneRequest: WmX19Request = {
                lang: 'en',
                operation: {
                    type: 'check',
                    direction: 0,
                    pursetype: 'Z',
                    amount: 0,
                },
                userinfo: {
                    wmid: '987654321098',
                    phone: '+79001234567',
                },
            };

            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <passport.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </passport.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.checkUser(phoneRequest, 1234567890);

            expect(result.retval).toBe(0);
        });

        it('should handle API error response', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <passport.response>
          <reqn>1234567890</reqn>
          <retval>-1</retval>
          <retdesc>User not found</retdesc>
        </passport.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            const result = await wmInterface.checkUser(mockRequest, 1234567890);

            expect(result.retval).toBe(-1);
            expect(result.retdesc).toBe('User not found');
            expect(result.userinfo).toBeUndefined();
        });

        it('should handle HTTP error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            });

            await expect(wmInterface.checkUser(mockRequest)).rejects.toThrow('HTTP error');
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

            await expect(wmInterface.checkUser(mockRequest)).rejects.toThrow(
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

            await expect(wmInterface.checkUser(mockRequest)).rejects.toThrow('Empty response');
        });

        it('should handle network error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(wmInterface.checkUser(mockRequest)).rejects.toThrow('Network error');
        });

        it('should generate request number automatically', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <passport.response>
          <reqn>123</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </passport.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.checkUser(mockRequest);

            expect(result.reqn).toBeGreaterThan(0);
        });

        it('should call correct API endpoint', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <passport.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </passport.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            await wmInterface.checkUser(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://apipassport.web.money/XMLCheckUser.aspx',
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
