import { WmXmlError } from '../errors/WmError';
import { WmLogger } from './WmLogger';

/**
 * Utility class for XML operations in WebMoney API.
 * Provides methods for XML escaping, parsing, and element extraction.
 */
export class WmXml {
    /**
     * Escapes special XML characters in a string value.
     * @param value - The value to escape
     * @returns The escaped XML string
     */
    static escape(value: string | number | boolean): string {
        if (value === null || value === undefined) {
            WmLogger.warn('Attempting to escape null/undefined value in XML', { value });
            return '';
        }

        const str = String(value);
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Extracts the text content of an XML tag.
     * @param xml - The XML string to search
     * @param tag - The tag name to extract
     * @param required - Whether the tag is required (throws if missing)
     * @param interfaceName - Name of the interface (for error reporting)
     * @returns The tag content or null if not found
     * @throws WmXmlError if required tag is missing
     */
    static extractValue(
        xml: string,
        tag: string,
        required: boolean = false,
        interfaceName: string = 'unknown'
    ): string | null {
        const regex = new RegExp(`<${tag}>\\s*([^<]*?)\\s*<\\/${tag}>`, 'i');
        const match = xml.match(regex);

        if (!match && required) {
            throw new WmXmlError(
                `Required XML tag <${tag}> not found`,
                interfaceName,
                xml.substring(0, 500)
            );
        }

        return match ? match[1] : null;
    }

    /**
     * Extracts an attribute value from an XML tag.
     * @param xml - The XML string to search
     * @param tag - The tag name
     * @param attribute - The attribute name
     * @param required - Whether the attribute is required (throws if missing)
     * @param interfaceName - Name of the interface (for error reporting)
     * @returns The attribute value or null if not found
     * @throws WmXmlError if required attribute is missing
     */
    static extractAttribute(
        xml: string,
        tag: string,
        attribute: string,
        required: boolean = false,
        interfaceName: string = 'unknown'
    ): string | null {
        const regex = new RegExp(`<${tag}[^>]*${attribute}="([^"]*)"`, 'i');
        const match = xml.match(regex);

        if (!match && required) {
            throw new WmXmlError(
                `Required attribute ${attribute} in tag <${tag}> not found`,
                interfaceName,
                xml.substring(0, 500)
            );
        }

        return match ? match[1] : null;
    }

    /**
     * Extracts a block of XML between opening and closing tags.
     * @param xml - The XML string to search
     * @param tag - The tag name
     * @param interfaceName - Name of the interface (for error reporting)
     * @returns The XML block content or null if not found
     */
    static extractBlock(
        xml: string,
        tag: string,
        interfaceName: string = 'unknown'
    ): string | null {
        const startRegex = new RegExp(`<${tag}[^>]*>`, 'i');
        const startMatch = xml.match(startRegex);

        if (!startMatch) {
            return null;
        }

        const startIndex = startMatch.index!;
        const endTag = `</${tag}>`;
        const endIndex = xml.indexOf(endTag, startIndex);

        if (endIndex === -1) {
            return null;
        }

        return xml.substring(startIndex, endIndex + endTag.length);
    }

    /**
     * Extracts all blocks matching a tag pattern.
     * @param xml - The XML string to search
     * @param tag - The tag name
     * @returns Array of XML blocks
     */
    static extractAllBlocks(xml: string, tag: string): string[] {
        const blocks: string[] = [];
        const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
        let match;

        while ((match = regex.exec(xml)) !== null) {
            blocks.push(match[0]);
        }

        return blocks;
    }

    /**
     * Cleans XML response by removing BOM and trimming whitespace.
     * @param xml - The XML string to clean
     * @returns The cleaned XML string
     */
    static clean(xml: string): string {
        let cleaned = xml.trim();

        if (cleaned.charCodeAt(0) === 0xfeff) {
            cleaned = cleaned.substring(1);
        }

        return cleaned;
    }

    /**
     * Validates that the response is XML and not HTML.
     * @param xml - The response to validate
     * @param interfaceName - Name of the interface (for error reporting)
     * @throws WmXmlError if the response is HTML or invalid
     */
    static validateResponse(xml: string, interfaceName: string): void {
        const cleaned = this.clean(xml);

        if (
            cleaned.toLowerCase().includes('<html') ||
            cleaned.toLowerCase().includes('<!doctype')
        ) {
            throw new WmXmlError(
                'Received HTML response instead of XML. This might indicate an authentication or server error.',
                interfaceName,
                cleaned.substring(0, 500)
            );
        }

        if (!cleaned.includes('<') || !cleaned.includes('>')) {
            throw new WmXmlError(
                'Response does not appear to be valid XML.',
                interfaceName,
                cleaned.substring(0, 500)
            );
        }
    }

    /**
     * Parses an integer from XML content.
     * @param value - The string value to parse
     * @param defaultValue - Default value if parsing fails
     * @returns The parsed integer or default value
     */
    static parseInt(value: string | null | undefined, defaultValue: number = 0): number {
        if (!value) return defaultValue;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * Parses a float from XML content.
     * @param value - The string value to parse
     * @param defaultValue - Default value if parsing fails
     * @returns The parsed float or default value
     */
    static parseFloat(value: string | null | undefined, defaultValue: number = 0): number {
        if (!value) return defaultValue;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * Decodes HTML numeric character references (entities) in a string.
     * Handles both decimal (&#1087;) and hexadecimal (&#x442;) formats.
     * @param text - The text containing HTML entities
     * @returns The decoded text with HTML entities converted to actual characters
     */
    static decodeHtmlEntities(text: string | null | undefined): string {
        if (!text) return '';

        return (
            text
                // Decode decimal numeric character references (&#XXXX;)
                .replace(/&#(\d+);/g, (match, dec) => {
                    try {
                        return String.fromCharCode(parseInt(dec, 10));
                    } catch {
                        return match;
                    }
                })
                // Decode hexadecimal numeric character references (&#xXXXX; or &#XXXXX;)
                .replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
                    try {
                        return String.fromCharCode(parseInt(hex, 16));
                    } catch {
                        return match;
                    }
                })
        );
    }
}
