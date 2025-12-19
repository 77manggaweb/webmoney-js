import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmConvert } from '../utils/WmConvert';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for creating a WebMoney invoice (X1 interface).
 */
export interface WmX1Request {
    orderid?: number;
    customerwmid: string;
    storepurse: string;
    amount: number;
    desc: string;
    address?: string;
    period?: number;
    expiration?: number;
    onlyauth?: number;
    lmi_shop_id?: string;
}

/**
 * Detailed information about a WebMoney invoice.
 */
export interface WmX1InvoiceDetails {
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
}

/**
 * Response from the WebMoney X1 invoice creation API.
 */
export interface WmX1Response {
    reqn: number;
    retval: number;
    retdesc: string;
    invoice?: WmX1InvoiceDetails;
}

/**
 * Interface for WebMoney X1 invoice creation operations.
 */
export class WmX1Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'customerwmid', validator: WmValidator.validateWmid },
        { field: 'storepurse', validator: WmValidator.validatePurse },
        { field: 'amount', validator: WmValidator.validateAmount },
        { field: 'desc', validator: WmValidator.validateDescription },
    ];

    /**
     * Creates a new instance of the WebMoney X1 invoice creation interface.
     * @param wmid - The WebMoney WMID of the account
     * @param key - The WebMoney XML presentations of private key
     * @param apiUrl - Optional API URL. If not provided, defaults to the WebMoney X1 API URL
     * @param requestTimeout - Optional request timeout in milliseconds.
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl ?? WmConfig.DEFAULT_URLS.X1;
    }

    protected getInterfaceName(): string {
        return 'X1';
    }

    /**
     * Creates a new invoice in the WebMoney system.
     * @param req - The invoice request parameters including customer WMID, store purse, amount, and description
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the invoice creation response containing request number, return value, description, and invoice details
     * @throws WmNetworkError if the API request fails
     * @throws WmXmlError if the response is invalid
     * @throws WmApiError if the API returns an error
     */
    async createInvoice(req: WmX1Request, reqn?: number): Promise<WmX1Response> {
        this.validateRequest(req, WmX1Interface.VALIDATION_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();

        const orderid = req.orderid ?? '';
        const customerwmid = req.customerwmid;
        const storepurse = req.storepurse;
        const amount = WmConvert.toWmCurrency(req.amount);
        const desc = req.desc;
        const address = req.address ?? '';
        const period = req.period ?? 0;
        const expiration = req.expiration ?? 0;
        const onlyauth = req.onlyauth ?? 1;
        const lmi_shop_id = req.lmi_shop_id ?? '';

        const planString = `${orderid}${customerwmid}${storepurse}${amount}${desc}${address}${period}${expiration}${reqNumber}`;
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
                invoice: {
                    orderid: orderid,
                    customerwmid: customerwmid,
                    storepurse: storepurse,
                    amount: amount,
                    desc: desc,
                    address: address,
                    period: period,
                    expiration: expiration,
                    onlyauth: onlyauth,
                    lmi_shop_id: lmi_shop_id,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        const baseResponse = this.parseBaseResponse(responseText);

        let invoice: WmX1InvoiceDetails | undefined;
        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(responseText);

            if (parsed && parsed['w3s.response'] && parsed['w3s.response'].invoice) {
                const inv = parsed['w3s.response'].invoice;

                if (
                    inv['@_id'] &&
                    inv['@_ts'] &&
                    inv.orderid &&
                    inv.customerwmid &&
                    inv.storepurse &&
                    inv.amount &&
                    inv.desc
                ) {
                    invoice = {
                        id: WmXml.parseInt(inv['@_id']),
                        ts: WmXml.parseInt(inv['@_ts']),
                        orderid: WmXml.parseInt(inv.orderid),
                        customerwmid: inv.customerwmid,
                        storepurse: inv.storepurse,
                        amount: WmXml.parseFloat(inv.amount),
                        desc: WmXml.decodeHtmlEntities(inv.desc),
                        address: WmXml.decodeHtmlEntities(inv.address ?? ''),
                        period: WmXml.parseInt(inv.period),
                        expiration: WmXml.parseInt(inv.expiration),
                        state: WmXml.parseInt(inv.state),
                        datecrt: inv.datecrt ? WmConvert.fromWmDate(inv.datecrt) : undefined,
                        dateupd: inv.dateupd ? WmConvert.fromWmDate(inv.dateupd) : undefined,
                    };
                }
            }
        } catch (error) {
            console.warn('Failed to parse invoice details with fast-xml-parser:', error);
        }

        return {
            ...baseResponse,
            invoice,
        };
    }
}
