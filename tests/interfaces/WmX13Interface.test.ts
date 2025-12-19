import {
    WmX13Interface,
    WmX13Request,
    WmX13Response,
} from '../../src/interfaces/WmXmlX13Interface';

global.fetch = jest.fn();

describe('WmX13Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX13Interface;

    beforeEach(() => {
        wmInterface = new WmX13Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('rejectProtect', () => {
        const mockRequest: WmX13Request = {
            wmtranid: 12345,
        };

        it('should successfully reject protect', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <operation id="111" ts="1234567890">
            <opertype>7</opertype>
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

            const result = await wmInterface.rejectProtect(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.operation).toBeDefined();
            expect(result.operation?.id).toBe(111);
            expect(result.operation?.opertype).toBe(7);
        });

        it('should handle API error', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>-13</retval>
          <retdesc>Cannot reject</retdesc>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            await expect(wmInterface.rejectProtect(mockRequest)).rejects.toThrow('Cannot reject');
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

            await wmInterface.rejectProtect(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://w10s.web.money/asp/XMLRejectProtect.asp',
                expect.any(Object)
            );
        });
    });
});
