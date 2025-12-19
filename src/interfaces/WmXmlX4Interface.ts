import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmConvert } from '../utils/WmConvert';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for retrieving outgoing invoices (X4 interface).
 */
export interface WmX4Request {
    purse?: string;
    wminvid?: number;
    orderid?: number;
    datestart?: Date;
    datefinish?: Date;
}

/**
 * Detailed information about an outgoing WebMoney invoice.
 */
export interface WmX4OutInvoiceDetails {
    id: number;
    ts: number;
    orderid: number;
    customerwmid: string;
    storepurse: string;
    amount: number;
    desc: string;
    address: string;
    period: number;
    expiration: number;
    state: number;
    datecrt?: Date;
    dateupd?: Date;
    wmtranid: number;
}

/**
 * Response from the WebMoney X4 outgoing invoices API.
 */
export interface WmX4Response {
    reqn: number;
    retval: number;
    retdesc: string;
    outinvoices?: WmX4OutInvoiceDetails[];
    outinvoicesCount?: number;
}

/**
 * Interface for WebMoney X4 outgoing invoices.
 */
export class WmX4Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'purse', validator: WmValidator.validatePurse },
    ];

    /**
     * Creates a new instance of the WebMoney X4 outgoing invoices interface.
     * @param wmid - The WebMoney WMID of the account
     * @param key - The WebMoney XML presentation of private key
     * @param apiUrl - Optional API URL. If not provided, defaults to the WebMoney X4 API URL
     * @param requestTimeout - Optional request timeout in milliseconds. If not provided, uses default timeout
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl ?? WmConfig.DEFAULT_URLS.X4;
    }

    protected getInterfaceName(): string {
        return 'X4';
    }

    /**
     * Retrieves outgoing invoices created by the user.
     * @param req - The request parameters including optional purse and filters (invoice ID, order ID, date range)
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the outgoing invoices response containing a list of invoices
     * @throws WmNetworkError if the API request fails
     * @throws WmXmlError if the response is invalid
     * @throws WmApiError if the API returns an error
     */
    async getOutInvoices(req: WmX4Request, reqn?: number): Promise<WmX4Response> {
        this.validateRequest(req, WmX4Interface.VALIDATION_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();

        const purse = req.purse ?? '';
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
                getoutinvoices: {
                    purse: purse,
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

        const outinvoicesData = this.parseDetailedResponse(
            responseText,
            'outinvoices',
            (outInvsBlock) => {
                const outinvoices: WmX4OutInvoiceDetails[] = [];
                const outinvoicesCount = WmXml.parseInt(outInvsBlock['@_cnt']);

                this.parseArrayElements(outInvsBlock, 'outinvoice', (outinv) => {
                    const outinvoice: WmX4OutInvoiceDetails = {
                        id: WmXml.parseInt(outinv['@_id']),
                        ts: WmXml.parseInt(outinv['@_ts']),
                        orderid: outinv.orderid ? WmXml.parseInt(outinv.orderid) : 0,
                        customerwmid: outinv.customerwmid ?? '',
                        storepurse: outinv.storepurse ?? '',
                        amount: outinv.amount ? WmXml.parseFloat(outinv.amount) : 0,
                        desc: WmXml.decodeHtmlEntities(outinv.desc ?? ''),
                        address: WmXml.decodeHtmlEntities(outinv.address ?? ''),
                        period: outinv.period ? WmXml.parseInt(outinv.period) : 0,
                        expiration: outinv.expiration ? WmXml.parseInt(outinv.expiration) : 0,
                        state: outinv.state ? WmXml.parseInt(outinv.state) : 0,
                        datecrt: outinv.datecrt ? WmConvert.fromWmDate(outinv.datecrt) : undefined,
                        dateupd: outinv.dateupd ? WmConvert.fromWmDate(outinv.dateupd) : undefined,
                        wmtranid: outinv.wmtranid ? WmXml.parseInt(outinv.wmtranid) : 0,
                    };
                    return outinvoice;
                }).forEach((outinvoice) => outinvoices.push(outinvoice));

                return { outinvoices, outinvoicesCount };
            }
        );

        return {
            ...baseResponse,
            outinvoices: outinvoicesData?.outinvoices,
            outinvoicesCount: outinvoicesData?.outinvoicesCount,
        };
    }
}
