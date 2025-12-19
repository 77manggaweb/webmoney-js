import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmConvert } from '../utils/WmConvert';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for transferring funds between WebMoney purses (X2 interface).
 */
export interface WmX2Request {
    tranid: number;
    pursesrc: string;
    pursedest: string;
    amount: number;
    period: number;
    pcode: string;
    desc: string;
    wminvid: number;
    onlyauth: number;
}

/**
 * Detailed information about a WebMoney transfer operation.
 */
export interface WmX2OperationDetails {
    id: number;
    ts: number;
    tranid: number;
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
}

/**
 * Response from the WebMoney X2 transfer API.
 */
export interface WmX2Response {
    reqn: number;
    retval: number;
    retdesc: string;
    operation?: WmX2OperationDetails;
}

/**
 * Interface for WebMoney X2 transfer operations.
 */
export class WmX2Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'pursesrc', validator: WmValidator.validatePurse },
        { field: 'pursedest', validator: WmValidator.validatePurse },
        { field: 'amount', validator: WmValidator.validateAmount },
        { field: 'desc', validator: WmValidator.validateDescription },
    ];

    /**
     * Creates a new instance of the WebMoney X2 transfer interface.
     * @param wmid - The WebMoney WMID of the account
     * @param key - The WebMoney XML presentation of private key
     * @param apiUrl - Optional API URL. If not provided, defaults to the WebMoney X2 API URL
     * @param requestTimeout - Optional request timeout in milliseconds. If not provided, uses default timeout
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl ?? WmConfig.DEFAULT_URLS.X2;
    }

    protected getInterfaceName(): string {
        return 'X2';
    }

    /**
     * Transfers funds from one WebMoney purse to another.
     * @param req - The transfer request parameters including source purse, destination purse, and amount
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the transfer response containing operation details
     * @throws WmNetworkError if the API request fails
     * @throws WmXmlError if the response is invalid
     * @throws WmApiError if the API returns an error
     */
    async transfer(req: WmX2Request, reqn?: number): Promise<WmX2Response> {
        this.validateRequest(req, WmX2Interface.VALIDATION_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();

        const tranid = req.tranid;
        const pursesrc = req.pursesrc;
        const pursedest = req.pursedest;
        const amount = WmConvert.toWmCurrency(req.amount);
        const period = req.period;
        const pcode = req.pcode;
        const desc = req.desc;
        const wminvid = req.wminvid;
        const onlyauth = req.onlyauth;

        const planString = `${reqNumber}${tranid}${pursesrc}${pursedest}${amount}${period}${pcode}${desc}${wminvid}`;
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
                    tranid: tranid,
                    pursesrc: pursesrc,
                    pursedest: pursedest,
                    amount: amount,
                    period: period,
                    pcode: pcode,
                    desc: desc,
                    wminvid: wminvid,
                    onlyauth: onlyauth,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        const baseResponse = this.parseBaseResponse(responseText);

        let operation: WmX2OperationDetails | undefined;
        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(responseText);

            if (parsed && parsed['w3s.response'] && parsed['w3s.response'].operation) {
                const op = parsed['w3s.response'].operation;

                if (
                    op['@_id'] &&
                    op['@_ts'] &&
                    op.tranid &&
                    op.pursesrc &&
                    op.pursedest &&
                    op.amount &&
                    op.opertype
                ) {
                    operation = {
                        id: WmXml.parseInt(op['@_id']),
                        ts: WmXml.parseInt(op['@_ts']),
                        tranid: WmXml.parseInt(op.tranid),
                        pursesrc: op.pursesrc,
                        pursedest: op.pursedest,
                        amount: WmXml.parseFloat(op.amount),
                        comiss: op.comiss ? WmXml.parseFloat(op.comiss) : 0,
                        opertype: WmXml.parseInt(op.opertype),
                        period: op.period ? WmXml.parseInt(op.period) : 0,
                        wminvid: op.wminvid ? WmXml.parseInt(op.wminvid) : 0,
                        orderid: op.orderid ? WmXml.parseInt(op.orderid) : 0,
                        desc: WmXml.decodeHtmlEntities(op.desc ?? ''),
                        datecrt: op.datecrt ? WmConvert.fromWmDate(op.datecrt) : undefined,
                        dateupd: op.dateupd ? WmConvert.fromWmDate(op.dateupd) : undefined,
                    };
                }
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
