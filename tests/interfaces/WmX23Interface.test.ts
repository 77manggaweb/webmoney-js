import { WmX23Interface, WmX23Request } from '../../src/interfaces/WmXmlX23Interface';

global.fetch = jest.fn();

describe('WmX23Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX23Interface;

    beforeEach(() => {
        wmInterface = new WmX23Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create instance with valid parameters', () => {
            expect(wmInterface).toBeInstanceOf(WmX23Interface);
        });

        it('should create instance with custom API URL', () => {
            const customInterface = new WmX23Interface(testWmid, testKey, 'https://custom.api.url');
            expect(customInterface).toBeInstanceOf(WmX23Interface);
        });
    });

    describe('refuseInvoice', () => {
        const mockRequest: WmX23Request = {
            wmid: testWmid,
            wminvid: 123456789,
        };

        it('should successfully refuse an invoice', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <ininvoice id="123456789" ts="1234567890">
            <state>3</state>
            <dateupd>20231101 14:30:00</dateupd>
          </ininvoice>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.refuseInvoice(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.retdesc).toBe('Success');
            expect(result.invoice).toBeDefined();
            expect(result.invoice?.id).toBe(123456789);
            expect(result.invoice?.ts).toBe(1234567890);
            expect(result.invoice?.state).toBe(3);
            expect(result.invoice?.dateupd).toBeDefined();
        });

        it('should handle response without invoice details', async () => {
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

            const result = await wmInterface.refuseInvoice(mockRequest, 1234567890);

            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.invoice).toBeUndefined();
        });

        it('should handle response without reqn', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
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

            const result = await wmInterface.refuseInvoice(mockRequest, 1234567890);

            expect(result.reqn).toBe(0);
            expect(result.retval).toBe(0);
        });

        it('should handle partial invoice information', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <ininvoice id="123456789">
            <state>3</state>
          </ininvoice>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.refuseInvoice(mockRequest, 1234567890);

            expect(result.retval).toBe(0);
            expect(result.invoice?.id).toBe(123456789);
            expect(result.invoice?.state).toBe(3);
            expect(result.invoice?.ts).toBeUndefined();
            expect(result.invoice?.dateupd).toBeUndefined();
        });

        it('should handle invoice with only id attribute', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <ininvoice id="123456789">
          </ininvoice>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.refuseInvoice(mockRequest, 1234567890);

            expect(result.retval).toBe(0);
            expect(result.invoice?.id).toBe(123456789);
            expect(result.invoice?.state).toBeUndefined();
        });

        it('should handle API error response', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>-1</retval>
          <retdesc>Invoice not found</retdesc>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            await expect(wmInterface.refuseInvoice(mockRequest, 1234567890)).rejects.toThrow(
                'Invoice not found'
            );
        });

        it('should handle HTTP error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            });

            await expect(wmInterface.refuseInvoice(mockRequest)).rejects.toThrow('HTTP error');
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

            await expect(wmInterface.refuseInvoice(mockRequest)).rejects.toThrow(
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

            await expect(wmInterface.refuseInvoice(mockRequest)).rejects.toThrow('Empty response');
        });

        it('should handle network error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(wmInterface.refuseInvoice(mockRequest)).rejects.toThrow('Network error');
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

            const result = await wmInterface.refuseInvoice(mockRequest);

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

            await wmInterface.refuseInvoice(mockRequest);

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

        it('should handle different invoice states', async () => {
            const states = [0, 1, 2, 3, 4];

            for (const state of states) {
                const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
          <w3s.response>
            <reqn>1234567890</reqn>
            <retval>0</retval>
            <retdesc>Success</retdesc>
            <ininvoice id="123456789" ts="1234567890">
              <state>${state}</state>
              <dateupd>20231101 14:30:00</dateupd>
            </ininvoice>
          </w3s.response>`;

                (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: async () => {
                        const encoder = new TextEncoder();
                        return encoder.encode(mockResponseXml).buffer;
                    },
                });

                const result = await wmInterface.refuseInvoice(mockRequest, 1234567890);

                expect(result.retval).toBe(0);
                expect(result.invoice?.state).toBe(state);
            }
        });

        it('should handle different WMID formats', async () => {
            const wmids = ['123456789012', '999888777666'];

            for (const wmid of wmids) {
                const request: WmX23Request = {
                    wmid: wmid,
                    wminvid: 123456789,
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

                const result = await wmInterface.refuseInvoice(request, 1234567890);

                expect(result.retval).toBe(0);
            }
        });
    });
});
