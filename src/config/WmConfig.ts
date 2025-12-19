/**
 * Configuration constants for WebMoney API operations.
 */
export class WmConfig {
    /**
     * Default API endpoint URLs for WebMoney XML interfaces.
     */
    static readonly DEFAULT_URLS = {
        X1: 'https://w10s.web.money/asp/XMLInvoice.asp',
        X2: 'https://w10s.web.money/asp/XMLTrans.asp',
        X3: 'https://w10s.web.money/asp/XMLOperations.asp',
        X4: 'https://w10s.web.money/asp/XMLOutInvoices.asp',
        X5: 'https://w10s.web.money/asp/XMLFinishProtect.asp',
        X6: 'https://w10s.web.money/asp/XMLSendMsg.asp',
        X8: 'https://w10s.web.money/asp/XMLFindWMPurseNew.asp',
        X9: 'https://w10s.web.money/asp/XMLPurses.asp',
        X10: 'https://w10s.web.money/asp/XMLInInvoices.asp',
        X11: 'https://apipassport.web.money/asp/XMLGetWMPassport.asp',
        X13: 'https://w10s.web.money/asp/XMLRejectProtect.asp',
        X14: 'https://w10s.web.money/asp/XMLTransMoneyback.asp',
        X15: 'https://w10s.web.money/asp/XMLTrustList.asp',
        X15_LIST2: 'https://w10s.web.money/asp/XMLTrustList2.asp',
        X15_SAVE: 'https://w10s.web.money/asp/XMLTrustSave2.asp',
        X16: 'https://w10s.web.money/asp/XMLCreatePurse.asp',
        X18: 'https://merchant.web.money/conf/xml/XMLTransGet.asp',
        X19: 'https://apipassport.web.money/XMLCheckUser.aspx',
        X21_REQUEST: 'https://merchant.web.money/conf/xml/XMLTrustRequest.asp',
        X21_CONFIRM: 'https://merchant.web.money/conf/xml/XMLTrustConfirm.asp',
        X22: 'https://merchant.web.money/conf/xml/XMLTransSave.asp',
        X23: 'https://w10s.web.money/asp/XMLInvoice.asp',
    } as const;

    /**
     * Character encoding used by WebMoney API.
     */
    static readonly ENCODING = 'windows-1251';

    /**
     * Default request timeout in milliseconds.
     */
    static readonly REQUEST_TIMEOUT = 5000;
}
