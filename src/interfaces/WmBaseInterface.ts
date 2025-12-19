import * as iconv from 'iconv-lite';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { WmSigner } from '../signer/WmSigner';
import { WmLogger } from '../utils/WmLogger';
import { WmXml } from '../utils/WmXml';
import { WmConfig } from '../config/WmConfig';
import { WmNetworkError, WmXmlError, WmApiError } from '../errors/WmError';

/**
 * Base response structure for WebMoney XML API responses.
 */
export interface WmBaseResponse {
    reqn: number;
    retval: number;
    retdesc: string;
}

/**
 * Rule for validating a single request field.
 * Combines a field name with a validator function that checks its value.
 */
export interface ValidationRule {
    field: string;
    validator: (value: any, interfaceName: string) => void;
}

/**
 * Abstract base class for WebMoney XML API interfaces.
 * Provides common functionality for all interfaces including
 * - Request signing
 * - HTTP communication
 * - Windows-1251 encoding/decoding
 * - XML parsing
 * - Error handling
 * - Logging
 */
export abstract class WmBaseInterface {
    protected readonly wmid: string;
    protected readonly signer: WmSigner;
    protected readonly requestTimeout: number;

    /**
     * Creates a new WmBaseInterface instance.
     * @param wmid - The WebMoney ID (WMID)
     * @param key - The private key used for signing requests
     * @param requestTimeout - Optional request timeout in milliseconds (default is 5000)
     */
    constructor(wmid: string, key: string, requestTimeout?: number) {
        this.wmid = wmid;
        this.signer = new WmSigner(key);
        this.requestTimeout = requestTimeout || WmConfig.REQUEST_TIMEOUT;
    }

    /**
     * Returns the interface name (e.g., 'X1', 'X2', etc.).
     * Used for logging and error reporting.
     */
    protected abstract getInterfaceName(): string;

    protected getEncoding(): string {
        return WmConfig.ENCODING;
    }

    /**
     * Makes an HTTP request to the WebMoney API.
     * Handles Windows-1251 encoding, network errors, and response validation.
     * @param xmlRequest - The XML request string
     * @param url - Api URL.
     * @returns The XML response text
     * @throws WmNetworkError if the HTTP request fails
     * @throws WmXmlError if the response is invalid XML
     */
    protected async callApi(xmlRequest: string, url: string): Promise<string> {
        const interfaceName = this.getInterfaceName();

        WmLogger.debug(`Sending XML request to ${interfaceName} API (${url})`, {
            url: url,
            requestLength: xmlRequest.length,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        try {
            const xmlBuffer = iconv.encode(xmlRequest, this.getEncoding());

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': `application/xml; charset=${this.getEncoding()}`,
                },
                body: new Uint8Array(xmlBuffer),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            WmLogger.debug(`Received response from ${interfaceName} API (${url})`, {
                status: response.status,
                statusText: response.statusText,
            });

            if (!response.ok) {
                const errorText = await response
                    .text()
                    .catch(() => 'Unable to read error response');
                WmLogger.error(`HTTP error from ${interfaceName} API (${url})`, {
                    status: response.status,
                    errorText: errorText.substring(0, 500),
                });
                throw new WmNetworkError(
                    `HTTP error! status: ${response.status}, response: ${errorText}`,
                    interfaceName
                );
            }

            const responseBuffer = await response.arrayBuffer();
            const responseBytes = new Uint8Array(responseBuffer);
            const decoder = new TextDecoder(this.getEncoding());
            const responseText = decoder.decode(responseBytes);

            if (!responseText || responseText.trim().length === 0) {
                throw new WmNetworkError(
                    'Empty response received from WebMoney API',
                    interfaceName
                );
            }

            WmXml.validateResponse(responseText, interfaceName);

            WmLogger.debug(`Parsed response from ${interfaceName} API (${url})`, {
                responseLength: responseText.length,
            });

            return responseText;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof WmNetworkError || error instanceof WmXmlError) {
                throw error;
            }

            if (error instanceof Error && error.name === 'AbortError') {
                WmLogger.error(`Request timeout for ${interfaceName} API (${url})`);
                throw new WmNetworkError(
                    `Request timeout: WebMoney API did not respond within ${this.requestTimeout}ms`,
                    interfaceName,
                    error
                );
            }

            if (error instanceof Error) {
                if (
                    error.message.includes('Failed to fetch') ||
                    error.message.includes('NetworkError')
                ) {
                    WmLogger.error(
                        `Network error for ${interfaceName} API (${url}): ${error.message}`
                    );
                    throw new WmNetworkError(
                        `Network error: Unable to connect to WebMoney API. ${error.message}`,
                        interfaceName,
                        error
                    );
                } else if (error.message.includes('timeout')) {
                    WmLogger.error(
                        `Timeout error for ${interfaceName} API (${url}): ${error.message}`
                    );
                    throw new WmNetworkError(
                        `Request timeout: WebMoney API did not respond in time. ${error.message}`,
                        interfaceName,
                        error
                    );
                }
            }

            WmLogger.error(`Unexpected error in ${interfaceName} API call (${url})`);
            throw new WmNetworkError(
                `Failed to call ${interfaceName} interface: ${error instanceof Error ? error.message : 'Unknown error'}`,
                interfaceName,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Parses the base response fields (reqn, retval, retdesc) from XML.
     * @param xmlText - The XML response text
     * @returns The parsed base response
     * @throws WmXmlError if required fields are missing
     * @throws WmApiError if retval !== 0 (API returned an error)
     */
    protected parseBaseResponse(xmlText: string): WmBaseResponse {
        const interfaceName = this.getInterfaceName();
        const cleanXml = WmXml.clean(xmlText);

        const reqnStr = WmXml.extractValue(cleanXml, 'reqn', false, interfaceName);
        const retvalStr = WmXml.extractValue(cleanXml, 'retval', true, interfaceName);
        const retdesc = WmXml.extractValue(cleanXml, 'retdesc', false, interfaceName);

        const reqn = reqnStr ? WmXml.parseInt(reqnStr) : 0;
        const retval = WmXml.parseInt(retvalStr);

        WmLogger.debug(`Parsed base response from ${interfaceName}`, {
            reqn,
            retval,
            retdesc,
        });

        if (retval !== 0) {
            const errorMessage = `WebMoney API returned error code ${retval} with message: ${retdesc}`;
            WmLogger.error(`API error from ${interfaceName}`, {
                retval,
                retdesc,
            });
            throw new WmApiError(errorMessage, retval, retdesc || '', interfaceName);
        }

        return {
            reqn,
            retval,
            retdesc: retdesc || '',
        };
    }

    /**
     * Signs a data string using the WmSigner.
     * @param data - The data string to sign
     * @returns The signature string
     */
    protected sign(data: string): string {
        return this.signer.sign(data, this.getEncoding());
    }

    /**
     * Generates a default request number.
     * @returns The request number
     */
    protected generateReqn(): number {
        return Date.now();
    }

    /**
     * Creates a configured XMLBuilder instance with standard settings.
     * @returns Configured XMLBuilder for building XML from objects
     */
    protected createXmlBuilder(): XMLBuilder {
        return new XMLBuilder({
            attributeNamePrefix: '@_',
            cdataPropName: '#cdata',
            format: false,
            ignoreAttributes: false,
            processEntities: true,
        });
    }

    /**
     * Creates a configured XMLParser instance with standard settings.
     * @returns Configured XMLParser for parsing XML to objects
     */
    protected createXmlParser(): XMLParser {
        return new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseTagValue: false,
            parseAttributeValue: false,
        });
    }

    /**
     * Builds XML from a data object using the configured builder.
     * @param data - Object to convert to XML
     * @returns XML string representation of the data
     */
    protected buildXml<T>(data: T): string {
        const builder = this.createXmlBuilder();
        return builder.build(data) as string;
    }

    /**
     * Parses array elements with automatic single-item conversion.
     * Handles cases where XML parser returns a single object instead of an array.
     * @param parent - Parent object containing the array/element
     * @param elementKey - Key of the element(s) in parent
     * @param factory - Function to transform each element
     * @returns Array of transformed elements
     */
    protected parseArrayElements<T>(
        parent: any,
        elementKey: string,
        factory: (element: any) => T
    ): T[] {
        let elements = parent[elementKey];
        if (!Array.isArray(elements)) {
            elements = elements ? [elements] : [];
        }
        return elements.map(factory);
    }

    /**
     * Parses detailed response with custom factory function.
     * Handles XML parsing errors gracefully, returning null on failure.
     * @param responseText - Full API response XML text
     * @param elementKey - XML element key to extract (e.g., 'invoice', 'trust')
     * @param factory - Function to transform extracted data into desired type
     * @returns Transformed data or null if parsing fails
     */
    protected parseDetailedResponse<D>(
        responseText: string,
        elementKey: string,
        factory: (data: any) => D
    ): D | null {
        try {
            const parser = this.createXmlParser();
            const parsed = parser.parse(responseText);

            if (parsed?.['w3s.response']?.[elementKey]) {
                return factory(parsed['w3s.response'][elementKey]);
            }
        } catch (error) {
            WmLogger.warn(
                `Failed to parse ${elementKey} details from interface ${this.getInterfaceName()}`,
                error
            );
        }

        return null;
    }

    /**
     * Validates request using declarative rules.
     * Iterates through validation rules and calls each validator for defined fields.
     * @param req - Request object to validate
     * @param rules - Array of validation rules to apply
     * @throws Validation errors thrown by individual validators
     */
    protected validateRequest(req: any, rules: ValidationRule[]): void {
        const interfaceName = this.getInterfaceName();
        for (const rule of rules) {
            if (req[rule.field] !== undefined) {
                rule.validator(req[rule.field], interfaceName);
            }
        }
    }
}
