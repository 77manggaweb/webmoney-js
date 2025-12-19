import { WmXml } from '../../src/utils/WmXml';
import { WmXmlError } from '../../src/errors/WmError';
import { WmLogger } from '../../src/utils/WmLogger';

describe('WmXml', () => {
    describe('escape', () => {
        it('should escape ampersand', () => {
            expect(WmXml.escape('Tom & Jerry')).toBe('Tom &amp; Jerry');
        });

        it('should escape less than sign', () => {
            expect(WmXml.escape('1 < 2')).toBe('1 &lt; 2');
        });

        it('should escape greater than sign', () => {
            expect(WmXml.escape('2 > 1')).toBe('2 &gt; 1');
        });

        it('should escape double quote', () => {
            expect(WmXml.escape('Say "Hello"')).toBe('Say &quot;Hello&quot;');
        });

        it('should escape single quote', () => {
            expect(WmXml.escape("It's mine")).toBe('It&#39;s mine');
        });

        it('should escape all special characters', () => {
            const input = '<tag attr="value">Tom & Jerry\'s "quote"</tag>';
            const expected =
                '&lt;tag attr=&quot;value&quot;&gt;Tom &amp; Jerry&#39;s &quot;quote&quot;&lt;/tag&gt;';
            expect(WmXml.escape(input)).toBe(expected);
        });

        it('should handle numbers', () => {
            expect(WmXml.escape(123)).toBe('123');
            expect(WmXml.escape(123.45)).toBe('123.45');
        });

        it('should handle booleans', () => {
            expect(WmXml.escape(true)).toBe('true');
            expect(WmXml.escape(false)).toBe('false');
        });

        it('should return empty string for null', () => {
            expect(WmXml.escape(null as any)).toBe('');
        });

        it('should return empty string for undefined', () => {
            expect(WmXml.escape(undefined as any)).toBe('');
        });

        it('should handle empty string', () => {
            expect(WmXml.escape('')).toBe('');
        });

        it('should not double-escape', () => {
            const escaped = WmXml.escape('Tom & Jerry');
            const doubleEscaped = WmXml.escape(escaped);
            expect(doubleEscaped).toContain('&amp;amp;');
        });

        it('should handle Unicode characters', () => {
            expect(WmXml.escape('Привет мир')).toBe('Привет мир');
            expect(WmXml.escape('日本語')).toBe('日本語');
        });

        it('should handle emoji', () => {
            expect(WmXml.escape('Hello 🌍')).toBe('Hello 🌍');
        });
    });

    describe('extractValue', () => {
        it('should extract simple tag value', () => {
            const xml = '<root><name>John</name></root>';
            expect(WmXml.extractValue(xml, 'name')).toBe('John');
        });

        it('should extract value with whitespace', () => {
            const xml = '<root><name>  John  </name></root>';
            expect(WmXml.extractValue(xml, 'name')).toBe('John');
        });

        it('should return null for missing optional tag', () => {
            const xml = '<root><other>value</other></root>';
            expect(WmXml.extractValue(xml, 'name', false)).toBeNull();
        });

        it('should throw for missing required tag', () => {
            const xml = '<root><other>value</other></root>';
            expect(() => {
                WmXml.extractValue(xml, 'name', true);
            }).toThrow(WmXmlError);
        });

        it('should be case insensitive', () => {
            const xml = '<root><NAME>John</NAME></root>';
            expect(WmXml.extractValue(xml, 'name')).toBe('John');
        });

        it('should handle nested tags (extracts inner content)', () => {
            const xml = '<root><person><name>John</name></person></root>';
            expect(WmXml.extractValue(xml, 'name')).toBe('John');
        });

        it('should handle empty tag', () => {
            const xml = '<root><name></name></root>';
            expect(WmXml.extractValue(xml, 'name')).toBe('');
        });

        it('should handle tag with numbers', () => {
            const xml = '<root><value>12345</value></root>';
            expect(WmXml.extractValue(xml, 'value')).toBe('12345');
        });

        it('should handle tag with special characters in value', () => {
            const xml = '<root><desc>Test &amp; Demo</desc></root>';
            expect(WmXml.extractValue(xml, 'desc')).toBe('Test &amp; Demo');
        });

        it('should include interface name in error', () => {
            try {
                WmXml.extractValue('<root></root>', 'missing', true, 'TestInterface');
                fail('Should have thrown');
            } catch (error) {
                expect((error as WmXmlError).interfaceName).toBe('TestInterface');
            }
        });
    });

    describe('extractAttribute', () => {
        it('should extract simple attribute', () => {
            const xml = '<root><element id="123"></element></root>';
            expect(WmXml.extractAttribute(xml, 'element', 'id')).toBe('123');
        });

        it('should extract attribute from tag with multiple attributes', () => {
            const xml = '<root><element id="123" name="test" value="data"></element></root>';
            expect(WmXml.extractAttribute(xml, 'element', 'id')).toBe('123');
            expect(WmXml.extractAttribute(xml, 'element', 'name')).toBe('test');
            expect(WmXml.extractAttribute(xml, 'element', 'value')).toBe('data');
        });

        it('should return null for missing optional attribute', () => {
            const xml = '<root><element id="123"></element></root>';
            expect(WmXml.extractAttribute(xml, 'element', 'missing', false)).toBeNull();
        });

        it('should throw for missing required attribute', () => {
            const xml = '<root><element id="123"></element></root>';
            expect(() => {
                WmXml.extractAttribute(xml, 'element', 'missing', true);
            }).toThrow(WmXmlError);
        });

        it('should be case insensitive for tag name', () => {
            const xml = '<root><ELEMENT id="123"></ELEMENT></root>';
            expect(WmXml.extractAttribute(xml, 'element', 'id')).toBe('123');
        });

        it('should handle attribute with empty value', () => {
            const xml = '<root><element id=""></element></root>';
            expect(WmXml.extractAttribute(xml, 'element', 'id')).toBe('');
        });

        it('should include interface name in error', () => {
            try {
                WmXml.extractAttribute('<root></root>', 'element', 'attr', true, 'TestInterface');
                fail('Should have thrown');
            } catch (error) {
                expect((error as WmXmlError).interfaceName).toBe('TestInterface');
            }
        });
    });

    describe('extractBlock', () => {
        it('should extract simple block', () => {
            const xml = '<root><person><name>John</name></person></root>';
            const block = WmXml.extractBlock(xml, 'person');
            expect(block).toContain('<person>');
            expect(block).toContain('</person>');
        });

        it('should return null for missing block', () => {
            const xml = '<root><other>value</other></root>';
            expect(WmXml.extractBlock(xml, 'person')).toBeNull();
        });

        it('should extract nested block', () => {
            const xml = '<root><person><address><city>NYC</city></address></person></root>';
            const block = WmXml.extractBlock(xml, 'person');
            expect(block).toContain('<address>');
        });

        it('should handle block with attributes', () => {
            const xml = '<root><person id="1"><name>John</name></person></root>';
            const block = WmXml.extractBlock(xml, 'person');
            expect(block).toContain('id="1"');
        });

        it('should extract full nested structure', () => {
            const xml = '<root><person><name>John</name><age>30</age></person></root>';
            const block = WmXml.extractBlock(xml, 'person');
            expect(block).toContain('<name>John</name>');
            expect(block).toContain('<age>30</age>');
        });
    });

    describe('extractAllBlocks', () => {
        it('should extract multiple blocks', () => {
            const xml = '<root><item>1</item><item>2</item><item>3</item></root>';
            const blocks = WmXml.extractAllBlocks(xml, 'item');
            expect(blocks.length).toBe(3);
            expect(blocks[0]).toContain('1');
            expect(blocks[1]).toContain('2');
            expect(blocks[2]).toContain('3');
        });

        it('should return empty array for no matches', () => {
            const xml = '<root><other>value</other></root>';
            expect(WmXml.extractAllBlocks(xml, 'item')).toEqual([]);
        });

        it('should be case insensitive', () => {
            const xml = '<root><ITEM>1</ITEM><item>2</item><Item>3</Item></root>';
            const blocks = WmXml.extractAllBlocks(xml, 'item');
            expect(blocks.length).toBe(3);
        });

        it('should handle blocks with attributes', () => {
            const xml = '<root><item id="1">data1</item><item id="2">data2</item></root>';
            const blocks = WmXml.extractAllBlocks(xml, 'item');
            expect(blocks[0]).toContain('id="1"');
            expect(blocks[1]).toContain('id="2"');
        });

        it('should handle nested blocks', () => {
            const xml = '<root><item><sub>1</sub></item><item><sub>2</sub></item></root>';
            const blocks = WmXml.extractAllBlocks(xml, 'item');
            expect(blocks.length).toBe(2);
            blocks.forEach((block) => {
                expect(block).toContain('<sub>');
            });
        });

        it('should handle many blocks efficiently', () => {
            let xml = '<root>';
            for (let i = 0; i < 1000; i++) {
                xml += `<item>${i}</item>`;
            }
            xml += '</root>';

            const blocks = WmXml.extractAllBlocks(xml, 'item');
            expect(blocks.length).toBe(1000);
        });
    });

    describe('clean', () => {
        it('should trim whitespace', () => {
            const xml = '  <root></root>  ';
            expect(WmXml.clean(xml)).toBe('<root></root>');
        });

        it('should remove BOM character', () => {
            const xml = '\uFEFF<root></root>';
            expect(WmXml.clean(xml)).toBe('<root></root>');
        });

        it('should handle newlines and tabs', () => {
            const xml = '\n\t<root>\n\t</root>\n\t';
            expect(WmXml.clean(xml)).toBe('<root>\n\t</root>');
        });

        it('should preserve internal whitespace', () => {
            const xml = '  <root>\n  <child>text</child>\n</root>  ';
            const cleaned = WmXml.clean(xml);
            expect(cleaned).toContain('\n');
        });
    });

    describe('validateResponse', () => {
        it('should validate valid XML', () => {
            expect(() => {
                WmXml.validateResponse('<root></root>', 'TestInterface');
            }).not.toThrow();
        });

        it('should throw for HTML response with html tag', () => {
            expect(() => {
                WmXml.validateResponse('<html><body>Error</body></html>', 'TestInterface');
            }).toThrow(WmXmlError);
        });

        it('should throw for HTML response with doctype', () => {
            expect(() => {
                WmXml.validateResponse('<!DOCTYPE html><html></html>', 'TestInterface');
            }).toThrow(WmXmlError);
        });

        it('should be case insensitive for HTML detection', () => {
            expect(() => {
                WmXml.validateResponse('<HTML></HTML>', 'TestInterface');
            }).toThrow(WmXmlError);
        });

        it('should throw for non-XML response', () => {
            expect(() => {
                WmXml.validateResponse('plain text response', 'TestInterface');
            }).toThrow(WmXmlError);
        });

        it('should throw for empty response', () => {
            expect(() => {
                WmXml.validateResponse('', 'TestInterface');
            }).toThrow(WmXmlError);
        });

        it('should include interface name in error', () => {
            try {
                WmXml.validateResponse('<html></html>', 'TestInterface');
                fail('Should have thrown');
            } catch (error) {
                expect((error as WmXmlError).interfaceName).toBe('TestInterface');
            }
        });

        it('should work with BOM', () => {
            expect(() => {
                WmXml.validateResponse('\uFEFF<root></root>', 'TestInterface');
            }).not.toThrow();
        });
    });

    describe('parseInt', () => {
        it('should parse valid integer string', () => {
            expect(WmXml.parseInt('123')).toBe(123);
        });

        it('should parse zero', () => {
            expect(WmXml.parseInt('0')).toBe(0);
        });

        it('should parse negative integer', () => {
            expect(WmXml.parseInt('-123')).toBe(-123);
        });

        it('should truncate float string', () => {
            expect(WmXml.parseInt('123.45')).toBe(123);
        });

        it('should return default for invalid string', () => {
            expect(WmXml.parseInt('abc')).toBe(0);
        });

        it('should return default for null', () => {
            expect(WmXml.parseInt(null)).toBe(0);
        });

        it('should return default for undefined', () => {
            expect(WmXml.parseInt(undefined)).toBe(0);
        });

        it('should return custom default value', () => {
            expect(WmXml.parseInt('abc', 42)).toBe(42);
            expect(WmXml.parseInt(null, 42)).toBe(42);
            expect(WmXml.parseInt(undefined, 42)).toBe(42);
        });

        it('should handle whitespace', () => {
            expect(WmXml.parseInt('  123  ')).toBe(123);
        });
    });

    describe('parseFloat', () => {
        it('should parse valid float string', () => {
            expect(WmXml.parseFloat('123.45')).toBe(123.45);
        });

        it('should parse integer string', () => {
            expect(WmXml.parseFloat('123')).toBe(123);
        });

        it('should parse zero', () => {
            expect(WmXml.parseFloat('0')).toBe(0);
        });

        it('should parse negative float', () => {
            expect(WmXml.parseFloat('-123.45')).toBe(-123.45);
        });

        it('should parse scientific notation', () => {
            expect(WmXml.parseFloat('1.23e2')).toBe(123);
        });

        it('should return default for invalid string', () => {
            expect(WmXml.parseFloat('abc')).toBe(0);
        });

        it('should return default for null', () => {
            expect(WmXml.parseFloat(null)).toBe(0);
        });

        it('should return default for undefined', () => {
            expect(WmXml.parseFloat(undefined)).toBe(0);
        });

        it('should return custom default value', () => {
            expect(WmXml.parseFloat('abc', 42.5)).toBe(42.5);
        });

        it('should handle whitespace', () => {
            expect(WmXml.parseFloat('  123.45  ')).toBe(123.45);
        });
    });

    describe('Integration tests', () => {
        it('should parse complete XML response', () => {
            const xml = `<response>
                <retval>0</retval>
                <retdesc>Success</retdesc>
                <balance>1000.50</balance>
            </response>`;

            expect(WmXml.extractValue(xml, 'retval')).toBe('0');
            expect(WmXml.extractValue(xml, 'retdesc')).toBe('Success');
            expect(WmXml.extractValue(xml, 'balance')).toBe('1000.50');
        });

        it('should extract and parse numeric values', () => {
            const xml = '<response><count>42</count><amount>99.99</amount></response>';

            const count = WmXml.parseInt(WmXml.extractValue(xml, 'count'));
            const amount = WmXml.parseFloat(WmXml.extractValue(xml, 'amount'));

            expect(count).toBe(42);
            expect(amount).toBe(99.99);
        });

        it('should handle complex API response', () => {
            const xml = `<Root>
                <resultcode>0</resultcode>
                <Invoice>
                    <id>123</id>
                    <amount>100.00</amount>
                    <desc>Payment for order</desc>
                </Invoice>
                <Invoice>
                    <id>124</id>
                    <amount>50.00</amount>
                    <desc>Another payment</desc>
                </Invoice>
            </Root>`;

            expect(WmXml.extractValue(xml, 'resultcode')).toBe('0');
            const invoices = WmXml.extractAllBlocks(xml, 'Invoice');
            expect(invoices.length).toBe(2);
        });
    });

    describe('Edge cases', () => {
        it('should handle very long XML content', () => {
            let xml = '<root>';
            for (let i = 0; i < 10000; i++) {
                xml += `<item>${i}</item>`;
            }
            xml += '</root>';

            expect(() => {
                WmXml.validateResponse(xml, 'TestInterface');
            }).not.toThrow();
        });

        it('should handle XML with special characters in content', () => {
            const xml = '<root><desc>&lt;tag&gt; &amp; special &#39;chars&#39;</desc></root>';
            expect(WmXml.extractValue(xml, 'desc')).toBe(
                '&lt;tag&gt; &amp; special &#39;chars&#39;'
            );
        });

        it('should handle Unicode in XML', () => {
            const xml = '<root><name>Иван Петров</name><city>北京</city></root>';
            expect(WmXml.extractValue(xml, 'name')).toBe('Иван Петров');
            expect(WmXml.extractValue(xml, 'city')).toBe('北京');
        });
    });

    describe('Logging integration', () => {
        beforeEach(() => {
            WmLogger.clearLogger();
        });

        it('should log warning for null/undefined escape', () => {
            const logs: any[] = [];
            WmLogger.setLogger((level, message, data) => {
                logs.push({ level, message, data });
            });

            WmXml.escape(null as any);
            expect(logs.some((log) => log.level === 'warn')).toBe(true);

            WmLogger.clearLogger();
        });
    });
});
