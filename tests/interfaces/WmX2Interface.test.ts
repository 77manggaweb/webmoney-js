import { WmX2Interface, WmX2Request, WmX2Response } from '../../src/interfaces/WmXmlX2Interface';

global.fetch = jest.fn();

describe('WmX2Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX2Interface;

    beforeEach(() => {
        wmInterface = new WmX2Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create instance with valid parameters', () => {
            expect(wmInterface).toBeInstanceOf(WmX2Interface);
        });
    });

    describe('transfer', () => {
        const mockRequest: WmX2Request = {
            tranid: 12345,
            pursesrc: 'Z123456789012',
            pursedest: 'Z987654321098',
            amount: 50.25,
            period: 0,
            pcode: 'testprotect',
            desc: 'Test transfer',
            wminvid: 0,
            onlyauth: 1,
        };

        it('should successfully transfer money', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <operation id="999" ts="1234567890">
            <tranid>12345</tranid>
            <pursesrc>Z123456789012</pursesrc>
            <pursedest>Z987654321098</pursedest>
            <amount>50.25</amount>
            <comiss>0.50</comiss>
            <opertype>4</opertype>
            <period>0</period>
            <wminvid>0</wminvid>
            <orderid>0</orderid>
            <desc>Test transfer</desc>
            <datecrt>20231101 12:00:00</datecrt>
            <dateupd>20231101 12:00:00</dateupd>
          </operation>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.transfer(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.retdesc).toBe('Success');
            expect(result.operation).toBeDefined();
            expect(result.operation?.id).toBe(999);
            expect(result.operation?.tranid).toBe(12345);
            expect(result.operation?.amount).toBe(50.25);
            expect(result.operation?.comiss).toBe(0.5);
        });

        it('should handle API error response', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>-2</retval>
          <retdesc>Insufficient funds</retdesc>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            await expect(wmInterface.transfer(mockRequest, 1234567890)).rejects.toThrow(
                'Insufficient funds'
            );
        });

        it('should handle HTTP error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            });

            await expect(wmInterface.transfer(mockRequest)).rejects.toThrow('HTTP error');
        });

        it('should handle HTML response instead of XML', async () => {
            const mockHtmlResponse = '<!DOCTYPE html><html><body>Error</body></html>';

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockHtmlResponse).buffer;
                },
            });

            await expect(wmInterface.transfer(mockRequest)).rejects.toThrow(
                'Received HTML response instead of XML'
            );
        });

        it('should handle empty response', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode('').buffer;
                },
            });

            await expect(wmInterface.transfer(mockRequest)).rejects.toThrow('Empty response');
        });

        it('should handle network error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(wmInterface.transfer(mockRequest)).rejects.toThrow('Network error');
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
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.transfer(mockRequest);

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
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            await wmInterface.transfer(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://w10s.web.money/asp/XMLTrans.asp',
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
