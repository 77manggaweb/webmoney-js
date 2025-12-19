import { WmX8Interface, WmX8Request, WmX8Response } from '../../src/interfaces/WmXmlX8Interface';

global.fetch = jest.fn();

describe('WmX8Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX8Interface;

    beforeEach(() => {
        wmInterface = new WmX8Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('testPurse', () => {
        const mockRequest: WmX8Request = {
            wmid: '987654321098',
            purse: 'Z987654321098',
        };

        it('should successfully test purse', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <testwmpurse>
            <wmid available="1" themselfcorrstate="0" newattst="110"/>
            <purse merchant_active_mode="1" blockedinByPT="0" ByPTLimit="0.00" deleted_flag="0" merchant_allow_cashier="1"/>
          </testwmpurse>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.testPurse(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.testwmpurse).toBeDefined();
            expect(result.testwmpurse?.wmid.available).toBe(1);
            expect(result.testwmpurse?.purse.merchant_active_mode).toBe(1);
        });

        it('should handle API error', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>-8</retval>
          <retdesc>Purse not found</retdesc>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            await expect(wmInterface.testPurse(mockRequest)).rejects.toThrow('Purse not found');
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

            await wmInterface.testPurse(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://w10s.web.money/asp/XMLFindWMPurseNew.asp',
                expect.any(Object)
            );
        });
    });
});
