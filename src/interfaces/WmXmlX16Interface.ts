import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for creating a WebMoney purse (X16 interface).
 */
export interface WmX16CreatePurseRequest {
    wmid: string;
    pursetype: string;
    desc: string;
}

/**
 * Detailed information about a created WebMoney purse.
 */
export interface WmX16PurseDetails {
    id: number;
    pursename: string;
    amount: number;
    desc: string;
}

/**
 * Response from the WebMoney X16 create purse API.
 */
export interface WmX16Response {
    reqn: number;
    retval: number;
    retdesc: string;
    purse?: WmX16PurseDetails;
}

/**
 * Interface for WebMoney X16 create purse operations.
 */
export class WmX16Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'wmid', validator: WmValidator.validateWmid },
        { field: 'pursetype', validator: WmValidator.validateRequired },
        { field: 'desc', validator: WmValidator.validateDescription },
    ];

    /**
     * Creates a new instance of the WmX16Interface for WebMoney purse creation operations.
     * @param wmid - The WebMoney ID (WMID) of the user performing the operation
     * @param key - The private key used for signing requests
     * @param apiUrl - Optional custom API URL. If not provided, uses the default X16 interface URL from WmConfig
     * @param requestTimeout - Optional timeout in milliseconds for API requests
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl || WmConfig.DEFAULT_URLS.X16;
    }

    protected getInterfaceName(): string {
        return 'X16';
    }

    /**
     * Creates a new purse in the WebMoney system.
     * @param req - The create purse request parameters including wmid, pursetype, and description
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the create purse response containing request number, return value, description, and purse details
     * @throws WmNetworkError if the API request fails
     * @throws WmXmlError if the response is invalid
     * @throws WmApiError if the API returns an error
     */
    async createPurse(req: WmX16CreatePurseRequest, reqn?: number): Promise<WmX16Response> {
        this.validateRequest(req, WmX16Interface.VALIDATION_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();

        const pursetype = req.pursetype;
        const desc = req.desc;

        const planString = `${this.wmid}${pursetype}${reqNumber}`;
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
                createpurse: {
                    wmid: req.wmid,
                    pursetype: pursetype,
                    desc: desc,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        const baseResponse = this.parseBaseResponse(responseText);

        let responsePurse: WmX16PurseDetails | undefined;
        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(responseText);

            if (parsed && parsed['w3s.response'] && parsed['w3s.response'].purse) {
                const purse = parsed['w3s.response'].purse;

                if (purse.pursename && purse.amount && purse.desc) {
                    responsePurse = {
                        id: WmXml.parseInt(purse['@_id']),
                        pursename: purse.pursename,
                        amount: WmXml.parseFloat(purse.amount),
                        desc: WmXml.decodeHtmlEntities(purse.desc),
                    };
                }
            }
        } catch (error) {
            console.warn('Failed to parse purse details with fast-xml-parser:', error);
        }

        return {
            ...baseResponse,
            purse: responsePurse,
        };
    }
}
