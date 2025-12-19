import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmConvert } from '../utils/WmConvert';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for completing a protected payment (X5 interface).
 */
export interface WmX5Request {
    wmtranid: number;
    pcode: string;
}

/**
 * Detailed information about a completed protected payment operation.
 */
export interface WmX5OperationDetails {
    id: number;
    ts: number;
    opertype: number;
    dateupd?: Date;
}

/**
 * Response from the WebMoney X5 finish protect API.
 */
export interface WmX5Response {
    reqn: number;
    retval: number;
    retdesc: string;
    operation?: WmX5OperationDetails;
}

/**
 * Interface for WebMoney X5 finish protect operations.
 */
export class WmX5Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'wmtranid', validator: WmValidator.validateRequired },
        { field: 'pcode', validator: WmValidator.validateRequired },
    ];

    /**
     * Creates a new instance of the WebMoney X5 finish protect interface.
     * @param wmid - The WebMoney WMID of the account
     * @param key - The WebMoney XML presentation of private key
     * @param apiUrl - Optional API URL. If not provided, defaults to the WebMoney X5 API URL
     * @param requestTimeout - Optional request timeout in milliseconds. If not provided, uses default timeout
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl ?? WmConfig.DEFAULT_URLS.X5;
    }

    protected getInterfaceName(): string {
        return 'X5';
    }

    /**
     * Completes a protected payment by releasing funds to the recipient.
     * @param req - The request parameters including transaction ID and protection code
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the finish protect response containing operation details
     * @throws WmNetworkError if the API request fails
     * @throws WmXmlError if the response is invalid
     * @throws WmApiError if the API returns an error
     */
    async finishProtect(req: WmX5Request, reqn?: number): Promise<WmX5Response> {
        this.validateRequest(req, WmX5Interface.VALIDATION_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();

        const wmtranid = req.wmtranid.toString();
        const pcode = req.pcode;

        const planString = `${wmtranid}${pcode}${reqNumber}`;
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
                finishprotect: {
                    wmtranid: wmtranid,
                    pcode: pcode,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        const baseResponse = this.parseBaseResponse(responseText);

        let operation: WmX5OperationDetails | undefined;
        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(responseText);

            if (parsed && parsed['w3s.response'] && parsed['w3s.response'].operation) {
                const op = parsed['w3s.response'].operation;

                operation = {
                    id: WmXml.parseInt(op['@_id']),
                    ts: WmXml.parseInt(op['@_ts']),
                    opertype: WmXml.parseInt(op.opertype || 0),
                    dateupd: op.dateupd ? WmConvert.fromWmDate(op.dateupd) : undefined,
                };
            }
        } catch (error) {
            console.warn('Failed to parse operation details with fast-xml-parser:', error);
        }

        return {
            ...baseResponse,
            operation,
        };
    }
}
