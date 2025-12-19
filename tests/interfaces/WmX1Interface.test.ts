import { WmX1Interface, WmX1Request, WmX1Response } from '../../src/interfaces/WmXmlX1Interface';

global.fetch = jest.fn();

describe('WmX1Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX1Interface;

    beforeEach(() => {
        wmInterface = new WmX1Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create instance with valid parameters', () => {
            expect(wmInterface).toBeInstanceOf(WmX1Interface);
        });
    });

    describe('createInvoice', () => {
        const mockRequest: WmX1Request = {
            orderid: 12345,
            customerwmid: '987654321098',
            storepurse: 'Z123456789012',
            amount: 100.5,
            desc: 'Test invoice',
            address: 'test@example.com',
            period: 0,
            expiration: 0,
            onlyauth: 1,
        };

        it('should successfully create invoice', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <invoice id="999" ts="1234567890">
            <orderid>12345</orderid>
            <customerwmid>987654321098</customerwmid>
            <storepurse>Z123456789012</storepurse>
            <amount>100.50</amount>
            <desc>Test invoice</desc>
            <address>test@example.com</address>
            <period>0</period>
            <expiration>0</expiration>
            <state>0</state>
            <datecrt>20231101 12:00:00</datecrt>
            <dateupd>20231101 12:00:00</dateupd>
          </invoice>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.createInvoice(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.retdesc).toBe('Success');
            expect(result.invoice).toBeDefined();
            expect(result.invoice?.id).toBe(999);
            expect(result.invoice?.orderid).toBe(12345);
            expect(result.invoice?.amount).toBe(100.5);
        });

        it('should handle API error response', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>-1</retval>
          <retdesc>Invalid parameters</retdesc>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            await expect(wmInterface.createInvoice(mockRequest, 1234567890)).rejects.toThrow(
                'Invalid parameters'
            );
        });

        it('should handle HTTP error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            });

            await expect(wmInterface.createInvoice(mockRequest)).rejects.toThrow('HTTP error');
        });

        it('should handle invalid XML response', async () => {
            const mockInvalidXml = 'This is not XML';

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockInvalidXml).buffer;
                },
            });

            await expect(wmInterface.createInvoice(mockRequest)).rejects.toThrow(
                'Response does not appear to be valid XML.'
            );
        });

        it('should generate request number automatically if not provided', async () => {
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

            const result = await wmInterface.createInvoice(mockRequest);

            expect(result.reqn).toBeGreaterThan(0);
        });

        it('should include optional parameters in request', async () => {
            const requestWithOptionals: WmX1Request = {
                ...mockRequest,
                lmi_shop_id: 'shop123',
            };

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

            await wmInterface.createInvoice(requestWithOptionals);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://w10s.web.money/asp/XMLInvoice.asp',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/xml; charset=windows-1251',
                    }),
                })
            );
        });

        it('should convert amount to WM currency format', async () => {
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

            await wmInterface.createInvoice(mockRequest);

            const callArgs = (global.fetch as jest.Mock).mock.calls[0];
            const xmlBody = callArgs[1].body as Uint8Array;
            const xmlString = new TextDecoder('windows-1251').decode(xmlBody);

            expect(xmlString).toContain('<amount>100.5</amount>');
        });
    });
});
