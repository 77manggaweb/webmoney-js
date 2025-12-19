import { WmX18Interface, WmX18Request } from '../../src/interfaces/WmXmlX18Interface';

global.fetch = jest.fn();

describe('WmX18Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX18Interface;

    beforeEach(() => {
        wmInterface = new WmX18Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create instance with valid parameters', () => {
            expect(wmInterface).toBeInstanceOf(WmX18Interface);
        });

        it('should create instance with custom API URL', () => {
            const customInterface = new WmX18Interface(testWmid, testKey, 'https://custom.api.url');
            expect(customInterface).toBeInstanceOf(WmX18Interface);
        });
    });

    describe('getTransaction', () => {
        const mockRequest: WmX18Request = {
            lmi_payee_purse: 'Z123456789012',
            lmi_payment_no: 'TEST123456',
            lmi_payment_no_type: 0,
        };

        it('should successfully retrieve transaction information', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <operation wmtransid="999888777" wminvoiceid="111222333">
            <amount>150.50</amount>
            <operdate>20231101 14:30:00</operdate>
            <purpose>Test payment</purpose>
            <pursefrom>Z987654321098</pursefrom>
            <wmidfrom>987654321098</wmidfrom>
            <hold_period>0</hold_period>
            <hold_state>0</hold_state>
            <capitallerflag>0</capitallerflag>
            <enumflag>1</enumflag>
            <IPAddress>192.168.1.1</IPAddress>
            <telepat_phone>+79001234567</telepat_phone>
            <telepat_paytype>1</telepat_paytype>
            <paymer_number>PAY123</paymer_number>
            <paymer_email>test@example.com</paymer_email>
            <paymer_type>1</paymer_type>
            <cashier_number>CASH123</cashier_number>
            <cashier_date>20231101</cashier_date>
            <cashier_amount>150.50</cashier_amount>
            <sdp_type>1</sdp_type>
          </operation>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.getTransaction(mockRequest);

            expect(result).toBeDefined();
            expect(result.retval).toBe(0);
            expect(result.retdesc).toBe('Success');
            expect(result.operation).toBeDefined();
            expect(result.operation?.wmtransid).toBe('999888777');
            expect(result.operation?.wminvoiceid).toBe('111222333');
            expect(result.operation?.amount).toBe(150.5);
            expect(result.operation?.purpose).toBe('Test payment');
            expect(result.operation?.pursefrom).toBe('Z987654321098');
            expect(result.operation?.wmidfrom).toBe('987654321098');
            expect(result.operation?.IPAddress).toBe('192.168.1.1');
            expect(result.operation?.telepat_phone).toBe('+79001234567');
            expect(result.operation?.paymer_email).toBe('test@example.com');
        });

        it('should handle minimal operation details', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <operation wmtransid="999888777">
            <amount>100.00</amount>
          </operation>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.getTransaction(mockRequest);

            expect(result.retval).toBe(0);
            expect(result.operation?.wmtransid).toBe('999888777');
            expect(result.operation?.amount).toBe(100.0);
        });

        it('should handle response with error log', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <retval>-1</retval>
          <retdesc>Payment not found</retdesc>
          <errorlog lmi_payee_purse="Z123456789012" lmi_payment_no="TEST123456">
            <datecrt>20231101 12:00:00</datecrt>
            <dateupd>20231101 13:00:00</dateupd>
            <date_s>20231101 12:05:00</date_s>
            <date_pc>20231101 12:10:00</date_pc>
            <date_pd>20231101 12:15:00</date_pd>
            <p_type>1</p_type>
            <err_code>100</err_code>
            <siteid>SITE123</siteid>
            <att>5</att>
            <date_notify>20231101 12:20:00</date_notify>
            <shop_id>SHOP456</shop_id>
          </errorlog>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.getTransaction(mockRequest);

            expect(result.retval).toBe(-1);
            expect(result.retdesc).toBe('Payment not found');
            expect(result.errorlog).toBeDefined();
            expect(result.errorlog?.lmi_payee_purse).toBe('Z123456789012');
            expect(result.errorlog?.lmi_payment_no).toBe('TEST123456');
            expect(result.errorlog?.p_type).toBe(1);
            expect(result.errorlog?.err_code).toBe(100);
            expect(result.errorlog?.siteid).toBe('SITE123');
            expect(result.errorlog?.att).toBe(5);
            expect(result.errorlog?.shop_id).toBe('SHOP456');
        });

        it('should handle default lmi_payment_no_type', async () => {
            const requestWithoutType: WmX18Request = {
                lmi_payee_purse: 'Z123456789012',
                lmi_payment_no: 'TEST123456',
            };

            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.getTransaction(requestWithoutType);

            expect(result.retval).toBe(0);
        });

        it('should handle API error response', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <retval>-3</retval>
          <retdesc>Invalid signature</retdesc>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            const result = await wmInterface.getTransaction(mockRequest);

            expect(result.retval).toBe(-3);
            expect(result.retdesc).toBe('Invalid signature');
            expect(result.operation).toBeUndefined();
        });

        it('should handle HTTP error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            });

            await expect(wmInterface.getTransaction(mockRequest)).rejects.toThrow('HTTP error');
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

            await expect(wmInterface.getTransaction(mockRequest)).rejects.toThrow(
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

            await expect(wmInterface.getTransaction(mockRequest)).rejects.toThrow('Empty response');
        });

        it('should handle network error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(wmInterface.getTransaction(mockRequest)).rejects.toThrow('Network error');
        });

        it('should call correct API endpoint', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <merchant.response>
          <retval>0</retval>
          <retdesc>Success</retdesc>
        </merchant.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            await wmInterface.getTransaction(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://merchant.web.money/conf/xml/XMLTransGet.asp',
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
