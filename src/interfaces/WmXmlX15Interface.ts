import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmConvert } from '../utils/WmConvert';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for retrieving trust list (XMLTrustList.asp).
 */
export interface WmX15GetTrustListRequest {
    wmid: string;
}

/**
 * Trust entry details from trust list response.
 */
export interface WmX15TrustEntry {
    id: string;
    inv: number;
    trans: number;
    purse: number;
    transhist: number;
    master: string;
    purseValue?: string;
    daylimit?: number;
    dlimit?: number;
    wlimit?: number;
    mlimit?: number;
    dsum?: number;
    wsum?: number;
    msum?: number;
    lastsumdate?: Date;
}

/**
 * Response from getTrustList and getTrustList2 methods.
 */
export interface WmX15GetTrustListResponse {
    reqn: number;
    retval: number;
    retdesc: string;
    trustlist?: WmX15TrustEntry[];
    trustlistCount?: number;
}

/**
 * Request parameters for saving trust settings (XMLTrustSave2).
 */
export interface WmX15SaveTrustRequest {
    masterwmid: string;
    slavewmid: string;
    purse: string;
    inv: number;
    trans: number;
    purseFlag: number;
    transhist: number;
    limit: number;
    daylimit: number;
    weeklimit: number;
    monthlimit: number;
}

/**
 * Trust details from save trust response.
 */
export interface WmX15TrustDetails {
    id: string;
    inv: number;
    trans: number;
    purse: number;
    transhist: number;
    msghist?: number;
    msg?: number;
    purseValue?: string;
    master?: string;
}

/**
 * Response from saveTrust method.
 */
export interface WmX15SaveTrustResponse {
    reqn: number;
    retval: number;
    retdesc: string;
    trust?: WmX15TrustDetails;
}

/**
 * Interface for WebMoney X15 trust management operations.
 * Provides methods to retrieve and manage trust relationships between WebMoney identifiers and purses.
 * Supports operations for querying trust lists and saving trust settings.
 */
export class WmX15Interface extends WmBaseInterface {
    private readonly trustListApiUrl: string;
    private readonly trustList2ApiUrl: string;
    private readonly trustSaveApiUrl: string;

    private static readonly GET_TRUST_LIST_RULES: ValidationRule[] = [
        { field: 'wmid', validator: WmValidator.validateWmid },
    ];

    private static readonly SAVE_TRUST_RULES: ValidationRule[] = [
        { field: 'masterwmid', validator: WmValidator.validateWmid },
        { field: 'slavewmid', validator: WmValidator.validateWmid },
        { field: 'purse', validator: WmValidator.validatePurse },
    ];

    /**
     * Creates a new WmX15Interface instance.
     * @param wmid - The WebMoney ID (WMID) of the user
     * @param key - The private key used for signing requests
     * @param trustListApiUrl - Optional API endpoint URL for getTrustList.
     * @param trustList2ApiUrl - Optional API endpoint URL for getTrustList2.
     * @param trustSaveApiUrl - Optional API endpoint URL for saveTrust.
     * @param requestTimeout - Optional request timeout in milliseconds.
     */
    constructor(
        wmid: string,
        key: string,
        trustListApiUrl?: string,
        trustList2ApiUrl?: string,
        trustSaveApiUrl?: string,
        requestTimeout?: number
    ) {
        super(wmid, key, requestTimeout);
        this.trustListApiUrl = trustListApiUrl || WmConfig.DEFAULT_URLS.X15;
        this.trustList2ApiUrl = trustList2ApiUrl || WmConfig.DEFAULT_URLS.X15_LIST2;
        this.trustSaveApiUrl = trustSaveApiUrl || WmConfig.DEFAULT_URLS.X15_SAVE;
    }

    protected getInterfaceName(): string {
        return 'X15';
    }

    /**
     * Retrieves list of purses which the identifier making the request trusts.
     * @param req - The request parameters including wmid
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the trust list response
     * @throws Error if the API request fails or returns an invalid response
     */
    async getTrustList(
        req: WmX15GetTrustListRequest,
        reqn?: number
    ): Promise<WmX15GetTrustListResponse> {
        this.validateRequest(req, WmX15Interface.GET_TRUST_LIST_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();
        return await this.callGetTrustList(this.trustListApiUrl, reqNumber, req);
    }

    /**
     * Retrieves list of identifiers and their purses that trust the identifier making the request.
     * Note: wmid (signing the request) and gettrustlist\wmid must NOT match.
     * @param req - The request parameters including wmid
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the trust list response
     * @throws Error if the API request fails or returns an invalid response
     */
    async getTrustList2(
        req: WmX15GetTrustListRequest,
        reqn?: number
    ): Promise<WmX15GetTrustListResponse> {
        this.validateRequest(req, WmX15Interface.GET_TRUST_LIST_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();
        if (req.wmid === this.wmid) {
            throw new Error('For getTrustList2, the request wmid must NOT match the signing wmid');
        }
        return await this.callGetTrustList(this.trustList2ApiUrl, reqNumber, req);
    }

    /**
     * Creates or edits trust settings for a certain purse or identifier.
     * @param req - The request parameters including masterwmid and optional trust settings
     * @param reqn - Optional request number. If not provided, uses current Unix timestamp
     * @returns A promise that resolves to the save trust response
     * @throws Error if the API request fails or returns an invalid response
     */
    async saveTrust(req: WmX15SaveTrustRequest, reqn?: number): Promise<WmX15SaveTrustResponse> {
        this.validateRequest(req, WmX15Interface.SAVE_TRUST_RULES);
        if (reqn) {
            WmValidator.validateReqn(reqn, this.getInterfaceName());
        }

        const reqNumber = reqn ?? this.generateReqn();
        return await this.callSaveTrust(reqNumber, req);
    }

    /**
     * Makes an HTTP request to retrieve trust list from the specified API endpoint.
     * Handles request signing, XML request creation, response parsing, and error handling.
     * @param apiUrl - The API endpoint URL to send the request to
     * @param reqNumber - The request number for tracking and signing purposes
     * @param req - The request parameters containing the WMID to query
     * @returns A promise that resolves to the parsed trust list response
     * @throws Error if network request fails, response is invalid, or API returns an error
     */
    private async callGetTrustList(
        apiUrl: string,
        reqNumber: number,
        req: WmX15GetTrustListRequest
    ): Promise<WmX15GetTrustListResponse> {
        const plainString = `${req.wmid}${reqNumber}`;
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
                gettrustlist: {
                    wmid: req.wmid,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, apiUrl);

        return this.parseGetTrustListXmlResponse(responseText);
    }

    /**
     * Makes an HTTP request to save trust settings to the WebMoney API.
     * Handles request signing, XML request creation, response parsing, and error handling.
     * @param reqNumber - The request number for tracking and signing purposes
     * @param req - The request parameters containing trust settings to save
     * @returns A promise that resolves to the parsed save trust response
     * @throws Error if network request fails, response is invalid, or API returns an error
     */
    private async callSaveTrust(
        reqNumber: number,
        req: WmX15SaveTrustRequest
    ): Promise<WmX15SaveTrustResponse> {
        const plainString = `${this.wmid}${req.purse}${req.masterwmid}${reqNumber}`;
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
                trust: {
                    '@_inv': req.inv,
                    '@_trans': req.trans,
                    '@_purse': req.purseFlag,
                    '@_transhist': req.transhist,
                    masterwmid: req.masterwmid,
                    slavewmid: req.slavewmid,
                    purse: req.purse,
                    limit: req.limit,
                    daylimit: req.daylimit,
                    weeklimit: req.weeklimit,
                    monthlimit: req.monthlimit,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.trustSaveApiUrl);

        return this.parseSaveTrustXmlResponse(responseText);
    }

    /**
     * Parses the XML response from the getTrustList or getTrustList2 API call.
     * Extracts request metadata, return values, and trust list entries with their details.
     * Validates the response format and handles various error conditions.
     * @param xmlText - The raw XML response text from the API
     * @returns A parsed response object containing request metadata and trust list data
     * @throws Error if the response format is invalid, contains HTML instead of XML, or is missing required elements
     */
    private parseGetTrustListXmlResponse(xmlText: string): WmX15GetTrustListResponse {
        const baseResponse = this.parseBaseResponse(xmlText);

        const trustlistData = this.parseDetailedResponse(xmlText, 'trustlist', (trustListBlock) => {
            const trustlist: WmX15TrustEntry[] = [];
            const trustlistCount = WmXml.parseInt(trustListBlock['@_cnt']);

            this.parseArrayElements(trustListBlock, 'trust', (trust) => ({
                id: trust['@_id'] ?? '',
                inv: trust['@_inv'] ? WmXml.parseInt(trust['@_inv']) : 0,
                trans: trust['@_trans'] ? WmXml.parseInt(trust['@_trans']) : 0,
                purse: trust['@_purse'] ? WmXml.parseInt(trust['@_purse']) : 0,
                transhist: trust['@_transhist'] ? WmXml.parseInt(trust['@_transhist']) : 0,
                master: trust.master ?? '',
                purseValue: trust.purse ?? undefined,
                daylimit: trust.daylimit ? WmXml.parseFloat(trust.daylimit) : undefined,
                dlimit: trust.dlimit ? WmXml.parseFloat(trust.dlimit) : undefined,
                wlimit: trust.wlimit ? WmXml.parseFloat(trust.wlimit) : undefined,
                mlimit: trust.mlimit ? WmXml.parseFloat(trust.mlimit) : undefined,
                dsum: trust.dsum ? WmXml.parseFloat(trust.dsum) : undefined,
                wsum: trust.wsum ? WmXml.parseFloat(trust.wsum) : undefined,
                msum: trust.msum ? WmXml.parseFloat(trust.msum) : undefined,
                lastsumdate: trust.lastsumdate
                    ? WmConvert.fromWmDate(trust.lastsumdate)
                    : undefined,
            })).forEach((trustEntry) => trustlist.push(trustEntry));

            return { trustlist, trustlistCount };
        });

        return {
            ...baseResponse,
            trustlist: trustlistData?.trustlist,
            trustlistCount: trustlistData?.trustlistCount,
        };
    }

    private parseSaveTrustXmlResponse(xmlText: string): WmX15SaveTrustResponse {
        const baseResponse = this.parseBaseResponse(xmlText);

        const responseTrust = this.parseDetailedResponse(xmlText, 'trust', (trust) => {
            return {
                id: trust['@_id'] ?? '',
                inv: trust['@_inv'] ? WmXml.parseInt(trust['@_inv']) : 0,
                trans: trust['@_trans'] ? WmXml.parseInt(trust['@_trans']) : 0,
                purse: trust['@_purse'] ? WmXml.parseInt(trust['@_purse']) : 0,
                transhist: trust['@_transhist'] ? WmXml.parseInt(trust['@_transhist']) : 0,
                msghist: trust['@_msghist'] ? WmXml.parseInt(trust['@_msghist']) : undefined,
                msg: trust['@_msg'] ? WmXml.parseInt(trust['@_msg']) : undefined,
                purseValue: trust.purse ?? undefined,
                master: trust.master ?? undefined,
            };
        });

        return {
            ...baseResponse,
            trust: responseTrust ?? undefined,
        };
    }
}
