import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for testing a WebMoney purse (X8 interface).
 */
export interface WmX8Request {
    wmid: string;
    purse: string;
}

/**
 * WMID-related details from purse test.
 */
export interface WmX8WmidDetails {
    available: number;
    themselfcorrstate: number;
    newattst: number;
}

/**
 * Purse-specific details from purse test.
 */
export interface WmX8PurseDetails {
    merchant_active_mode: number;
    blockedinByPT: number;
    ByPTLimit: string;
    deleted_flag: number;
    merchant_allow_cashier: number;
}

/**
 * Combined test details for WMID and purse.
 */
export interface WmX8TestDetails {
    wmid: WmX8WmidDetails;
    purse: WmX8PurseDetails;
}

/**
 * Response from the WebMoney X8 test purse API.
 */
export interface WmX8Response {
    reqn: number;
    retval: number;
    retdesc: string;
    testwmpurse?: WmX8TestDetails;
}

/**
 * Interface for WebMoney X8 retrieving information about purse ownership.
 */
export class WmX8Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'wmid', validator: WmValidator.validateWmid },
        { field: 'purse', validator: WmValidator.validatePurse },
    ];

    /**
     * Creates a new instance of the WebMoney X8 test purse interface.
     * @param wmid - The WebMoney WMID of the account
     * @param key - The WebMoney XML presentation of private key
     * @param apiUrl - Optional API endpoint URL. If not provided, uses default endpoint
     * @param requestTimeout - Optional request timeout in milliseconds. If not provided, uses default timeout
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl ?? WmConfig.DEFAULT_URLS.X8;
    }

    protected getInterfaceName(): string {
        return 'X8';
    }

    /**
     * Tests a WebMoney purse to verify its existence and retrieve purse information.
     * @param req - The request parameters including WMID and purse to test
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the test purse response containing purse and WMID details
     * @throws WmNetworkError if the API request fails
     * @throws WmXmlError if the response is invalid
     * @throws WmApiError if the API returns an error
     */
    async testPurse(req: WmX8Request, reqn?: number): Promise<WmX8Response> {
        this.validateRequest(req, WmX8Interface.VALIDATION_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();

        const testWmid = req.wmid;
        const testPurse = req.purse;

        const planString = `${testWmid}${testPurse}`;
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
                testwmpurse: {
                    wmid: testWmid,
                    purse: testPurse,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        const baseResponse = this.parseBaseResponse(responseText);

        let responseTestDetails: WmX8TestDetails | undefined;

        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(responseText);

            if (parsed && parsed['w3s.response'] && parsed['w3s.response'].testwmpurse) {
                const testBlock = parsed['w3s.response'].testwmpurse;
                const wmidBlock = testBlock.wmid;
                const purseBlock = testBlock.purse;

                if (wmidBlock && purseBlock) {
                    responseTestDetails = {
                        wmid: {
                            available: wmidBlock['@_available']
                                ? WmXml.parseInt(wmidBlock['@_available'])
                                : 0,
                            themselfcorrstate: wmidBlock['@_themselfcorrstate']
                                ? WmXml.parseInt(wmidBlock['@_themselfcorrstate'])
                                : 0,
                            newattst: wmidBlock['@_newattst']
                                ? WmXml.parseInt(wmidBlock['@_newattst'])
                                : 0,
                        },
                        purse: {
                            merchant_active_mode: purseBlock['@_merchant_active_mode']
                                ? WmXml.parseInt(purseBlock['@_merchant_active_mode'])
                                : 0,
                            blockedinByPT: purseBlock['@_blockedinByPT']
                                ? WmXml.parseInt(purseBlock['@_blockedinByPT'])
                                : 0,
                            ByPTLimit: purseBlock['@_ByPTLimit'] ?? '',
                            deleted_flag: purseBlock['@_deleted_flag']
                                ? WmXml.parseInt(purseBlock['@_deleted_flag'])
                                : 0,
                            merchant_allow_cashier: purseBlock['@_merchant_allow_cashier']
                                ? WmXml.parseInt(purseBlock['@_merchant_allow_cashier'])
                                : 0,
                        },
                    };
                }
            }
        } catch (error) {
            console.warn('Failed to parse testwmpurse details with fast-xml-parser:', error);
        }

        return {
            ...baseResponse,
            testwmpurse: responseTestDetails,
        };
    }
}
