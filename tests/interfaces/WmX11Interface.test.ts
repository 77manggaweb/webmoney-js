import {
    WmX11Interface,
    WmX11Request,
    WmX11Response,
} from '../../src/interfaces/WmXmlX11Interface';

global.fetch = jest.fn();

describe('WmX11Interface', () => {
    const testWmid = '123456789012';
    const testKey = `<RSAKeyValue>
    <Modulus>wRviVE5euRzKsIIiAAIIiSy8tn+L5SLFLYSJsAd0s=</Modulus>
    <D>ABEiM0RVZneImaq7zN3u/wABESIzRFVmd4iZqrvM3e7/AAEiM0RVZn</D>
  </RSAKeyValue>`;

    let wmInterface: WmX11Interface;

    beforeEach(() => {
        wmInterface = new WmX11Interface(testWmid, testKey);
        jest.clearAllMocks();
    });

    describe('getPassportInfo', () => {
        const mockRequest: WmX11Request = {
            passportwmid: '987654321098',
            dict: 0,
            info: 1,
            mode: 0,
        };

        it('should successfully get passport info', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <response retval="0">
          <fullaccess>1</fullaccess>
          <certinfo wmid="987654321098">
            <attestat>
              <row cid="110" regcid="" tid="" locked="0" admlocked="0" recalled="0"
                   datecrt="20231101 12:00:00" dateupd="20231101 12:00:00" datediff="0"
                   regnickname="testuser" regwmid="123456789012" status="0" notary="" datecrt110="20231101 12:00:00"/>
            </attestat>
            <wmids>
              <row wmid="987654321098" info="1" nickname="testuser" datereg="20231101 12:00:00"
                   yearreg="2023" monthreg="11" dayreg="01" timereg="12:00:00" ctype="1"
                   companyname="" companyid="" jcountryreg="Russia" jcountryregid="1"
                   phone="+79991234567" email="test@example.com" phone-check-lock="0" email-check-lock="0"/>
            </wmids>
            <userinfo>
              <value>
                <row nickname="testuser" infoopen="1" city="Moscow" region="Moscow" citid="1" countryid="1"
                     country="Russia" zipcode="101000" adres="Test Street" fname="Test" iname="User" oname="Testovich"
                     pnomer="1234567890" pdate="20200101" pday="01" pmonth="01" pyear="2020" pcountryid="1"
                     pcountry="Russia" pbywhom="Test Department" bplace="Moscow" bday="01" bmonth="01" byear="1990"
                     phone="+79991234567" email="test@example.com" web="https://test.com" cap_owner="1"
                     pasdoc="1" inndoc="1" sex="M"/>
              </value>
              <check-lock>
              </check-lock>
              <weblist>
              </weblist>
              <extendeddata>
              </extendeddata>
            </userinfo>
          </certinfo>
        </response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.getPassportInfo(mockRequest);

            expect(result).toBeDefined();
            expect(result.retval).toBe(0);
            expect(result.fullaccess).toBe('1');
            expect(result.certinfo).toBeDefined();
            expect(result.certinfo?.wmid).toBe('987654321098');
            expect(result.certinfo?.attestat.length).toBeGreaterThan(0);
            expect(result.certinfo?.wmids.length).toBeGreaterThan(0);
        });

        it('should handle API error', async () => {
            const mockErrorXml = `<?xml version="1.0" encoding="windows-1251"?>
        <response retval="-11" fullaccess="0">
          <fullaccess>0</fullaccess>
        </response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockErrorXml).buffer;
                },
            });

            const result = await wmInterface.getPassportInfo(mockRequest);

            expect(result.retval).toBe(-11);
            expect(result.fullaccess).toBe('0');
            expect(result.certinfo).toBeUndefined();
        });

        it('should call correct API endpoint', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <response retval="0">
          <fullaccess>1</fullaccess>
        </response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            await wmInterface.getPassportInfo(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://apipassport.web.money/asp/XMLGetWMPassport.asp',
                expect.any(Object)
            );
        });

        it('should handle minimal response without certinfo', async () => {
            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <response retval="0">
          <fullaccess>1</fullaccess>
        </response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            const result = await wmInterface.getPassportInfo(mockRequest);

            expect(result.retval).toBe(0);
            expect(result.fullaccess).toBe('1');
            expect(result.certinfo).toBeUndefined();
        });

        it('should handle HTML response instead of XML', async () => {
            const mockHtmlResponse = '<!DOCTYPE html><html><body>Error</body></html>';

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/html']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockHtmlResponse).buffer;
                },
            });

            await expect(wmInterface.getPassportInfo(mockRequest)).rejects.toThrow(
                'Received HTML response instead of XML'
            );
        });

        it('should handle HTTP error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error',
            });

            await expect(wmInterface.getPassportInfo(mockRequest)).rejects.toThrow('HTTP error');
        });

        it('should handle empty response', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode('').buffer;
                },
            });

            await expect(wmInterface.getPassportInfo(mockRequest)).rejects.toThrow(
                'Empty response'
            );
        });

        it('should handle network error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(wmInterface.getPassportInfo(mockRequest)).rejects.toThrow('Network error');
        });

        it('should include custom API URL in request', async () => {
            const customUrl = 'https://custom.api.url';
            const customInterface = new WmX11Interface(testWmid, testKey, customUrl);

            const mockResponseXml = `<?xml version="1.0" encoding="windows-1251"?>
        <response retval="0">
          <fullaccess>1</fullaccess>
        </response>`;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Map([['content-type', 'text/xml']]),
                arrayBuffer: async () => {
                    const encoder = new TextEncoder();
                    return encoder.encode(mockResponseXml).buffer;
                },
            });

            await customInterface.getPassportInfo(mockRequest);

            expect(global.fetch).toHaveBeenCalledWith(customUrl, expect.any(Object));
        });
    });
});
