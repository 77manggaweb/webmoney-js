# webmoney-js

JavaScript/TypeScript library for WebMoney payment system integration via XML API.

## Installation

```bash
npm install webmoney-js
```

## Features

- TypeScript support with full type definitions
- ES Modules (ESM) support
- Lightweight with minimal dependencies
- 19 WebMoney XML API interfaces supported
- Input validation and error handling
- Optional logging system
- Windows-1251 encoding support
- Key extractor CLI tool for decrypting WebMoney key files (.kwm)

## Quick Start

```typescript
import { WmX1Interface, WmLogger } from 'webmoney-js';

// Enable logging (optional)
WmLogger.setLogger((level, message, data) => {
  console.log(`[${level.toUpperCase()}] ${message}`, data);
});

// Create invoice interface
const invoiceInterface = new WmX1Interface(
  '123456789012', // Your WMID
  '<RSAKeyValue><Modulus>...</Modulus><D>...</D></RSAKeyValue>' // Your private key
);

// Create an invoice
const invoice = await invoiceInterface.createInvoice({
  customerwmid: '987654321098',
  storepurse: 'Z123456789012',
  amount: 100.50,
  desc: 'Payment for services'
});

console.log(`Invoice created: ${invoice.invoice?.id}`);
```

## Key Extractor

The library includes a command-line tool to extract and decrypt WebMoney key files (.kwm) to XML format for use with the API interfaces.

### CLI Usage

After installing the package, you can use the `keyextractor` command:

```bash
# Using named parameters (recommended)
keyextractor --file /path/to/key.kwm --wmid 123456789012 --password mypassword

# Using short options
keyextractor -f /path/to/key.kwm -w 123456789012 -p mypassword

# Show help
keyextractor --help
```

**Parameters:**
- `-f, --file <path>` - Path to the encrypted key file (.kwm)
- `-w, --wmid <wmid>` - Your WebMoney ID (12 digits)
- `-p, --password <pwd>` - Password for the key file
- `-h, --help` - Show help message

The command outputs the RSA key in XML format:
```xml
<RSAKeyValue><Modulus>...</Modulus><D>...</D></RSAKeyValue>
```

You can redirect the output to a file:
```bash
keyextractor -f key.kwm -w 123456789012 -p password > key.xml
```

### Programmatic Usage

You can also use the KeyExtractor class programmatically:

```typescript
import { KeyExtractor } from 'webmoney-js';

const extractor = new KeyExtractor(
  '/path/to/key.kwm',
  '123456789012',
  'mypassword'
);

const xmlKey = await extractor.extract();
console.log(xmlKey); // XML representation of the RSA key
```

Then use the extracted key with API interfaces:

```typescript
import { WmX1Interface, KeyExtractor } from 'webmoney-js';

// Extract key from file
const extractor = new KeyExtractor('key.kwm', wmid, password);
const privateKey = await extractor.extract();

// Use the key with API interface
const invoiceInterface = new WmX1Interface(wmid, privateKey);
```

## Available Interfaces

The library provides 19 WebMoney XML API interfaces:

- **[X1](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X1)** (`WmX1Interface`) - Sending Invoice from merchant to customer
- **[X2](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X2)** (`WmX2Interface`) - Transferring funds from one purse to another
- **[X3](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X3)** (`WmX3Interface`) - Receiving the History of Transactions; checking Transaction status
- **[X4](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X4)** (`WmX4Interface`) - Receiving the history of issued invoices. Verifying whether invoices were paid
- **[X5](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X5)** (`WmX5Interface`) - Completing a code-protected transaction. Entering a protection code
- **[X6](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X6)** (`WmX6Interface`) - Sending message to random WM-identifier via internal mail
- **[X8](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X8)** (`WmX8Interface`) - Retrieving information about purse ownership. Searching for a system user by his/her identifier or purse
- **[X9](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X9)** (`WmX9Interface`) - Retrieving information about purse balance
- **[X10](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X10)** (`WmX10Interface`) - Retrieving list of invoices for payment
- **[X11](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X11)** (`WmX11Interface`) - Retrieving information from client’s passport by WM-identifier
- **[X13](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X13)** (`WmX13Interface`) - Recalling incomplete protected transaction
- **[X14](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X14)** (`WmX14Interface`) - Fee-free refund
- **[X15](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X15)** (`WmX15Interface`) - Viewing and changing settings of “by trust” management
- **[X16](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X16)** (`WmX16Interface`) - Creating a purse
- **[X18](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X18)** (`WmX18Interface`) - Getting transaction details via merchant.webmoney
- **[X19](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X19)** (`WmX19Interface`) - Verifying personal information for the owner of a WM identifier
- **[X21](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X21)** (`WmX21Interface`) - Setting trust for merchant payments by SMS
- **[X22](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X22)** (`WmX22Interface`) - Receiving the ticket of prerequest payment form at merchant.webmoney
- **[X23](https://en.webmoney.wiki/projects/webmoney/wiki/Interface_X23)** (`WmX23Interface`) - Rejection of received invoices/cancellation of issued invoices.

## Usage Examples

### Creating an Invoice (X1)

```typescript
import { WmX1Interface } from 'webmoney-js';

const xmlInterface = new WmX1Interface(wmid, privateKey);

const response = await xmlInterface.createInvoice({
  customerwmid: '987654321098',
  storepurse: 'Z123456789012',
  amount: 100.50,
  desc: 'Payment description',
  orderid: 12345,
  period: 24,
  expiration: 48
});

if (response.invoice) {
  console.log(`Invoice ID: ${response.invoice.id}`);
}
```

### Transferring Funds (X2)

```typescript
import { WmX2Interface } from 'webmoney-js';

const xmlInterface = new WmX2Interface(wmid, privateKey);

const response = await xmlInterface.transfer({
  tranid: 123456,
  pursesrc: 'Z123456789012',
  pursedest: 'Z987654321098',
  amount: 50.00,
  period: 24,
  pcode: '',
  desc: 'Transfer description',
  wminvid: 0,
  onlyauth: 1
});

if (response.operation) {
  console.log(`Transfer ID: ${response.operation.id}`);
}
```

### Getting Passport Information (X11)

```typescript
import { WmX11Interface } from 'webmoney-js';

const xmlInterface = new WmX11Interface(wmid, privateKey);

const response = await xmlInterface.getPassportInfo({
  passportwmid: '987654321098',
  dict: 0,
  info: 1,
  mode: 0
});

console.log(`WMID: ${response.certinfo?.wmid}`);
```

## Error Handling

The library uses typed error classes for better error handling:

```typescript
import { WmApiError, WmNetworkError, WmValidationError } from 'webmoney-js';

try {
  const response = await xmlInterface.createInvoice({...});
} catch (error) {
  if (error instanceof WmApiError) {
    console.error(`API Error (${error.retval}): ${error.retdesc}`);
  } else if (error instanceof WmNetworkError) {
    console.error(`Network error: ${error.message}`);
  } else if (error instanceof WmValidationError) {
    console.error(`Validation error in ${error.field}: ${error.message}`);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Logging

Enable optional logging:

```typescript
import { WmLogger } from 'webmoney-js';

// Custom logger callback
WmLogger.setLogger((level, message, data) => {
  switch (level) {
    case 'error':
      console.error(message, data);
      break;
    case 'warn':
      console.warn(message, data);
      break;
    case 'info':
      console.info(message, data);
      break;
    case 'debug':
      console.debug(message, data);
      break;
  }
});

// Disable logging
WmLogger.clearLogger();
```

## Input Validation

The library automatically validates input parameters:

```typescript
import { WmValidationError } from 'webmoney-js';

try {
  await xmlInterface.createInvoice({
    customerwmid: 'invalid', // Will throw WmValidationError
    storepurse: 'Z123456789012',
    amount: -100, // Will throw WmValidationError
    desc: ''
  });
} catch (error) {
  if (error instanceof WmValidationError) {
    console.error(`Invalid ${error.field}: ${error.message}`);
  }
}
```

## API Reference

All interfaces extend `WmBaseInterface` and follow a consistent pattern:

```typescript
import number = CSS.number;

const xmlInterface = new WmXInterface(wmid, privateKey, customApiUrl=null);
const response = await xmlInterface.methodName(params, reqn=null);
```

### Common Parameters

- `wmid`: Your WebMoney ID (12 digits)
- `privateKey`: Your RSA private key in XML format
- `customApiUrl`: Optional custom API endpoint URL
- `reqn`: Optional request number (always must be greater than a previous request number for signer WMID). Generated automatically if not provided.

## Configuration

Default API URLs and settings can be accessed via `WmConfig`:

```typescript
import { WmConfig } from 'webmoney-js';

console.log(WmConfig.DEFAULT_URLS.X1);
console.log(WmConfig.ENCODING); // 'windows-1251'
console.log(WmConfig.REQUEST_TIMEOUT); // 30000
```

## Development

### Build

```bash
npm run build
```

This will generate ES Modules output in `dist/`

### Test

```bash
npm test
```

### Clean

```bash
npm run clean
```

## License

MIT
