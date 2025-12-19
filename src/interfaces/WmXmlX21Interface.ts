import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for the first query (trust request) of X21 interface.
 */
export interface WmX21TrustRequestRequest {
    lmi_payee_purse: string;
    lmi_day_limit: number;
    lmi_week_limit: number;
    lmi_month_limit: number;
    lmi_clientnumber: string;
    lmi_clientnumber_type: number;
    lmi_sms_type: number;
    lang: string;
}

/**
 * Trust information from the first query response.
 */
export interface WmX21TrustRequestTrust {
    purseid?: string;
    realsmstype?: string;
}

/**
 * Response from the first query (trust request) of X21 interface.
 */
export interface WmX21TrustRequestResponse {
    retval: number;
    retdesc: string;
    userdesc?: string;
    trust?: WmX21TrustRequestTrust;
}

/**
 * Request parameters for the second query (trust confirm) of X21 interface.
 */
export interface WmX21TrustConfirmRequest {
    lmi_purseid: string;
    lmi_clientnumber_code: string;
    lang?: string;
}

/**
 * Trust information from the second query response.
 */
export interface WmX21TrustConfirmTrust {
    id?: string;
    slavepurse?: string;
    slavewmid?: string;
    masterwmid?: string;
}

/**
 * Response from the second query (trust confirm) of X21 interface.
 */
export interface WmX21TrustConfirmResponse {
    retval: number;
    retdesc: string;
    userdesc?: string;
    trust?: WmX21TrustConfirmTrust;
}

/**
 * Interface for WebMoney X21 merchant trust operations.
 * Handles communication with the WebMoney Merchant XML API for setting trust for merchant payments by SMS.
 */
export class WmX21Interface extends WmBaseInterface {
    private readonly requestApiUrl: string;
    private readonly confirmApiUrl: string;

    private static readonly TRUST_REQUEST_RULES: ValidationRule[] = [
        { field: 'lmi_payee_purse', validator: WmValidator.validatePurse },
        { field: 'lmi_day_limit', validator: WmValidator.validateRequired },
        { field: 'lmi_week_limit', validator: WmValidator.validateRequired },
        { field: 'lmi_month_limit', validator: WmValidator.validateRequired },
        { field: 'lmi_clientnumber', validator: WmValidator.validateRequired },
        { field: 'lmi_clientnumber_type', validator: WmValidator.validateRequired },
        { field: 'lmi_sms_type', validator: WmValidator.validateRequired },
        { field: 'lang', validator: WmValidator.validateRequired },
    ];

    private static readonly TRUST_CONFIRM_RULES: ValidationRule[] = [
        { field: 'lmi_purseid', validator: WmValidator.validatePurse },
        { field: 'lmi_clientnumber_code', validator: WmValidator.validateRequired },
    ];

    /**
     * Creates a new WmX21Interface instance.
     * @param wmid - The WebMoney ID (WMID) of the merchant
     * @param key - The private key used for signing requests
     * @param requestApiUrl - Optional API endpoint URL for trust request. Defaults to the official WebMoney Merchant API endpoint
     * @param confirmApiUrl - Optional API endpoint URL for trust confirm. Defaults to the official WebMoney Merchant API endpoint
     * @param requestTimeout - Optional timeout for API requests in milliseconds.
     */
    constructor(
        wmid: string,
        key: string,
        requestApiUrl?: string,
        confirmApiUrl?: string,
        requestTimeout?: number
    ) {
        super(wmid, key, requestTimeout);
        this.requestApiUrl = requestApiUrl || WmConfig.DEFAULT_URLS.X21_REQUEST;
        this.confirmApiUrl = confirmApiUrl || WmConfig.DEFAULT_URLS.X21_CONFIRM;
    }

    protected getInterfaceName(): string {
        return 'X21';
    }

    /**
     * Initiates a trust request for merchant payments by SMS (first query).
     * @param req - The trust request parameters including payee purse, limits, client number, SMS type, etc.
     * @returns A promise that resolves to the trust request response containing return value, description, and trust details
     * @throws Error if the API request fails or returns an invalid response
     */
    async trustRequest(req: WmX21TrustRequestRequest): Promise<WmX21TrustRequestResponse> {
        this.validateRequest(req, WmX21Interface.TRUST_REQUEST_RULES);

        const plainString = `${this.wmid}${req.lmi_payee_purse}${req.lmi_clientnumber}${req.lmi_clientnumber_type}${req.lmi_sms_type}`;
        const sign = this.sign(plainString);

        const requestObject = {
            '?xml': {
                '@_version': '1.0',
                '@_encoding': this.getEncoding(),
            },
            'merchant.request': {
                wmid: this.wmid,
                lmi_payee_purse: req.lmi_payee_purse,
                lmi_day_limit: req.lmi_day_limit,
                lmi_week_limit: req.lmi_week_limit,
                lmi_month_limit: req.lmi_month_limit,
                lmi_clientnumber: req.lmi_clientnumber,
                lmi_clientnumber_type: req.lmi_clientnumber_type,
                lmi_sms_type: req.lmi_sms_type,
                sign: sign,
                lang: req.lang,
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.requestApiUrl);

        return this.parseTrustRequestResponse(responseText);
    }

    /**
     * Confirms a trust request by providing SMS code (second query).
     * @param req - The trust confirm parameters including purse ID and SMS code
     * @returns A promise that resolves to the trust confirm response containing return value, description, and trust details
     * @throws Error if the API request fails or returns an invalid response
     */
    async trustConfirm(req: WmX21TrustConfirmRequest): Promise<WmX21TrustConfirmResponse> {
        this.validateRequest(req, WmX21Interface.TRUST_CONFIRM_RULES);

        const lmi_purseid = req.lmi_purseid;
        const lmi_clientnumber_code = req.lmi_clientnumber_code;
        const lang = req.lang || '';

        const plainString = `${this.wmid}${lmi_purseid}${lmi_clientnumber_code}`;
        const sign = this.sign(plainString);

        const requestObject = {
            '?xml': {
                '@_version': '1.0',
                '@_encoding': this.getEncoding(),
            },
            'merchant.request': {
                wmid: this.wmid,
                lmi_purseid: lmi_purseid,
                lmi_clientnumber_code: lmi_clientnumber_code,
                sign: sign,
                lang: lang,
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.confirmApiUrl);

        return this.parseTrustConfirmResponse(responseText);
    }

    /**
     * Parses the XML response from the trust request (first query) using XMLParser.
     * X21 uses merchant.response root instead of w3s.response.
     * @param xmlText - The raw XML response text from the API
     * @returns The parsed response object containing all extracted data
     */
    private parseTrustRequestResponse(xmlText: string): WmX21TrustRequestResponse {
        let retval = 0;
        let retdesc = '';
        let userdesc: string | undefined;
        let responseTrust: WmX21TrustRequestTrust | undefined;

        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(xmlText);

            if (parsed && parsed['merchant.response']) {
                const response = parsed['merchant.response'];
                retval = response.retval ? WmXml.parseInt(response.retval) : 0;
                retdesc = response.retdesc ?? '';
                userdesc = response.userdesc ?? undefined;

                if (response.trust) {
                    responseTrust = this.parseTrustRequestTrust(response.trust);
                }
            }
        } catch (error) {
            console.warn('Failed to parse merchant response with fast-xml-parser:', error);
        }

        return {
            retval,
            retdesc,
            userdesc,
            trust: responseTrust,
        };
    }

    /**
     * Parses the XML response from the trust confirm (second query) using XMLParser.
     * X21 uses merchant.response root instead of w3s.response.
     * @param xmlText - The raw XML response text from the API
     * @returns The parsed response object containing all extracted data
     */
    private parseTrustConfirmResponse(xmlText: string): WmX21TrustConfirmResponse {
        let retval = 0;
        let retdesc = '';
        let userdesc: string | undefined;
        let responseTrust: WmX21TrustConfirmTrust | undefined;

        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(xmlText);

            if (parsed && parsed['merchant.response']) {
                const response = parsed['merchant.response'];
                retval = response.retval ? WmXml.parseInt(response.retval) : 0;
                retdesc = response.retdesc ?? '';
                userdesc = response.userdesc ?? undefined;

                if (response.trust) {
                    responseTrust = this.parseTrustConfirmTrust(response.trust);
                }
            }
        } catch (error) {
            console.warn('Failed to parse merchant response with fast-xml-parser:', error);
        }

        return {
            retval,
            retdesc,
            userdesc,
            trust: responseTrust,
        };
    }

    private parseTrustRequestTrust(trust: any): WmX21TrustRequestTrust {
        return {
            purseid: trust['@_purseid'] ?? undefined,
            realsmstype: trust.realsmstype ?? undefined,
        };
    }

    private parseTrustConfirmTrust(trust: any): WmX21TrustConfirmTrust {
        return {
            id: trust['@_id'] ?? undefined,
            slavepurse: trust.slavepurse ?? undefined,
            slavewmid: trust.slavewmid ?? undefined,
            masterwmid: trust.masterwmid ?? undefined,
        };
    }
}
