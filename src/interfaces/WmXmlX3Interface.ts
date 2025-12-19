import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmConvert } from '../utils/WmConvert';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for retrieving operation history (X3 interface).
 */
export interface WmX3Request {
    purse: string;
    wmtranid?: number;
    tranid?: number;
    wminvid?: number;
    orderid?: number;
    datestart?: Date;
    datefinish?: Date;
}

/**
 * Detailed information about a WebMoney operation from history.
 */
export interface WmX3OperationDetails {
    id: number;
    ts: number;
    pursesrc: string;
    pursedest: string;
    amount: number;
    comiss: number;
    opertype: number;
    wminvid: number;
    orderid: number;
    tranid: number;
    period: number;
    desc: string;
    datecrt?: Date;
    dateupd?: Date;
    corrwm: string;
    rest: number;
    timelock?: string;
}

/**
 * Response from the WebMoney X3 operations history API.
 */
export interface WmX3Response {
    reqn: number;
    retval: number;
    retdesc: string;
    operations?: WmX3OperationDetails[];
    operationsCount?: number;
}

/**
 * Interface for WebMoney X3 operations history.
 */
export class WmX3Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'purse', validator: WmValidator.validatePurse },
    ];

    /**
     * Creates a new instance of the WebMoney X3 operations history interface.
     * @param wmid - The WebMoney WMID of the account
     * @param key - The WebMoney XML presentation of private key
     * @param apiUrl - Optional API URL. If not provided, defaults to the WebMoney X3 API URL
     * @param requestTimeout - Optional request timeout in milliseconds. If not provided, uses default timeout
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl ?? WmConfig.DEFAULT_URLS.X3;
    }

    protected getInterfaceName(): string {
        return 'X3';
    }

    /**
     * Retrieves operation history for a WebMoney purse.
     * @param req - The request parameters including purse and optional filters (date range, transaction ID, etc.)
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the operations history response containing a list of operations
     * @throws WmNetworkError if the API request fails
     * @throws WmXmlError if the response is invalid
     * @throws WmApiError if the API returns an error
     */
    async getOperations(req: WmX3Request, reqn?: number): Promise<WmX3Response> {
        this.validateRequest(req, WmX3Interface.VALIDATION_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();

        const purse = req.purse;
        const wmtranid = req.wmtranid ?? '';
        const tranid = req.tranid ?? '';
        const wminvid = req.wminvid ?? '';
        const orderid = req.orderid ?? '';
        const datestart = req.datestart ? WmConvert.toWmDate(req.datestart) : '';
        const datefinish = req.datefinish ? WmConvert.toWmDate(req.datefinish) : '';

        const plainString = `${purse}${reqNumber}`;
        const sign = this.sign(plainString);

        const requestObject = {
            '?xml': {
                '@_version': '1.0',
                '@_encoding': this.getEncoding(),
            },
            'w3s.request': {
                reqn: reqNumber,
                wmid: this.wmid,
                sign: sign,
                getoperations: {
                    purse: purse,
                    wmtranid: wmtranid,
                    tranid: tranid,
                    wminvid: wminvid,
                    orderid: orderid,
                    datestart: datestart,
                    datefinish: datefinish,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        const baseResponse = this.parseBaseResponse(responseText);

        const operationsData = this.parseDetailedResponse(
            responseText,
            'operations',
            (opsBlock) => {
                const operations: WmX3OperationDetails[] = [];
                const operationsCount = WmXml.parseInt(opsBlock['@_cnt']);

                this.parseArrayElements(opsBlock, 'operation', (op) => {
                    const operation: WmX3OperationDetails = {
                        id: WmXml.parseInt(op['@_id']),
                        ts: WmXml.parseInt(op['@_ts']),
                        pursesrc: op.pursesrc ?? '',
                        pursedest: op.pursedest ?? '',
                        amount: op.amount ? WmXml.parseFloat(op.amount) : 0,
                        comiss: op.comiss ? WmXml.parseFloat(op.comiss) : 0,
                        opertype: op.opertype ? WmXml.parseInt(op.opertype) : 0,
                        wminvid: op.wminvid ? WmXml.parseInt(op.wminvid) : 0,
                        orderid: op.orderid ? WmXml.parseInt(op.orderid) : 0,
                        tranid: op.tranid ? WmXml.parseInt(op.tranid) : 0,
                        period: op.period ? WmXml.parseInt(op.period) : 0,
                        desc: WmXml.decodeHtmlEntities(op.desc ?? ''),
                        datecrt: op.datecrt ? WmConvert.fromWmDate(op.datecrt) : undefined,
                        dateupd: op.dateupd ? WmConvert.fromWmDate(op.dateupd) : undefined,
                        corrwm: op.corrwm ?? '',
                        rest: op.rest ? WmXml.parseFloat(op.rest) : 0,
                        timelock: op.timelock !== undefined ? '' : undefined,
                    };
                    return operation;
                }).forEach((operation) => operations.push(operation));

                return { operations, operationsCount };
            }
        );

        return {
            ...baseResponse,
            operations: operationsData?.operations,
            operationsCount: operationsData?.operationsCount,
        };
    }
}
