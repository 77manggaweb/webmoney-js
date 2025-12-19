import { WmX16Interface, WmX16CreatePurseRequest } from '../../src/interfaces/WmXmlX16Interface';

global.fetch = jest.fn();

describe('WmX16Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX16Interface;

    beforeEach(() => {
        wmInterface = new WmX16Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create instance with valid parameters', () => {
            expect(wmInterface).toBeInstanceOf(WmX16Interface);
        });
    });

    describe('createPurse', () => {
        const mockRequest: WmX16CreatePurseRequest = {
            wmid: testWmid,
            pursetype: 'Z',
            desc: 'Test purse description',
        };

        it('should successfully create a purse', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <purse id="123456">
            <pursename>Z123456789012</pursename>
            <amount>0.00</amount>
            <desc>Test purse description</desc>
          </purse>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.createPurse(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.retdesc).toBe('Success');
            expect(result.purse).toBeDefined();
            expect(result.purse?.id).toBe(123456);
            expect(result.purse?.pursename).toBe('Z123456789012');
            expect(result.purse?.amount).toBe(0.0);
            expect(result.purse?.desc).toBe('Test purse description');
        });

        it('should handle API error response', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>-2</retval>
          <retdesc>Maximum number of purses reached</retdesc>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            await expect(wmInterface.createPurse(mockRequest, 1234567890)).rejects.toThrow(
                'Maximum number of purses reached'
            );
        });

        it('should handle HTTP error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            });

            await expect(wmInterface.createPurse(mockRequest)).rejects.toThrow('HTTP error');
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

            await expect(wmInterface.createPurse(mockRequest)).rejects.toThrow(
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

            await expect(wmInterface.createPurse(mockRequest)).rejects.toThrow('Empty response');
        });

        it('should handle network error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(wmInterface.createPurse(mockRequest)).rejects.toThrow('Network error');
        });

        it('should generate request number automatically', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>123</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.createPurse(mockRequest);

            expect(result.reqn).toBeGreaterThan(0);
        });

        it('should call correct API endpoint', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            await wmInterface.createPurse(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://w10s.web.money/asp/XMLCreatePurse.asp',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/xml; charset=windows-1251',
                    }),
                })
            );
        });

        it('should handle different purse types', async () => {
            const purseTypes = ['Z', 'R', 'E', 'U', 'K', 'X', 'G', 'D'];

            for (const purseType of purseTypes) {
                const request: WmX16CreatePurseRequest = {
                    wmid: testWmid,
                    pursetype: purseType,
                    desc: `Test ${purseType} purse`,
                };

                const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
          <w3s.response>
            <reqn>1234567890</reqn>
            <retval>0</retval>
            <retdesc>Success</retdesc>
            <purse id="123456">
              <pursename>${purseType}123456789012</pursename>
              <amount>0.00</amount>
              <desc>Test ${purseType} purse</desc>
            </purse>
          </w3s.response>`;

                (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: async () => {
                        const encoder = new TextEncoder();
                        return encoder.encode(mockResponseXml).buffer;
                    },
                });

                const result = await wmInterface.createPurse(request, 1234567890);

                expect(result.retval).toBe(0);
                expect(result.purse?.pursename).toBe(`${purseType}123456789012`);
            }
        });
    });
});
