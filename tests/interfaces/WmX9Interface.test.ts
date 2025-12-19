import { WmX9Interface, WmX9Request, WmX9Response } from '../../src/interfaces/WmXmlX9Interface';

global.fetch = jest.fn();

describe('WmX9Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX9Interface;

    beforeEach(() => {
        wmInterface = new WmX9Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('getPurses', () => {
        const mockRequest: WmX9Request = {
            wmid: '987654321098',
        };

        it('should successfully get purses', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <purses>
            <purse id="1">
              <pursename>Z123456789012</pursename>
              <amount>1000.50</amount>
              <desc>Test purse 1</desc>
              <outsideopen>1</outsideopen>
              <lastintr>1234567890</lastintr>
              <lastouttr>1234567891</lastouttr>
            </purse>
            <purse id="2">
              <pursename>Z987654321098</pursename>
              <amount>500.25</amount>
              <desc>Test purse 2</desc>
              <outsideopen>0</outsideopen>
              <lastintr>1234567892</lastintr>
              <lastouttr>1234567893</lastouttr>
            </purse>
          </purses>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.getPurses(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.reqn).toBe(1234567890);
            expect(result.retval).toBe(0);
            expect(result.purses).toBeDefined();
            expect(result.purses?.length).toBe(2);
            expect(result.purses?.[0].id).toBe(1);
            expect(result.purses?.[0].amount).toBe(1000.5);
            expect(result.purses?.[1].id).toBe(2);
            expect(result.purses?.[1].amount).toBe(500.25);
        });

        it('should handle API error', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>-9</retval>
          <retdesc>WMID not found</retdesc>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            await expect(wmInterface.getPurses(mockRequest)).rejects.toThrow('WMID not found');
        });
    });
});
