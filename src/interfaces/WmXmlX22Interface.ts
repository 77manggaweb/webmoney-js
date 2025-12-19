import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for receiving the ticket of prerequest payment form at merchant.webmoney
 */
export interface WmX22Request {
    validityperiodinhours: number;
    lang: string;
    lmi_payee_purse: string;
    lmi_payment_no: string;
    lmi_payment_amount: number;
    lmi_payment_desc: string;
    lmi_onetimepay: number;
    paymenttags: Record<string, string>;
}

/**
 * Response parameters for receiving the ticket of prerequest payment form at merchant.webmoney
 */
export interface WmX22Response {
    reqn: number;
    retval: number;
    retdesc: string;
    transtoken?: string;
    payurl?: string;
    validityperiodinhours?: number;
}

/**
 * Interface for WebMoney X22 receiving the ticket of prerequest payment form at merchant.webmoney
 */
export class WmX22Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'wmid', validator: WmValidator.validateWmid },
        { field: 'lmi_payee_purse', validator: WmValidator.validatePurse },
        { field: 'lmi_payment_no', validator: WmValidator.validateRequired },
        { field: 'lmi_payment_amount', validator: WmValidator.validateAmount },
        { field: 'lmi_payment_desc', validator: WmValidator.validateDescription },
    ];

    /**
     * Constructs a new instance of the WebMoney X22 receiving the ticket of prerequest payment form at merchant.webmoney.
     * @param wmid - The WebMoney ID of the user
     * @param key - The API key for the user
     * @param apiUrl - Optional URL for the WebMoney API.
     * @param requestTimeout - Optional request timeout in milliseconds.
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl || WmConfig.DEFAULT_URLS.X22;
    }

    protected getInterfaceName(): string {
        return 'X22';
    }

    // protected getEncoding(): string {
    // 	return 'utf-8';
    // }

    async receiveTicket(req: WmX22Request): Promise<WmX22Response> {
        this.validateRequest(req, WmX22Interface.VALIDATION_RULES);

        const plainString = `${this.wmid}${req.lmi_payee_purse}${req.lmi_payment_no}${req.validityperiodinhours}`;
        const sign = this.sign(plainString);

        const requestObject = {
            '?xml': {
                '@_version': '1.0',
                '@_encoding': this.getEncoding(),
            },
            'merchant.request': {
                signtags: {
                    wmid: this.wmid,
                    validityperiodinhours: req.validityperiodinhours,
                    lang: req.lang,
                    sign: sign,
                },
                paymenttags: {
                    lmi_payee_purse: req.lmi_payee_purse,
                    lmi_payment_no: req.lmi_payment_no,
                    lmi_payment_amount: req.lmi_payment_amount,
                    lmi_payment_desc: req.lmi_payment_desc,
                    lmi_onetimepay: req.lmi_onetimepay,
                    ...req.paymenttags,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);
        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        const baseResponse = this.parseBaseResponse(responseText);

        let wmX22Response: WmX22Response | undefined;
        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(responseText);

            if (parsed && parsed['merchant.response'] && parsed['merchant.response'].transtoken) {
                wmX22Response = {
                    ...baseResponse,
                    transtoken: parsed['merchant.response'].transtoken,
                    payurl: parsed['merchant.response'].payurl,
                    validityperiodinhours: parsed['merchant.response'].validityperiodinhours,
                };
            }
        } catch (error) {
            console.warn('Failed to parse invoice details with fast-xml-parser:', error);
        }

        return (
            wmX22Response ?? {
                ...baseResponse,
                transtoken: undefined,
                payurl: undefined,
                validityperiodinhours: undefined,
            }
        );
    }
}
