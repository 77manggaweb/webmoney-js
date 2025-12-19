import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmConvert } from '../utils/WmConvert';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for processing a moneyback transaction (X14 interface).
 */
export interface WmX14Request {
    inwmtranid: number;
    amount: number;
    moneybackphone: string;
    capitallerpursesrc: string;
}

/**
 * Detailed information about a moneyback operation.
 */
export interface WmX14OperationDetails {
    id: number;
    ts: number;
    tranid: number;
    inwmtranid: number;
    pursesrc: string;
    pursedest: string;
    amount: number;
    comiss: number;
    opertype: number;
    period: number;
    wminvid: number;
    orderid: number;
    desc: string;
    datecrt?: Date;
    dateupd?: Date;
    corrwm: string;
    outgosrc: string;
    incomedest: string;
}

/**
 * Response from the WebMoney X14 moneyback API.
 */
export interface WmX14Response {
    reqn: number;
    retval: number;
    retdesc: string;
    operation?: WmX14OperationDetails;
}

/**
 * Interface for WebMoney X14 fee-free refund.
 */
export class WmX14Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'inwmtranid', validator: WmValidator.validateRequired },
        { field: 'amount', validator: WmValidator.validateAmount },
        { field: 'moneybackphone', validator: WmValidator.validateRequired },
        { field: 'capitallerpursesrc', validator: WmValidator.validatePurse },
    ];

    /**
     * Creates a new instance of the WmX14Interface for processing moneyback (refund) transactions.
     *
     * @param wmid - The WebMoney Identifier (WMID) used for authentication
     * @param key - The secret key used for signing requests
     * @param apiUrl - Optional custom API endpoint URL. If not provided, uses the default X14 URL from WmConfig
     * @param requestTimeout - Optional timeout in milliseconds for API requests. If not provided, uses the default timeout
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl || WmConfig.DEFAULT_URLS.X14;
    }

    protected getInterfaceName(): string {
        return 'X14';
    }

    /**
     * Processes a moneyback (refund) transaction.
     * @param req - The request parameters including incoming transaction ID, amount, and moneyback details
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the moneyback response containing operation details
     * @throws WmNetworkError if the API request fails
     * @throws WmXmlError if the response is invalid
     * @throws WmApiError if the API returns an error
     */
    async moneyback(req: WmX14Request, reqn?: number): Promise<WmX14Response> {
        this.validateRequest(req, WmX14Interface.VALIDATION_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();

        const inwmtranid = req.inwmtranid.toString();
        const amount = WmConvert.toWmCurrency(req.amount);
        const moneybackphone = req.moneybackphone;
        const capitallerpursesrc = req.capitallerpursesrc;

        const planString = `${reqNumber}${inwmtranid}${amount}`;
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
                trans: {
                    inwmtranid: inwmtranid,
                    amount: amount,
                    moneybackphone: moneybackphone,
                    capitallerpursesrc: capitallerpursesrc,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        const baseResponse = this.parseBaseResponse(responseText);

        let responseOperation: WmX14OperationDetails | undefined;
        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(responseText);

            if (parsed && parsed['w3s.response'] && parsed['w3s.response'].operation) {
                const op = parsed['w3s.response'].operation;

                if (
                    op['@_id'] &&
                    op['@_ts'] &&
                    op.tranid &&
                    op.inwmtranid &&
                    op.pursesrc &&
                    op.pursedest &&
                    op.amount &&
                    op.opertype
                ) {
                    responseOperation = {
                        id: WmXml.parseInt(op['@_id']),
                        ts: WmXml.parseInt(op['@_ts']),
                        tranid: WmXml.parseInt(op.tranid),
                        inwmtranid: WmXml.parseInt(op.inwmtranid),
                        pursesrc: op.pursesrc,
                        pursedest: op.pursedest,
                        amount: WmXml.parseFloat(op.amount),
                        comiss: WmXml.parseFloat(op.comiss || '0'),
                        opertype: WmXml.parseInt(op.opertype),
                        period: WmXml.parseInt(op.period || '0'),
                        wminvid: WmXml.parseInt(op.wminvid || '0'),
                        orderid: WmXml.parseInt(op.orderid || '0'),
                        desc: WmXml.decodeHtmlEntities(op.desc ?? ''),
                        datecrt: op.datecrt ? WmConvert.fromWmDate(op.datecrt) : undefined,
                        dateupd: op.dateupd ? WmConvert.fromWmDate(op.dateupd) : undefined,
                        corrwm: op.corrwm ?? '',
                        outgosrc: op.outgosrc ?? '',
                        incomedest: op.incomedest ?? '',
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
