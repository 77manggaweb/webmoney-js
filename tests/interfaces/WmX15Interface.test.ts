import {
    WmX15Interface,
    WmX15GetTrustListRequest,
    WmX15SaveTrustRequest,
} from '../../src/interfaces/WmXmlX15Interface';

global.fetch = jest.fn();

describe('WmX15Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX15Interface;

    beforeEach(() => {
        wmInterface = new WmX15Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create instance with valid parameters', () => {
            expect(wmInterface).toBeInstanceOf(WmX15Interface);
        });

        it('should create instance with custom API URLs', () => {
            const customInterface = new WmX15Interface(
                testWmid,
                testKey,
                'https://custom1.api.url',
                'https://custom2.api.url',
                'https://custom3.api.url'
            );
            expect(customInterface).toBeInstanceOf(WmX15Interface);
        });
    });

    describe('getTrustList', () => {
        const mockRequest: WmX15GetTrustListRequest = {
            wmid: '987654321098',
        };

        it('should successfully retrieve trust list', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <trustlist cnt="2">
            <trust id="111111111111" inv="1" trans="1" purse="1" transhist="1">
              <master>222222222222</master>
              <purse>Z333333333333</purse>
              <daylimit>100.00</daylimit>
              <dlimit>50.00</dlimit>
              <wlimit>200.00</wlimit>
              <mlimit>500.00</mlimit>
              <dsum>10.00</dsum>
              <wsum>20.00</wsum>
              <msum>30.00</msum>
              <lastsumdate>20231101 12:00:00</lastsumdate>
            </trust>
            <trust id="444444444444" inv="0" trans="0" purse="1" transhist="0">
              <master>555555555555</master>
              <purse>Z666666666666</purse>
            </trust>
          </trustlist>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.getTrustList(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.retdesc).toBe('Success');
            expect(result.trustlist).toBeDefined();
            expect(result.trustlist).toHaveLength(2);
            expect(result.trustlistCount).toBe(2);
            expect(result.trustlist![0].id).toBe('111111111111');
            expect(result.trustlist![0].master).toBe('222222222222');
            expect(result.trustlist![0].purseValue).toBe('Z333333333333');
            expect(result.trustlist![0].daylimit).toBe(100.0);
        });

        it('should handle empty trust list', async () => {
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

            const result = await wmInterface.getTrustList(mockRequest, 1234567890);

            expect(result.retval).toBe(0);
            expect(result.trustlist).toBeUndefined();
            expect(result.trustlistCount).toBeUndefined();
        });

        it('should handle API error response', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>-1</retval>
          <retdesc>Invalid WMID</retdesc>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            await expect(wmInterface.getTrustList(mockRequest, 1234567890)).rejects.toThrow(
                'Invalid WMID'
            );
        });

        it('should handle HTTP error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            });

            await expect(wmInterface.getTrustList(mockRequest)).rejects.toThrow('HTTP error');
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

            await expect(wmInterface.getTrustList(mockRequest)).rejects.toThrow(
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

            await expect(wmInterface.getTrustList(mockRequest)).rejects.toThrow('Empty response');
        });

        it('should handle network error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(wmInterface.getTrustList(mockRequest)).rejects.toThrow('Network error');
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

            const result = await wmInterface.getTrustList(mockRequest);

            expect(result.reqn).toBeGreaterThan(0);
        });
    });

    describe('getTrustList2', () => {
        const mockRequest: WmX15GetTrustListRequest = {
            wmid: '987654321098',
        };

        it('should successfully retrieve trust list', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <trustlist cnt="1">
            <trust id="111111111111" inv="1" trans="1" purse="1" transhist="1">
              <master>222222222222</master>
            </trust>
          </trustlist>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.getTrustList2(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.trustlist).toBeDefined();
        });

        it('should throw error when request wmid matches signing wmid', async () => {
            const invalidRequest: WmX15GetTrustListRequest = {
                wmid: testWmid,
            };

            await expect(wmInterface.getTrustList2(invalidRequest)).rejects.toThrow(
                'For getTrustList2, the request wmid must NOT match the signing wmid'
            );
        });
    });

    describe('saveTrust', () => {
        const mockRequest: WmX15SaveTrustRequest = {
            masterwmid: '987654321098',
            slavewmid: '111222333444',
            purse: 'Z123456789012',
            inv: 1,
            trans: 1,
            purseFlag: 1,
            transhist: 1,
            limit: 1000,
            daylimit: 100,
            weeklimit: 500,
            monthlimit: 1000,
        };

        it('should successfully save trust settings', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <trust id="111111111111" inv="1" trans="1" purse="1" transhist="1" msghist="1" msg="1">
            <purse>Z123456789012</purse>
            <master>987654321098</master>
          </trust>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.saveTrust(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.retdesc).toBe('Success');
            expect(result.trust).toBeDefined();
            expect(result.trust?.id).toBe('111111111111');
            expect(result.trust?.inv).toBe(1);
            expect(result.trust?.trans).toBe(1);
            expect(result.trust?.purseValue).toBe('Z123456789012');
            expect(result.trust?.master).toBe('987654321098');
        });

        it('should handle minimal request parameters', async () => {
            const minimalRequest: WmX15SaveTrustRequest = {
                masterwmid: '987654321098',
                slavewmid: '123456789012',
                purse: 'Z123456789012',
                inv: 1,
                trans: 1,
                purseFlag: 1,
                transhist: 0,
                limit: 100,
                daylimit: 10,
                weeklimit: 50,
                monthlimit: 200,
            };

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

            const result = await wmInterface.saveTrust(minimalRequest, 1234567890);

            expect(result.retval).toBe(0);
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
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            await expect(wmInterface.saveTrust(mockRequest, 1234567890)).rejects.toThrow(
                'Access denied'
            );
        });

        it('should handle HTTP error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            });

            await expect(wmInterface.saveTrust(mockRequest)).rejects.toThrow('HTTP error');
        });

        it('should handle network error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(wmInterface.saveTrust(mockRequest)).rejects.toThrow('Network error');
        });
    });
});
