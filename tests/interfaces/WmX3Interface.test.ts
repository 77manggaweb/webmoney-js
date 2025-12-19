import { WmX3Interface, WmX3Request, WmX3Response } from '../../src/interfaces/WmXmlX3Interface';

global.fetch = jest.fn();

describe('WmX3Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX3Interface;

    beforeEach(() => {
        wmInterface = new WmX3Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create instance with valid parameters', () => {
            expect(wmInterface).toBeInstanceOf(WmX3Interface);
        });
    });

    describe('getOperations', () => {
        const mockRequest: WmX3Request = {
            purse: 'Z123456789012',
            wmtranid: 12345,
            tranid: 67890,
            wminvid: 111,
            orderid: 222,
            datestart: new Date('2023-01-01'),
            datefinish: new Date('2023-12-31'),
        };

        it('should successfully get operations', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <operations cnt="2">
            <operation id="111" ts="1234567890">
              <pursesrc>Z123456789012</pursesrc>
              <pursedest>Z987654321098</pursedest>
              <amount>100.50</amount>
              <comiss>1.00</comiss>
              <opertype>4</opertype>
              <wminvid>0</wminvid>
              <orderid>12345</orderid>
              <tranid>67890</tranid>
              <period>0</period>
              <desc>Test operation 1</desc>
              <datecrt>20231101 12:00:00</datecrt>
              <dateupd>20231101 12:00:00</dateupd>
              <corrwm>987654321098</corrwm>
              <rest>500.00</rest>
            </operation>
            <operation id="222" ts="1234567891">
              <pursesrc>Z123456789012</pursesrc>
              <pursedest>Z111111111111</pursedest>
              <amount>50.25</amount>
              <comiss>0.50</comiss>
              <opertype>4</opertype>
              <wminvid>0</wminvid>
              <orderid>54321</orderid>
              <tranid>9876</tranid>
              <period>0</period>
              <desc>Test operation 2</desc>
              <datecrt>20231102 12:00:00</datecrt>
              <dateupd>20231102 12:00:00</dateupd>
              <corrwm>111111111111</corrwm>
              <rest>449.75</rest>
            </operation>
          </operations>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.getOperations(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.retdesc).toBe('Success');
            expect(result.operations).toBeDefined();
            expect(result.operations?.length).toBe(2);
            expect(result.operationsCount).toBe(2);
            expect(result.operations?.[0].id).toBe(111);
            expect(result.operations?.[0].amount).toBe(100.5);
            expect(result.operations?.[1].id).toBe(222);
            expect(result.operations?.[1].amount).toBe(50.25);
        });

        it('should handle empty operations list', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <operations cnt="0">
          </operations>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.getOperations(mockRequest, 1234567890);

            expect(result.retval).toBe(0);
            expect(result.operations).toEqual([]);
            expect(result.operationsCount).toBe(0);
        });

        it('should handle API error response', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>-3</retval>
          <retdesc>Access denied</retdesc>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            await expect(wmInterface.getOperations(mockRequest, 1234567890)).rejects.toThrow(
                'Access denied'
            );
        });

        it('should handle HTTP error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            });

            await expect(wmInterface.getOperations(mockRequest)).rejects.toThrow('HTTP error');
        });

        it('should handle HTML response', async () => {
            const mockHtmlResponse = '<!DOCTYPE html><html><body>Error</body></html>';

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockHtmlResponse).buffer;
                },
            });

            await expect(wmInterface.getOperations(mockRequest)).rejects.toThrow(
                'Received HTML response instead of XML'
            );
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

            await wmInterface.getOperations(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://w10s.web.money/asp/XMLOperations.asp',
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
