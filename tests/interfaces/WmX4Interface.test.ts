import { WmX4Interface, WmX4Request, WmX4Response } from '../../src/interfaces/WmXmlX4Interface';

global.fetch = jest.fn();

describe('WmX4Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX4Interface;

    beforeEach(() => {
        wmInterface = new WmX4Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('getOutInvoices', () => {
        const mockRequest: WmX4Request = {
            purse: 'Z123456789012',
            wminvid: 12345,
            orderid: 67890,
            datestart: new Date('2023-01-01'),
            datefinish: new Date('2023-12-31'),
        };

        it('should successfully get out invoices', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <outinvoices cnt="1">
            <outinvoice id="111" ts="1234567890">
              <orderid>67890</orderid>
              <customerwmid>987654321098</customerwmid>
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
            </outinvoice>
          </outinvoices>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.getOutInvoices(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.outinvoices).toBeDefined();
            expect(result.outinvoices?.length).toBe(1);
            expect(result.outinvoicesCount).toBe(1);
            expect(result.outinvoices?.[0].id).toBe(111);
            expect(result.outinvoices?.[0].amount).toBe(100.5);
        });

        it('should handle empty invoices list', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <outinvoices cnt="0">
          </outinvoices>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.getOutInvoices(mockRequest);

            expect(result.outinvoices).toEqual([]);
        });

        it('should handle API error', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>-4</retval>
          <retdesc>Invalid purse</retdesc>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            await expect(wmInterface.getOutInvoices(mockRequest)).rejects.toThrow('Invalid purse');
        });
    });
});
