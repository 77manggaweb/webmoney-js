import {
    WmX14Interface,
    WmX14Request,
    WmX14Response,
} from '../../src/interfaces/WmXmlX14Interface';

global.fetch = jest.fn();

describe('WmX14Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX14Interface;

    beforeEach(() => {
        wmInterface = new WmX14Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('moneyback', () => {
        const mockRequest: WmX14Request = {
            inwmtranid: 12345,
            amount: 50.25,
            moneybackphone: '+79991234567',
            capitallerpursesrc: 'Z123456789012',
        };

        it('should successfully process moneyback', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <operation id="111" ts="1234567890">
            <tranid>67890</tranid>
            <inwmtranid>12345</inwmtranid>
            <pursesrc>Z123456789012</pursesrc>
            <pursedest>Z987654321098</pursedest>
            <amount>50.25</amount>
            <comiss>0.50</comiss>
            <opertype>8</opertype>
            <period>0</period>
            <wminvid>0</wminvid>
            <orderid>0</orderid>
            <desc>Moneyback</desc>
            <datecrt>20231101 12:00:00</datecrt>
            <dateupd>20231101 12:00:00</dateupd>
            <corrwm>987654321098</corrwm>
            <outgosrc>100.00</outgosrc>
            <incomedest>50.25</incomedest>
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

            const result = await wmInterface.moneyback(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.operation).toBeDefined();
            expect(result.operation?.id).toBe(111);
            expect(result.operation?.tranid).toBe(67890);
            expect(result.operation?.inwmtranid).toBe(12345);
            expect(result.operation?.amount).toBe(50.25);
        });

        it('should handle API error', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>-14</retval>
          <retdesc>Transaction not found</retdesc>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            await expect(wmInterface.moneyback(mockRequest)).rejects.toThrow(
                'Transaction not found'
            );
        });

        it('should handle HTTP error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            });

            await expect(wmInterface.moneyback(mockRequest)).rejects.toThrow('HTTP error');
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

            await wmInterface.moneyback(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://w10s.web.money/asp/XMLTransMoneyback.asp',
                expect.any(Object)
            );
        });
    });
});
