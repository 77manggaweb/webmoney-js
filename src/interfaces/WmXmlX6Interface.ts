import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmString } from '../utils/WmString';
import { WmConvert } from '../utils/WmConvert';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for sending a message to a WebMoney user (X6 interface).
 */
export interface WmX6Request {
    receiverwmid: string;
    msgtext: string;
    msgsubj?: string;
    onlyauth?: number;
}

/**
 * Detailed information about a sent WebMoney message.
 */
export interface WmX6MessageDetails {
    id: number;
    receiverwmid: string;
    msgtext: string;
    datecrt?: Date;
}

/**
 * Response from the WebMoney X6 send message API.
 */
export interface WmX6Response {
    reqn: number;
    retval: number;
    retdesc: string;
    message?: WmX6MessageDetails;
}

/**
 * Interface for WebMoney X6 send message operations.
 */
export class WmX6Interface extends WmBaseInterface {
    private static readonly MAX_MESSAGE_LENGTH = 1024;
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'receiverwmid', validator: WmValidator.validateWmid },
        { field: 'msgtext', validator: WmValidator.validateRequired },
    ];

    /**
     * Creates a new instance of the WebMoney X6 send message interface.
     * @param wmid - The WebMoney WMID of the account
     * @param key - The WebMoney XML presentation of private key
     * @param apiUrl - Optional API URL. If not provided, defaults to the WebMoney X6 API URL
     * @param requestTimeout - Optional request timeout in milliseconds. If not provided, uses default timeout
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl || WmConfig.DEFAULT_URLS.X6;
    }

    protected getInterfaceName(): string {
        return 'X6';
    }

    /**
     * Sends a message to another WebMoney user. Long messages are automatically split into multiple parts.
     * @param req - The message request parameters including receiver WMID and message text
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to an array of message responses (one per message part if split)
     * @throws WmNetworkError if the API request fails
     * @throws WmXmlError if the response is invalid
     * @throws WmApiError if the API returns an error
     */
    async sendMessage(req: WmX6Request, reqn?: number): Promise<WmX6Response[]> {
        this.validateRequest(req, WmX6Interface.VALIDATION_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const result: WmX6Response[] = [];
        const msg = req.msgtext.replace(/\r/g, '').trim();
        const messages = WmString.splitByWmLength(msg, WmX6Interface.MAX_MESSAGE_LENGTH);
        let reqNumber = reqn ?? this.generateReqn();

        if (messages.length > 1) {
            const chunkId = Math.floor(Date.now() / 1000);
            for (let mId = 0; mId < messages.length; mId++) {
                const subject = `batch:${chunkId}:${messages.length}:${mId + 1}`;
                const response = await this.callInterface(
                    reqNumber,
                    req.receiverwmid,
                    messages[mId],
                    subject,
                    req.onlyauth
                );
                result.push(response);
                reqNumber++;
            }
        } else {
            const response = await this.callInterface(
                reqNumber,
                req.receiverwmid,
                req.msgtext,
                req.msgsubj
            );
            result.push(response);
        }

        return result;
    }

    private async callInterface(
        reqNumber: number,
        receiver: string,
        message: string,
        subject?: string,
        onlyAuth?: number
    ): Promise<WmX6Response> {
        const msg = WmString.toWmString(message) || '';
        const subj = subject ?? '';

        const plainString = `${receiver}${reqNumber}${msg}${subj}`;
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
                message: {
                    receiverwmid: receiver,
                    msgsubj: { '#cdata': subj },
                    msgtext: { '#cdata': msg },
                    onlyauth: onlyAuth ?? 0,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        const baseResponse = this.parseBaseResponse(responseText);

        const messageDetails = this.parseDetailedResponse(responseText, 'message', (message) => {
            return {
                id: WmXml.parseInt(message['@_id'] || message.id),
                receiverwmid: message.receiverwmid || '',
                msgtext: WmXml.decodeHtmlEntities(message.msgtext || ''),
                datecrt: message.datecrt ? WmConvert.fromWmDate(message.datecrt) : undefined,
            };
        });

        return {
            ...baseResponse,
            message: messageDetails ?? undefined,
        };
    }
}
