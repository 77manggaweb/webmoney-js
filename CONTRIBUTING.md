# Contributing to WebMoney-JS

Thank you for your interest in contributing to WebMoney-JS! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

## Getting Started

You are welcome to contribute to this project.

To create a pull request:
* Fork the Monit project
* Create a new topic branch (off the master branch) to contain your feature, change, or fix
* Commit your changes in logical chunks and when done push your changes up to your fork and open a pull request (PR) with a clear title and description against the WebMoney-JS master branch

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm (comes with Node.js)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Run tests:
   ```bash
   npm test
   ```

## Development Workflow

1. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** following our coding standards

3. **Write or update tests** for your changes

4. **Run tests** to ensure everything works:
   ```bash
   npm test
   ```

5. **Build the project** to check for TypeScript errors:
   ```bash
   npm run build
   ```

6. **Commit your changes** with a clear commit message:
   ```bash
   git add .
   git commit -m "feat: add new feature X"
   # or
   git commit -m "fix: resolve issue with Y"
   ```

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request** on GitHub

## Coding Standards

### TypeScript

- Use TypeScript for all source code
- Enable `strict` mode in TypeScript configuration
- Provide type annotations for function parameters and return values
- Avoid using `any` type when possible

### Code Style

- Follow the existing code style
- Use 4 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Maximum line length: 100 characters
- Use Prettier for formatting (configuration provided in `.prettierrc`)
- Use ESLint for code quality (configuration provided in `.eslintrc.json`)

### Naming Conventions

- **Classes**: PascalCase (e.g., `WmX1Interface`)
- **Interfaces/Types**: PascalCase (e.g., `WmX1Request`)
- **Functions/Methods**: camelCase (e.g., `createInvoice`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_TIMEOUT`)
- **Private members**: prefix with underscore (e.g., `_privateField`)

### Documentation

- Add JSDoc comments for all public classes, methods, and functions
- Include parameter descriptions and return types
- Add `@throws` tags for exceptions
- Include usage examples for complex functionality

Example:
```typescript
/**
 * Creates a new invoice in the WebMoney system.
 * @param req - The invoice request parameters
 * @param reqn - Optional request number
 * @returns A promise that resolves to the invoice creation response
 * @throws WmValidationError if input parameters are invalid
 * @throws WmApiError if the API returns an error
 */
async createInvoice(req: WmX1Request, reqn?: number): Promise<WmX1Response> {
    // implementation
}
```

### Error Handling

- Use custom error classes (`WmApiError`, `WmNetworkError`, `WmValidationError`, etc.)
- Provide clear and helpful error messages
- Include context in error messages (e.g., which field failed validation)
- Use logging for debugging information

### Testing

- Write unit tests for all new functionality
- Use Jest as the testing framework
- Aim for >80% code coverage
- Test both success and error cases
- Mock external dependencies (e.g., network calls)

Example test structure:
```typescript
describe('WmX1Interface', () => {
    describe('createInvoice', () => {
        it('should successfully create invoice', async () => {
            // test implementation
        });

        it('should throw validation error for invalid amount', async () => {
            // test implementation
        });
    });
});
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Place test files in the `tests/` directory
- Mirror the `src/` directory structure
- Name test files with `.test.ts` suffix
- Use descriptive test names that explain what is being tested

## Submitting Changes

### Pull Request Process

1. **Update documentation** if you've changed APIs or added features
2. **Ensure all tests pass** and coverage is maintained
3. **Ensure the build succeeds** without errors or warnings
4. **Write a clear PR description** explaining:
   - What changes you made
   - Why you made them
   - How to test the changes
   - Any breaking changes

### Commit Message Format

Use conventional commit format:

- `feat: add new feature` - New feature
- `fix: resolve bug` - Bug fix
- `docs: update README` - Documentation changes
- `style: format code` - Code style changes (formatting, etc.)
- `refactor: restructure code` - Code refactoring
- `test: add tests` - Adding tests
- `chore: update dependencies` - Maintenance tasks

### PR Title

Use the same format as commit messages:
```
feat: add support for X22 interface
fix: resolve timeout issue in network calls
docs: improve installation instructions
```

## Reporting Bugs

### Before Submitting a Bug Report

1. Check the existing issues to avoid duplicates
2. Ensure you're using the latest version
3. Verify the issue is reproducible

### How to Submit a Bug Report

Create an issue with the following information:

**Title**: Short, descriptive summary

**Description**:
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Environment**:
  - Node.js version
  - npm version
  - Operating system
  - Package version
- **Additional context**: Error messages, stack traces, screenshots, etc.

## Requesting Features

### Before Requesting a Feature

1. Check existing issues for similar requests
2. Consider if the feature fits the project scope
3. Think about how it would benefit other users

### How to Request a Feature

Create an issue with the following information:

**Title**: Clear feature description

**Description**:
- **Problem**: What problem does this solve?
- **Proposed solution**: How should it work?
- **Alternatives**: Other solutions you've considered
- **Additional context**: Examples, mockups, use cases

## Questions?

If you have questions about contributing, feel free to:
- Open an issue with the "question" label
- Reach out to the maintainers

## License

By contributing to WebMoney-JS, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉
