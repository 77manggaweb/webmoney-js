/**
 * WebMoney JS - Easy and lightweight client for WebMoney payment system
 *
 * This module provides TypeScript support for WebMoney XML API interfaces
 * and cryptographic signing functionality.
 */

// Export main signer class
export { WmSigner } from './signer/WmSigner';

// Export key extractor
export { KeyExtractor } from './keyextractor/KeyExtractor';

// Export XML interfaces
export { WmX1Interface } from './interfaces/WmXmlX1Interface';
export { WmX2Interface } from './interfaces/WmXmlX2Interface';
export { WmX3Interface } from './interfaces/WmXmlX3Interface';
export { WmX4Interface } from './interfaces/WmXmlX4Interface';
export { WmX5Interface } from './interfaces/WmXmlX5Interface';
export { WmX6Interface } from './interfaces/WmXmlX6Interface';
export { WmX8Interface } from './interfaces/WmXmlX8Interface';
export { WmX9Interface } from './interfaces/WmXmlX9Interface';
export { WmX10Interface } from './interfaces/WmXmlX10Interface';
export { WmX11Interface } from './interfaces/WmXmlX11Interface';
export { WmX13Interface } from './interfaces/WmXmlX13Interface';
export { WmX14Interface } from './interfaces/WmXmlX14Interface';
export { WmX15Interface } from './interfaces/WmXmlX15Interface';
export { WmX16Interface } from './interfaces/WmXmlX16Interface';
export { WmX18Interface } from './interfaces/WmXmlX18Interface';
export { WmX19Interface } from './interfaces/WmXmlX19Interface';
export { WmX21Interface } from './interfaces/WmXmlX21Interface';
export { WmX22Interface } from './interfaces/WmXmlX22Interface';
export { WmX23Interface } from './interfaces/WmXmlX23Interface';

// Export utility classes
export { WmConvert } from './utils/WmConvert';
export { WmString } from './utils/WmString';
export { WmXml } from './utils/WmXml';
export { WmLogger } from './utils/WmLogger';
export type { LogLevel, LogCallback } from './utils/WmLogger';

// Export error classes
export {
    WmError,
    WmApiError,
    WmNetworkError,
    WmValidationError,
    WmXmlError,
} from './errors/WmError';

// Export validation class
export { WmValidator } from './validation/WmValidator';

// Export configuration class
export { WmConfig } from './config/WmConfig';

// Export base interface (for advanced users who want to extend)
export { WmBaseInterface } from './interfaces/WmBaseInterface';
export type { WmBaseResponse } from './interfaces/WmBaseInterface';

// Re-export all types and interfaces for convenience
export * from './interfaces/WmXmlX1Interface';
export * from './interfaces/WmXmlX2Interface';
export * from './interfaces/WmXmlX3Interface';
export * from './interfaces/WmXmlX4Interface';
export * from './interfaces/WmXmlX5Interface';
export * from './interfaces/WmXmlX6Interface';
export * from './interfaces/WmXmlX8Interface';
export * from './interfaces/WmXmlX9Interface';
export * from './interfaces/WmXmlX10Interface';
export * from './interfaces/WmXmlX11Interface';
export * from './interfaces/WmXmlX13Interface';
export * from './interfaces/WmXmlX14Interface';
export * from './interfaces/WmXmlX15Interface';
export * from './interfaces/WmXmlX16Interface';
export * from './interfaces/WmXmlX18Interface';
export * from './interfaces/WmXmlX19Interface';
export * from './interfaces/WmXmlX21Interface';
export * from './interfaces/WmXmlX22Interface';
export * from './interfaces/WmXmlX23Interface';
