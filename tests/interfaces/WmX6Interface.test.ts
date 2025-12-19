import { WmX6Interface, WmX6Request, WmX6Response } from '../../src/interfaces/WmXmlX6Interface';

global.fetch = jest.fn();

describe('WmX6Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX6Interface;

    beforeEach(() => {
        wmInterface = new WmX6Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('sendMessage', () => {
        const mockRequest: WmX6Request = {
            receiverwmid: '987654321098',
            msgtext: 'Test message',
            msgsubj: 'Test subject',
        };

        it('should successfully send message', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <message id="111">
            <receiverwmid>987654321098</receiverwmid>
            <msgtext>Test message</msgtext>
            <datecrt>20231101 12:00:00</datecrt>
          </message>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.sendMessage(mockRequest, 1234567890);

            expect(result).toBeDefined();
            expect(result.length).toBe(1);
            expect(result[0].reqn).toBe(1234567890);
            expect(result[0].retval).toBe(0);
            expect(result[0].message).toBeDefined();
            expect(result[0].message?.id).toBe(111);
        });

        it('should handle long messages by splitting them', async () => {
            const longMessage = 'a'.repeat(2000);
            const longRequest: WmX6Request = {
                receiverwmid: '987654321098',
                msgtext: longMessage,
            };

            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>0</retval>
          <retdesc>Success</retdesc>
          <message id="111">
            <receiverwmid>987654321098</receiverwmid>
            <msgtext>Part of message</msgtext>
            <datecrt>20231101 12:00:00</datecrt>
          </message>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                status: 200,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.sendMessage(longRequest, 1234567890);

            expect(result.length).toBeGreaterThan(1);
        });

        it('should handle API error', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <w3s.response>
          <reqn>1234567890</reqn>
          <retval>-6</retval>
          <retdesc>Invalid receiver</retdesc>
        </w3s.response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            await expect(wmInterface.sendMessage(mockRequest)).rejects.toThrow('Invalid receiver');
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
                status: 200,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            await wmInterface.sendMessage(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://w10s.web.money/asp/XMLSendMsg.asp',
                expect.any(Object)
            );
        });
    });
});
