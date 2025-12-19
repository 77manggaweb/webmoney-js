import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for retrieving purse list (X9 interface).
 */
export interface WmX9Request {
    wmid: string;
}

/**
 * Detailed information about a WebMoney purse.
 */
export interface WmX9PurseDetails {
    id: number;
    pursename: string;
    amount: number;
    desc: string;
    outsideopen: number;
    lastintr: number;
    lastouttr: number;
}

/**
 * Response from the WebMoney X9 get purses API.
 */
export interface WmX9Response {
    reqn: number;
    retval: number;
    retdesc: string;
    purses?: WmX9PurseDetails[];
}

/**
 * Interface for WebMoney X9 retrieving information about purse balance.
 */
export class WmX9Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'wmid', validator: WmValidator.validateWmid },
    ];

    /**
     * Creates a new instance of the WebMoney X9 get purses interface.
     * @param wmid - The WebMoney WMID of the account
     * @param key - The WebMoney XML presentation of private key
     * @param apiUrl - Optional API URL. If not provided, defaults to the WebMoney X6 API URL
     * @param requestTimeout - Optional request timeout in milliseconds. If not provided, uses default timeout
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl ?? WmConfig.DEFAULT_URLS.X9;
    }

    protected getInterfaceName(): string {
        return 'X9';
    }

    /**
     * Retrieves the list of purses associated with a WebMoney ID.
     * @param req - The request parameters including the target WMID
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the purses response containing a list of purses
     * @throws WmNetworkError if the API request fails
     * @throws WmXmlError if the response is invalid
     * @throws WmApiError if the API returns an error
     */
    async getPurses(req: WmX9Request, reqn?: number): Promise<WmX9Response> {
        this.validateRequest(req, WmX9Interface.VALIDATION_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();

        const targetWmid = req.wmid;

        const planString = `${targetWmid}${reqNumber}`;
        const sign = this.sign(planString);

        const requestObject = {
            '?xml': {
                '@_version': '1.0',
                '@_encoding': this.getEncoding(),
            },
            'w3s.request': {
                reqn: reqNumber,
                wmid: this.wmid,
                sign: sign,
                getpurses: {
                    wmid: targetWmid,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        const baseResponse = this.parseBaseResponse(responseText);

        const responsePurses: WmX9PurseDetails[] = [];
        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(responseText);

            if (parsed && parsed['w3s.response'] && parsed['w3s.response'].purses) {
                this.parseArrayElements(parsed['w3s.response'].purses, 'purse', (purse) => {
                    if (
                        purse['@_id'] &&
                        purse.pursename &&
                        purse.amount &&
                        purse.desc &&
                        purse.outsideopen &&
                        purse.lastintr &&
                        purse.lastouttr
                    ) {
                        return {
                            id: WmXml.parseInt(purse['@_id']),
                            pursename: purse.pursename,
                            amount: WmXml.parseFloat(purse.amount),
                            desc: WmXml.decodeHtmlEntities(purse.desc),
                            outsideopen: WmXml.parseInt(purse.outsideopen),
                            lastintr: WmXml.parseInt(purse.lastintr),
                            lastouttr: WmXml.parseInt(purse.lastouttr),
                        };
                    }
                    return null as any;
                })
                    .filter((p) => p)
                    .forEach((p) => responsePurses.push(p));
            }
        } catch (error) {
            console.warn('Failed to parse purses list with fast-xml-parser:', error);
        }

        return {
            ...baseResponse,
            purses: responsePurses.length > 0 ? responsePurses : undefined,
        };
    }
}
