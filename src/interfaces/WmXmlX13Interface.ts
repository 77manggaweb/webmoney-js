import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmConvert } from '../utils/WmConvert';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for rejecting a protected payment (X13 interface).
 */
export interface WmX13Request {
    wmtranid: number;
}

/**
 * Detailed information about a rejected protected payment operation.
 */
export interface WmX13OperationDetails {
    id: number;
    ts: number;
    opertype: number;
    dateupd?: Date;
}

/**
 * Response from the WebMoney X13 reject protect API.
 */
export interface WmX13Response {
    reqn: number;
    retval: number;
    retdesc: string;
    operation?: WmX13OperationDetails;
}

/**
 * Interface for WebMoney X13 reject protect operations.
 */
export class WmX13Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'wmtranid', validator: WmValidator.validateRequired },
    ];

    /**
     * Creates a new instance of the WmX13Interface for rejecting protected payments.
     *
     * @param wmid - The WebMoney Identifier (WMID) used for authentication
     * @param key - The secret key used for signing requests
     * @param apiUrl - Optional custom API URL. If not provided, uses the default X13 endpoint from WmConfig
     * @param requestTimeout - Optional timeout in milliseconds for API requests
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl || WmConfig.DEFAULT_URLS.X13;
    }

    protected getInterfaceName(): string {
        return 'X13';
    }

    /**
     * Rejects a protected payment, returning funds to the sender.
     * @param req - The request parameters including the transaction ID to reject
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the reject protect response containing operation details
     * @throws WmNetworkError if the API request fails
     * @throws WmXmlError if the response is invalid
     * @throws WmApiError if the API returns an error
     */
    async rejectProtect(req: WmX13Request, reqn?: number): Promise<WmX13Response> {
        this.validateRequest(req, WmX13Interface.VALIDATION_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();

        const wmtranid = req.wmtranid.toString();

        const planString = `${wmtranid}${reqNumber}`;
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
                rejectprotect: {
                    wmtranid: wmtranid,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        const baseResponse = this.parseBaseResponse(responseText);

        let responseOperation: WmX13OperationDetails | undefined;
        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(responseText);

            if (parsed && parsed['w3s.response'] && parsed['w3s.response'].operation) {
                const op = parsed['w3s.response'].operation;

                if (op.opertype && op.dateupd) {
                    responseOperation = {
                        id: WmXml.parseInt(op['@_id']),
                        ts: WmXml.parseInt(op['@_ts']),
                        opertype: WmXml.parseInt(op.opertype),
                        dateupd: WmConvert.fromWmDate(op.dateupd),
                    };
                }
            }
        } catch (error) {
            console.warn('Failed to parse operation details with fast-xml-parser:', error);
        }

        return {
            ...baseResponse,
            operation: responseOperation,
        };
    }
}
