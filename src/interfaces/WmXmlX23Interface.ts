import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmConvert } from '../utils/WmConvert';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for refusing/rejecting an invoice (X23 interface).
 */
export interface WmX23Request {
    wmid: string;
    wminvid: number;
}

/**
 * Invoice information from X23 response.
 */
export interface WmX23Invoice {
    id?: number;
    ts?: number;
    state?: number;
    dateupd?: Date;
}

/**
 * Response from the WebMoney X23 invoice refuse API.
 */
export interface WmX23Response {
    reqn: number;
    retval: number;
    retdesc: string;
    invoice?: WmX23Invoice;
}

/**
 * Interface for WebMoney X23 invoice refuse operations.
 */
export class WmX23Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'wmid', validator: WmValidator.validateWmid },
        { field: 'wminvid', validator: WmValidator.validateRequired },
    ];

    /**
     * Constructs a new instance of the WebMoney X23 invoice refuse interface.
     * @param wmid - The WebMoney ID of the user
     * @param key - The API key for the user
     * @param apiUrl - Optional URL for the WebMoney API.
     * @param requestTimeout - Optional request timeout in milliseconds.
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl || WmConfig.DEFAULT_URLS.X23;
    }

    protected getInterfaceName(): string {
        return 'X23';
    }

    /**
     * Refuses/rejects a received invoice or cancels an issued invoice.
     * @param req - The invoice refuse request parameters including WMID and invoice ID
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the invoice refuse response containing return value, description, and invoice details
     * @throws WmNetworkError if the API request fails
     * @throws WmXmlError if the response is invalid
     * @throws WmApiError if the API returns an error
     */
    async refuseInvoice(req: WmX23Request, reqn?: number): Promise<WmX23Response> {
        this.validateRequest(req, WmX23Interface.VALIDATION_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();

        const signString = `${req.wmid}${req.wminvid}${reqNumber}`;
        const sign = this.sign(signString);

        const requestObject = {
            '?xml': {
                '@_version': '1.0',
                '@_encoding': this.getEncoding(),
            },
            'w3s.request': {
                reqn: reqNumber,
                wmid: this.wmid,
                sign: sign,
                invoicerefuse: {
                    wmid: req.wmid,
                    wminvid: req.wminvid.toString(),
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        const baseResponse = this.parseBaseResponse(responseText);

        let responseInvoice: WmX23Invoice | undefined;
        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(responseText);

            if (parsed && parsed['w3s.response'] && parsed['w3s.response'].ininvoice) {
                const inv = parsed['w3s.response'].ininvoice;

                responseInvoice = {
                    id: inv['@_id'] ? WmXml.parseInt(inv['@_id']) : undefined,
                    ts: inv['@_ts'] ? WmXml.parseInt(inv['@_ts']) : undefined,
                    state: inv.state ? WmXml.parseInt(inv.state) : undefined,
                    dateupd: inv.dateupd ? WmConvert.fromWmDateTime(inv.dateupd) : undefined,
                };
            }
        } catch (error) {
            console.warn('Failed to parse invoice details with fast-xml-parser:', error);
        }

        return {
            ...baseResponse,
            invoice: responseInvoice,
        };
    }
}
