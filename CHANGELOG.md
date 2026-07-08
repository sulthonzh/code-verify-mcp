# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Security issues now include `suggestion` field (was dropped during vulnerability→issue mapping)
- SQL injection and XSS vulnerabilities now include actionable suggestions
- Security recommendations array now populated from security checks (was empty)

### Changed
- Rewrote CLI tests from simulated mock objects to real integration tests (19 → 37 tests)
- `SecurityVulnerability` interface extended with optional `suggestion` field
- Coverage improved: 94.44%→96.48% stmts, 83.82%→86.76% branches, index.ts now 100% stmts

## [1.0.1] - 2026-06-29

### Changed
- Replaced `any` types with proper TypeScript interfaces throughout codebase
- Fixed false "Zero-dependency" claim in README (project uses MCP SDK, commander, diff, js-yaml, semver)
- Fixed incorrect config file reference (`trustshell.config.js` → `code-verify-mcp.config.js`)

### Added
- ESLint flat config with typescript-eslint (zero warnings, zero errors)
- `lint` script in package.json
- Comparison table in README (vs ESLint, SonarQube, Snyk Code)
- `SecurityVulnerability` interface for type-safe vulnerability reporting
- `varsIgnorePattern` for test fixture variables

## [1.0.0] - 2026-06-15

### Added
- AI Code Verification MCP Server with security, quality, performance, and functionality analysis
- CLI with commands: verify, generate-tests, complexity, config, init, demo
- Security scanning: eval detection, SQL injection patterns, XSS detection, innerHTML warnings
- Quality analysis: function length checks, TODO/FIXME detection, magic number detection
- Performance analysis: nested loop detection, memory leak pattern matching
- Functional analysis: empty function detection, unused variable detection
- Test suite: 36 tests (19 CLI, 17 analysis), 100% pass rate
- TypeScript strict mode, zero compilation errors
- Support for JavaScript, TypeScript, and Python code analysis
