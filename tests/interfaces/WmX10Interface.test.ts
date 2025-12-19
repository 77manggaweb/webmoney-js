import {
    WmX10Interface,
    WmX10Request,
    WmX10Response,
} from '../../src/interfaces/WmXmlX10Interface';

global.fetch = jest.fn();

describe('WmX10Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX10Interface;

    beforeEach(() => {
        wmInterface = new WmX10Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('getInInvoices', () => {
        const mockRequest: WmX10Request = {
            wmid: '987654321098',
            wminvid: 12345,
            datestart: new Date('2023-01-01'),
            datefinish: new Date('2023-12-31'),
        };

        it('should successfully get in invoices', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <ininvoices>
            <ininvoice id="111" ts="1234567890">
              <orderid>67890</orderid>
              <storewmid>123456789012</storewmid>
              <storepurse>Z123456789012</storepurse>
              <amount>100.50</amount>
              <desc>Test invoice</desc>
              <address>test@example.com</address>
              <period>0</period>
              <expiration>0</expiration>
              <state>2</state>
              <datecrt>20231101 12:00:00</datecrt>
              <dateupd>20231101 12:00:00</dateupd>
              <wmtranid>999</wmtranid>
            </ininvoice>
          </ininvoices>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.getInInvoices(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.ininvoices).toBeDefined();
            expect(result.ininvoices?.length).toBe(1);
            expect(result.ininvoices?.[0].id).toBe(111);
            expect(result.ininvoices?.[0].amount).toBe(100.5);
        });

        it('should handle API error', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>-10</retval>
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

            await expect(wmInterface.getInInvoices(mockRequest)).rejects.toThrow('Access denied');
        });
    });
});
