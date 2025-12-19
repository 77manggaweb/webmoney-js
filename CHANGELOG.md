# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.0.0] - 2025-11-09

### Added
- Initial release
- Support for 18 WebMoney XML API interfaces (X1-X23)
- TypeScript support with full type definitions
- Key extractor CLI tool for decrypting WebMoney key files (.kwm)
- Input validation and error handling
- Optional logging system
- Windows-1251 encoding support
- Comprehensive test suite

### Interfaces Supported
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
