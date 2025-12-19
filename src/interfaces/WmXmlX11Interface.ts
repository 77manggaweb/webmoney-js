import { WmBaseInterface, ValidationRule } from './WmBaseInterface';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmValidator } from '../validation/WmValidator';

/**
 * Request parameters for retrieving WebMoney passport information (X11 interface).
 */
export interface WmX11Request {
    passportwmid: string;
    dict?: number;
    info?: number;
    mode?: number;
}

/**
 * Attestation information row from passport data.
 */
export interface WmX11AttestatRow {
    cid: string;
    regcid: string;
    tid: string;
    locked: string;
    admlocked: string;
    recalled: string;
    datecrt: string;
    dateupd: string;
    datediff: string;
    regnickname: string;
    regwmid: string;
    status: string;
    notary: string;
    datecrt110: string;
}

/**
 * WMID information row from passport data.
 */
export interface WmX11WmidsRow {
    wmid: string;
    info: string;
    nickname: string;
    datereg: string;
    yearreg: string;
    monthreg: string;
    dayreg: string;
    timereg: string;
    ctype: string;
    companyname: string;
    companyid: string;
    jcountryreg: string;
    jcountryregid: string;
    phone: string;
    email: string;
    phone_check_lock: string;
    email_check_lock: string;
}

/**
 * User information value row from passport data.
 */
export interface WmX11UserInfoValueRow {
    nickname: string;
    infoopen: string;
    city: string;
    region: string;
    citid: string;
    countryid: string;
    country: string;
    zipcode: string;
    adres: string;
    fname: string;
    iname: string;
    oname: string;
    pnomer: string;
    pdate: string;
    pday: string;
    pmonth: string;
    pyear: string;
    pcountryid: string;
    pcountry: string;
    pbywhom: string;
    bplace: string;
    bday: string;
    bmonth: string;
    byear: string;
    phone: string;
    email: string;
    web: string;
    cap_owner: string;
    pasdoc: string;
    inndoc: string;
    sex: string;
}

/**
 * User information check-lock row from passport data.
 */
export interface WmX11UserInfoCheckLockRow {
    nickname: string;
    infoopen: string;
    city: string;
    region: string;
    country: string;
    adres: string;
    zipcode: string;
    fname: string;
    iname: string;
    oname: string;
    pnomer: string;
    pdate: string;
    pbywhom: string;
    pcountry: string;
    pcity: string;
    bplace: string;
    bday: string;
    inn: string;
    email: string;
    web: string;
    phone: string;
    sex: string;
}

/**
 * Weblist row from passport data containing verified websites.
 */
export interface WmX11WeblistRow {
    url: string;
    check_lock: string;
    ischeck: string;
    islock: string;
}

/**
 * Extended data row from passport data containing additional account information.
 */
export interface WmX11ExtendedDataRow {
    type: string;
    account: string;
    check_lock: string;
}

/**
 * Complete user information from passport data.
 */
export interface WmX11UserInfo {
    value: WmX11UserInfoValueRow[];
    check_lock: WmX11UserInfoCheckLockRow[];
    weblist: WmX11WeblistRow[];
    extendeddata: WmX11ExtendedDataRow[];
}

/**
 * Certificate information from WebMoney passport.
 */
export interface WmX11CertInfo {
    wmid: string;
    attestat: WmX11AttestatRow[];
    wmids: WmX11WmidsRow[];
    userinfo: WmX11UserInfo;
}

/**
 * Response from the WebMoney X11 passport API.
 */
export interface WmX11Response {
    retval: number;
    fullaccess: string;
    certinfo?: WmX11CertInfo;
}

/**
 * Interface for WebMoney X11 retrieving information from client's passport by WM-identifier.
 */
export class WmX11Interface extends WmBaseInterface {
    private readonly apiUrl: string;

    private static readonly VALIDATION_RULES: ValidationRule[] = [
        { field: 'passportwmid', validator: WmValidator.validateWmid },
    ];

    /**
     * Creates a new instance of the WmX11Interface for retrieving WebMoney passport information.
     *
     * @param wmid - The WebMoney identifier (WMID) of the requester making the API call
     * @param key - The private key used for signing requests and authenticating with the WebMoney API
     * @param apiUrl - Optional custom API endpoint URL. If not provided, uses the default X11 interface URL from WmConfig
     * @param requestTimeout - Optional timeout in milliseconds for API requests. If not provided, uses the default timeout
     */
    constructor(wmid: string, key: string, apiUrl?: string, requestTimeout?: number) {
        super(wmid, key, requestTimeout);
        this.apiUrl = apiUrl || WmConfig.DEFAULT_URLS.X11;
    }

    protected getInterfaceName(): string {
        return 'X11';
    }

    /**
     * Retrieves detailed passport information for a WebMoney ID.
     * @param req - The request parameters including passport WMID and optional display options
     * @returns A promise that resolves to the passport response containing certificate and user information
     * @throws WmNetworkError if the API request fails
     * @throws WmXmlError if the response is invalid
     * @throws WmApiError if the API returns an error
     */
    async getPassportInfo(req: WmX11Request): Promise<WmX11Response> {
        this.validateRequest(req, WmX11Interface.VALIDATION_RULES);

        const passportwmid = req.passportwmid;
        const dict = req.dict?.toString() ?? '0';
        const info = req.info?.toString() ?? '1';
        const mode = req.mode?.toString() ?? '0';

        const plainString = `${this.wmid}${passportwmid}`;
        const sign = this.sign(plainString);

        const requestObject = {
            '?xml': {
                '@_version': '1.0',
                '@_encoding': this.getEncoding(),
            },
            request: {
                wmid: this.wmid,
                passportwmid: passportwmid,
                sign: sign,
                params: {
                    dict: dict,
                    info: info,
                    mode: mode,
                },
            },
        };

        const xmlRequest = this.buildXml(requestObject);

        const responseText = await this.callApi(xmlRequest, this.apiUrl);

        let retval = 0;
        let fullaccess = '';
        let certinfo: WmX11CertInfo | undefined;

        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(responseText);

            if (parsed && parsed.response) {
                const response = parsed.response;
                retval = response['@_retval'] ? WmXml.parseInt(response['@_retval']) : 0;
                fullaccess = response.fullaccess ?? '';

                if (response.certinfo) {
                    certinfo = this.parseCertInfo(response.certinfo);
                }
            }
        } catch (error) {
            console.warn('Failed to parse passport response with fast-xml-parser:', error);
        }

        return { retval, fullaccess, certinfo };
    }

    private parseCertInfo(certinfoBlock: any): WmX11CertInfo {
        const wmid = certinfoBlock['@_wmid'] ?? '';

        const attestat: WmX11AttestatRow[] = [];
        const wmids: WmX11WmidsRow[] = [];
        const value: WmX11UserInfoValueRow[] = [];
        const check_lock: WmX11UserInfoCheckLockRow[] = [];
        const weblist: WmX11WeblistRow[] = [];
        const extendeddata: WmX11ExtendedDataRow[] = [];

        if (certinfoBlock.attestat) {
            this.parseArrayElements(certinfoBlock.attestat, 'row', (row) => ({
                cid: row['@_cid'] ?? '',
                regcid: row['@_regcid'] ?? '',
                tid: row['@_tid'] ?? '',
                locked: row['@_locked'] ?? '',
                admlocked: row['@_admlocked'] ?? '',
                recalled: row['@_recalled'] ?? '',
                datecrt: row['@_datecrt'] ?? '',
                dateupd: row['@_dateupd'] ?? '',
                datediff: row['@_datediff'] ?? '',
                regnickname: row['@_regnickname'] ?? '',
                regwmid: row['@_regwmid'] ?? '',
                status: row['@_status'] ?? '',
                notary: row['@_notary'] ?? '',
                datecrt110: row['@_datecrt110'] ?? '',
            })).forEach((row) => attestat.push(row));
        }

        if (certinfoBlock.wmids) {
            this.parseArrayElements(certinfoBlock.wmids, 'row', (row) => ({
                wmid: row['@_wmid'] ?? '',
                info: WmXml.decodeHtmlEntities(row['@_info'] ?? ''),
                nickname: WmXml.decodeHtmlEntities(row['@_nickname'] ?? ''),
                datereg: row['@_datereg'] ?? '',
                yearreg: row['@_yearreg'] ?? '',
                monthreg: row['@_monthreg'] ?? '',
                dayreg: row['@_dayreg'] ?? '',
                timereg: row['@_timereg'] ?? '',
                ctype: row['@_ctype'] ?? '',
                companyname: WmXml.decodeHtmlEntities(row['@_companyname'] ?? ''),
                companyid: row['@_companyid'] ?? '',
                jcountryreg: row['@_jcountryreg'] ?? '',
                jcountryregid: row['@_jcountryregid'] ?? '',
                phone: row['@_phone'] ?? '',
                email: WmXml.decodeHtmlEntities(row['@_email'] ?? ''),
                phone_check_lock: row['@_phone-check-lock'] ?? '',
                email_check_lock: row['@_email-check-lock'] ?? '',
            })).forEach((row) => wmids.push(row));
        }

        if (certinfoBlock.userinfo) {
            const userinfo = certinfoBlock.userinfo;

            if (userinfo.value) {
                this.parseArrayElements(userinfo.value, 'row', (row) => ({
                    nickname: WmXml.decodeHtmlEntities(row['@_nickname'] ?? ''),
                    infoopen: row['@_infoopen'] ?? '',
                    city: WmXml.decodeHtmlEntities(row['@_city'] ?? ''),
                    region: WmXml.decodeHtmlEntities(row['@_region'] ?? ''),
                    citid: row['@_citid'] ?? '',
                    countryid: row['@_countryid'] ?? '',
                    country: WmXml.decodeHtmlEntities(row['@_country'] ?? ''),
                    zipcode: row['@_zipcode'] ?? '',
                    adres: WmXml.decodeHtmlEntities(row['@_adres'] ?? ''),
                    fname: WmXml.decodeHtmlEntities(row['@_fname'] ?? ''),
                    iname: WmXml.decodeHtmlEntities(row['@_iname'] ?? ''),
                    oname: WmXml.decodeHtmlEntities(row['@_oname'] ?? ''),
                    pnomer: row['@_pnomer'] ?? '',
                    pdate: row['@_pdate'] ?? '',
                    pday: row['@_pday'] ?? '',
                    pmonth: row['@_pmonth'] ?? '',
                    pyear: row['@_pyear'] ?? '',
                    pcountryid: row['@_pcountryid'] ?? '',
                    pcountry: WmXml.decodeHtmlEntities(row['@_pcountry'] ?? ''),
                    pbywhom: WmXml.decodeHtmlEntities(row['@_pbywhom'] ?? ''),
                    bplace: WmXml.decodeHtmlEntities(row['@_bplace'] ?? ''),
                    bday: row['@_bday'] ?? '',
                    bmonth: row['@_bmonth'] ?? '',
                    byear: row['@_byear'] ?? '',
                    phone: row['@_phone'] ?? '',
                    email: WmXml.decodeHtmlEntities(row['@_email'] ?? ''),
                    web: row['@_web'] ?? '',
                    cap_owner: WmXml.decodeHtmlEntities(row['@_cap_owner'] ?? ''),
                    pasdoc: row['@_pasdoc'] ?? '',
                    inndoc: row['@_inndoc'] ?? '',
                    sex: row['@_sex'] ?? '',
                })).forEach((row) => value.push(row));
            }

            if (userinfo.check_lock) {
                this.parseArrayElements(userinfo.check_lock, 'row', (row) => ({
                    nickname: WmXml.decodeHtmlEntities(row['@_nickname'] ?? ''),
                    infoopen: row['@_infoopen'] ?? '',
                    city: WmXml.decodeHtmlEntities(row['@_city'] ?? ''),
                    region: WmXml.decodeHtmlEntities(row['@_region'] ?? ''),
                    country: WmXml.decodeHtmlEntities(row['@_country'] ?? ''),
                    adres: WmXml.decodeHtmlEntities(row['@_adres'] ?? ''),
                    zipcode: row['@_zipcode'] ?? '',
                    fname: WmXml.decodeHtmlEntities(row['@_fname'] ?? ''),
                    iname: WmXml.decodeHtmlEntities(row['@_iname'] ?? ''),
                    oname: WmXml.decodeHtmlEntities(row['@_oname'] ?? ''),
                    pnomer: row['@_pnomer'] ?? '',
                    pdate: row['@_pdate'] ?? '',
                    pbywhom: WmXml.decodeHtmlEntities(row['@_pbywhom'] ?? ''),
                    pcountry: WmXml.decodeHtmlEntities(row['@_pcountry'] ?? ''),
                    pcity: WmXml.decodeHtmlEntities(row['@_pcity'] ?? ''),
                    bplace: WmXml.decodeHtmlEntities(row['@_bplace'] ?? ''),
                    bday: row['@_bday'] ?? '',
                    inn: row['@_inn'] ?? '',
                    email: WmXml.decodeHtmlEntities(row['@_email'] ?? ''),
                    web: row['@_web'] ?? '',
                    phone: row['@_phone'] ?? '',
                    sex: row['@_sex'] ?? '',
                })).forEach((row) => check_lock.push(row));
            }

            if (userinfo.weblist) {
                this.parseArrayElements(userinfo.weblist, 'row', (row) => ({
                    url: row['@_url'] ?? '',
                    check_lock: row['@_check_lock'] ?? '',
                    ischeck: row['@_ischeck'] ?? '',
                    islock: row['@_islock'] ?? '',
                })).forEach((row) => weblist.push(row));
            }

            if (userinfo.extendeddata) {
                this.parseArrayElements(userinfo.extendeddata, 'row', (row) => ({
                    type: row['@_type'] ?? '',
                    account: row['@_account'] ?? '',
                    check_lock: row['@_check_lock'] ?? '',
                })).forEach((row) => extendeddata.push(row));
            }
        }

        return {
            wmid,
            attestat,
            wmids,
            userinfo: { value, check_lock, weblist, extendeddata },
        };
    }
}
