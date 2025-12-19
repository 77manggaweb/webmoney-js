import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Operation details for X19 check user request.
 */
export interface WmX19OperationRequest {
    type: string | number;
    direction: number;
    pursetype: string;
    amount: number;
    id?: string;
}

/**
 * User information for X19 check user request.
 */
export interface WmX19UserInfoRequest {
    wmid?: string;
    pnomer?: string;
    fname?: string;
    iname?: string;
    bank_name?: string;
    bank_account?: string;
    card_number?: string;
    emoney_name?: string;
    emoney_id?: string;
    crypto_name?: string;
    crypto_address?: string;
    phone?: string;
}

/**
 * Request parameters for checking user information (X19 interface).
 */
export interface WmX19Request {
    lang: string;
    operation: WmX19OperationRequest;
    userinfo: WmX19UserInfoRequest;
}

/**
 * User information from X19 check user response.
 */
export interface WmX19UserInfoResponse {
    iname?: string;
    oname?: string;
}

/**
 * Response from the WebMoney X19 check user API.
 */
export interface WmX19Response {
    reqn: number;
    retval: number;
    retdesc: string;
    retid?: string;
    userinfo?: WmX19UserInfoResponse;
}

/**
 * Interface for WebMoney X19 verifying personal information for the owner of a WM identifier.
 */
export class WmX19Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'lang', validator: WmValidator.validateRequired },
        { field: 'operation', validator: WmValidator.validateRequired },
        { field: 'userinfo', validator: WmValidator.validateRequired },
    ];

    /**
     * Creates a new WmX19Interface instance.
     * @param wmid - The WebMoney ID (WMID) of the signer
     * @param key - The private key used for signing requests
     * @param apiUrl - Optional API endpoint URL. Defaults to the official WebMoney Passport API endpoint
     * @param requestTimeout - Optional request timeout in milliseconds.
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl || WmConfig.DEFAULT_URLS.X19;
    }

    protected getInterfaceName(): string {
        return 'X19';
    }

    /**
     * Checks user information in the WebMoney system.
     * @param req - The check user request parameters including operation and userinfo
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the check user response containing return value, description, and user info
     * @throws Error if the API request fails or returns an invalid response
     */
    async checkUser(req: WmX19Request, reqn?: number): Promise<WmX19Response> {
        this.validateRequest(req, WmX19Interface.VALIDATION_RULES);
        WmValidator.validateRequired(req.operation.type, 'operation.type', this.getInterfaceName());
        if (req.userinfo.wmid) {
            WmValidator.validateWmid(req.userinfo.wmid, this.getInterfaceName());
        }
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();
        const plainData = `${reqNumber}${req.operation.type}${req.userinfo.wmid}`;
        const sign = this.sign(plainData);

        const op = req.operation;
        const operationObj: any = {
            type: op.type,
        };
        if (op.direction !== undefined) operationObj.direction = op.direction;
        if (op.pursetype) operationObj.pursetype = op.pursetype;
        if (op.amount !== undefined) operationObj.amount = op.amount;
        if (op.id) operationObj.id = op.id;

        const ui = req.userinfo;
        const userinfoObj: any = {};
        if (ui.wmid) userinfoObj.wmid = ui.wmid;
        if (ui.pnomer) userinfoObj.pnomer = ui.pnomer;
        if (ui.fname) userinfoObj.fname = ui.fname;
        if (ui.iname) userinfoObj.iname = ui.iname;
        if (ui.bank_name) userinfoObj.bank_name = ui.bank_name;
        if (ui.bank_account) userinfoObj.bank_account = ui.bank_account;
        if (ui.card_number) userinfoObj.card_number = ui.card_number;
        if (ui.emoney_name) userinfoObj.emoney_name = ui.emoney_name;
        if (ui.emoney_id) userinfoObj.emoney_id = ui.emoney_id;
        if (ui.crypto_name) userinfoObj.crypto_name = ui.crypto_name;
        if (ui.crypto_address) userinfoObj.crypto_address = ui.crypto_address;
        if (ui.phone) userinfoObj.phone = ui.phone;

        const requestObject = {
            '?xml': {
                '@_version': '1.0',
                '@_encoding': this.getEncoding(),
            },
            'passport.request': {
                reqn: reqNumber,
                lang: req.lang,
                signerwmid: this.wmid,
                sign: sign,
                operation: operationObj,
                userinfo: userinfoObj,
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        return this.parseXmlResponse(responseText);
    }

    /**
     * Parses the XML response from the WebMoney Passport API using XMLParser.
     * X19 uses passport.response root instead of w3s.response.
     * @param xmlText - The raw XML response text from the API
     * @returns The parsed response object containing all extracted data
     */
    private parseXmlResponse(xmlText: string): WmX19Response {
        let reqn = 0;
        let retval = 0;
        let retdesc = '';
        let retid: string | undefined;
        let responseUserInfo: WmX19UserInfoResponse | undefined;

        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(xmlText);

            if (parsed && parsed['passport.response']) {
                const response = parsed['passport.response'];
                reqn = response.reqn ? WmXml.parseInt(response.reqn) : 0;
                retval = response.retval ? WmXml.parseInt(response.retval) : 0;
                retdesc = response.retdesc ?? '';
                retid = response.retid ?? undefined;

                if (response.userinfo) {
                    responseUserInfo = {
                        iname: response.userinfo.iname ?? undefined,
                        oname: response.userinfo.oname ?? undefined,
                    };
                }
            }
        } catch (error) {
            console.warn('Failed to parse passport response with fast-xml-parser:', error);
        }

        return {
            reqn,
            retval,
            retdesc,
            retid,
            userinfo: responseUserInfo,
        };
    }
}
