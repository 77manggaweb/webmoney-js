import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmConvert } from '../utils/WmConvert';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for retrieving incoming invoices (X10 interface).
 */
export interface WmX10Request {
    wmid: string;
    wminvid?: number;
    datestart?: Date;
    datefinish?: Date;
}

/**
 * Detailed information about an incoming WebMoney invoice.
 */
export interface WmX10InvoiceDetails {
    id: number;
    ts: number;
    orderid: number;
    storewmid: string;
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
 * Response from the WebMoney X10 incoming invoices API.
 */
export interface WmX10Response {
    reqn: number;
    retval: number;
    retdesc: string;
    ininvoices?: WmX10InvoiceDetails[];
}

/**
 * Interface for WebMoney X10 incoming invoices.
 */
export class WmX10Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'wmid', validator: WmValidator.validateWmid },
    ];

    /**
     * Creates a new instance of the WmX10Interface for retrieving incoming WebMoney invoices.
     *
     * @param wmid - The WebMoney identifier (WMID) of the user making the request
     * @param key - The private key used for signing requests
     * @param apiUrl - Optional custom API URL for the X10 interface. If not provided, uses the default X10 URL from WmConfig
     * @param requestTimeout - Optional timeout in milliseconds for API requests. If not provided, uses the default timeout
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl ?? WmConfig.DEFAULT_URLS.X10;
    }

    protected getInterfaceName(): string {
        return 'X10';
    }

    /**
     * Retrieves incoming invoices sent to the user.
     * @param req - The request parameters including WMID and optional filters (invoice ID, date range)
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the incoming invoices response containing a list of invoices
     * @throws WmNetworkError if the API request fails
     * @throws WmXmlError if the response is invalid
     * @throws WmApiError if the API returns an error
     */
    async getInInvoices(req: WmX10Request, reqn?: number): Promise<WmX10Response> {
        this.validateRequest(req, WmX10Interface.VALIDATION_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();

        const targetWmid = req.wmid;
        const wminvid = req.wminvid ?? '';
        const datestart = req.datestart ? WmConvert.toWmDate(req.datestart) : '';
        const datefinish = req.datefinish ? WmConvert.toWmDate(req.datefinish) : '';

        const planString = `${targetWmid}${wminvid}${datestart}${datefinish}${reqNumber}`;
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
                getininvoices: {
                    wmid: targetWmid,
                    wminvid: wminvid,
                    datestart: datestart,
                    datefinish: datefinish,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        const baseResponse = this.parseBaseResponse(responseText);

        const responseInvoices: WmX10InvoiceDetails[] = [];

        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(responseText);

            if (parsed && parsed['w3s.response'] && parsed['w3s.response'].ininvoices) {
                this.parseArrayElements(parsed['w3s.response'].ininvoices, 'ininvoice', (ininv) => {
                    const invoice: WmX10InvoiceDetails = {
                        id: WmXml.parseInt(ininv['@_id']),
                        ts: WmXml.parseInt(ininv['@_ts']),
                        orderid: ininv.orderid ? WmXml.parseInt(ininv.orderid) : 0,
                        storewmid: ininv.storewmid ?? '',
                        storepurse: ininv.storepurse ?? '',
                        amount: ininv.amount ? WmXml.parseFloat(ininv.amount) : 0,
                        desc: WmXml.decodeHtmlEntities(ininv.desc ?? ''),
                        address: WmXml.decodeHtmlEntities(ininv.address ?? ''),
                        period: ininv.period ? WmXml.parseInt(ininv.period) : 0,
                        expiration: ininv.expiration ? WmXml.parseInt(ininv.expiration) : 0,
                        state: ininv.state ? WmXml.parseInt(ininv.state) : 0,
                        datecrt: ininv.datecrt ? WmConvert.fromWmDate(ininv.datecrt) : undefined,
                        dateupd: ininv.dateupd ? WmConvert.fromWmDate(ininv.dateupd) : undefined,
                        wmtranid: ininv.wmtranid ? WmXml.parseInt(ininv.wmtranid) : 0,
                    };
                    return invoice;
                }).forEach((invoice) => responseInvoices.push(invoice));
            }
        } catch (error) {
            console.warn('Failed to parse ininvoices list with fast-xml-parser:', error);
        }

        return {
            ...baseResponse,
            ininvoices: responseInvoices.length > 0 ? responseInvoices : undefined,
        };
    }
}
