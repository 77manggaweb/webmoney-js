import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmConvert } from '../utils/WmConvert';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

export interface WmX18Request {
    lmi_payee_purse: string;
    lmi_payment_no: string;
    lmi_payment_no_type?: number;
    sign?: string;
}

/**
 * Detailed information about a WebMoney operation from merchant API.
 */
export interface WmX18OperationDetails {
    wmtransid?: string;
    wminvoiceid?: string;
    amount?: number;
    operdate?: Date;
    purpose?: string;
    pursefrom?: string;
    wmidfrom?: string;
    hold_period?: number;
    hold_state?: number;
    capitallerflag?: number;
    enumflag?: number;
    IPAddress?: string;
    telepat_phone?: string;
    telepat_paytype?: number;
    paymer_number?: string;
    paymer_email?: string;
    paymer_type?: number;
    cashier_number?: string;
    cashier_date?: string;
    cashier_amount?: number;
    sdp_type?: number;
}

/**
 * Error log information from merchant API.
 */
export interface WmX18ErrorLog {
    lmi_payee_purse?: string;
    lmi_payment_no?: string;
    datecrt?: Date;
    dateupd?: Date;
    date_s?: Date;
    date_pc?: Date;
    date_pd?: Date;
    p_type?: number;
    err_code?: number;
    siteid?: string;
    att?: number;
    date_notify?: Date;
    shop_id?: string;
}

/**
 * Response from the WebMoney X18 merchant transaction API.
 */
export interface WmX18Response {
    retval: number;
    retdesc: string;
    operation?: WmX18OperationDetails;
    errorlog?: WmX18ErrorLog;
}

/**
 * Interface for interacting with the WebMoney X18 Merchant API.
 * Provides functionality to retrieve transaction information from the WebMoney merchant system.
 */
export class WmX18Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'lmi_payee_purse', validator: WmValidator.validatePurse },
        { field: 'lmi_payment_no', validator: WmValidator.validateRequired },
    ];

    /**
     * Creates a new instance of the WmX18Interface for interacting with the WebMoney X18 Merchant API.
     * @param wmid - The WebMoney Identifier (WMID) used for authentication
     * @param key - The secret key used for signing requests
     * @param apiUrl - Optional custom API endpoint URL. If not provided, uses the default X18 URL from WmConfig
     * @param requestTimeout - Optional timeout in milliseconds for API requests
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl || WmConfig.DEFAULT_URLS.X18;
    }

    protected getInterfaceName(): string {
        return 'X18';
    }

    /**
     * Retrieves transaction information from the WebMoney merchant system.
     * @param req - The transaction request parameters including payee purse and payment number
     * @returns A promise that resolves to the transaction response containing operation details
     * @throws Error if the API request fails or returns an invalid response
     */
    async getTransaction(req: WmX18Request): Promise<WmX18Response> {
        this.validateRequest(req, WmX18Interface.VALIDATION_RULES);

        const lmi_payee_purse = req.lmi_payee_purse;
        const lmi_payment_no = req.lmi_payment_no;
        const lmi_payment_no_type = req.lmi_payment_no_type ?? 0;

        const plainString = `${this.wmid}${lmi_payee_purse}${lmi_payment_no}`;
        const sign = this.sign(plainString);

        const requestObject = {
            '?xml': {
                '@_version': '1.0',
                '@_encoding': this.getEncoding(),
            },
            'merchant.request': {
                wmid: this.wmid,
                lmi_payee_purse: lmi_payee_purse,
                lmi_payment_no: lmi_payment_no,
                lmi_payment_no_type: lmi_payment_no_type,
                sign: sign,
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        return this.parseXmlResponse(responseText);
    }

    /**
     * Parses the XML response from the WebMoney Merchant API using XMLParser.
     * X18 uses merchant.response root instead of w3s.response.
     * @param xmlText - The raw XML response text from the API
     * @returns The parsed response object containing all extracted data
     */
    private parseXmlResponse(xmlText: string): WmX18Response {
        let retval = 0;
        let retdesc = '';
        let responseOperation: WmX18OperationDetails | undefined;
        let responseErrorLog: WmX18ErrorLog | undefined;

        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(xmlText);

            if (parsed && parsed['merchant.response']) {
                const response = parsed['merchant.response'];
                retval = response.retval ? WmXml.parseInt(response.retval) : 0;
                retdesc = response.retdesc ?? '';

                if (response.operation) {
                    responseOperation = this.parseOperation(response.operation);
                }

                if (response.errorlog) {
                    responseErrorLog = this.parseErrorLog(response.errorlog);
                }
            }
        } catch (error) {
            console.warn('Failed to parse merchant response with fast-xml-parser:', error);
        }

        return {
            retval,
            retdesc,
            operation: responseOperation,
            errorlog: responseErrorLog,
        };
    }

    private parseOperation(op: any): WmX18OperationDetails {
        return {
            wmtransid: op['@_wmtransid'] ?? undefined,
            wminvoiceid: op['@_wminvoiceid'] ?? undefined,
            amount: op.amount ? WmXml.parseFloat(op.amount) : undefined,
            operdate: op.operdate ? WmConvert.fromWmDateTime(op.operdate) : undefined,
            purpose: WmXml.decodeHtmlEntities(op.purpose ?? undefined),
            pursefrom: op.pursefrom ?? undefined,
            wmidfrom: op.wmidfrom ?? undefined,
            hold_period: op.hold_period ? WmXml.parseInt(op.hold_period) : undefined,
            hold_state: op.hold_state ? WmXml.parseInt(op.hold_state) : undefined,
            capitallerflag: op.capitallerflag ? WmXml.parseInt(op.capitallerflag) : undefined,
            enumflag: op.enumflag ? WmXml.parseInt(op.enumflag) : undefined,
            IPAddress: op.IPAddress ?? undefined,
            telepat_phone: op.telepat_phone ?? undefined,
            telepat_paytype: op.telepat_paytype ? WmXml.parseInt(op.telepat_paytype) : undefined,
            paymer_number: op.paymer_number ?? undefined,
            paymer_email: op.paymer_email ?? undefined,
            paymer_type: op.paymer_type ? WmXml.parseInt(op.paymer_type) : undefined,
            cashier_number: op.cashier_number ?? undefined,
            cashier_date: op.cashier_date ?? undefined,
            cashier_amount: op.cashier_amount ? WmXml.parseFloat(op.cashier_amount) : undefined,
            sdp_type: op.sdp_type ? WmXml.parseInt(op.sdp_type) : undefined,
        };
    }

    private parseErrorLog(errlog: any): WmX18ErrorLog {
        return {
            lmi_payee_purse: errlog['@_lmi_payee_purse'] ?? undefined,
            lmi_payment_no: errlog['@_lmi_payment_no'] ?? undefined,
            datecrt: errlog.datecrt ? WmConvert.fromWmDateTime(errlog.datecrt) : undefined,
            dateupd: errlog.dateupd ? WmConvert.fromWmDateTime(errlog.dateupd) : undefined,
            date_s: errlog.date_s ? WmConvert.fromWmDateTime(errlog.date_s) : undefined,
            date_pc: errlog.date_pc ? WmConvert.fromWmDateTime(errlog.date_pc) : undefined,
            date_pd: errlog.date_pd ? WmConvert.fromWmDateTime(errlog.date_pd) : undefined,
            p_type: errlog.p_type ? WmXml.parseInt(errlog.p_type) : undefined,
            err_code: errlog.err_code ? WmXml.parseInt(errlog.err_code) : undefined,
            siteid: errlog.siteid ?? undefined,
            att: errlog.att ? WmXml.parseInt(errlog.att) : undefined,
            date_notify: errlog.date_notify
                ? WmConvert.fromWmDateTime(errlog.date_notify)
                : undefined,
            shop_id: errlog.shop_id ?? undefined,
        };
    }
}
