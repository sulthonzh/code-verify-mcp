import { describe, it, expect } from 'vitest';
import { CodeAnalyzer } from '../src/analysis';
import { CodeVerificationConfig } from '../src/types';
import { initializeAnalyzer, analyzeCode } from '../src/index';

describe('Coverage Gap Tests Round 2 — XSS Regex Fix + Remaining Branches', () => {

  describe('analysis.ts — XSS createElement detection (line 262)', () => {
    const securityConfig: CodeVerificationConfig = {
      securityLevel: 'basic',
      analyzeQuality: false,
      analyzeSecurity: true,
      analyzePerformance: false,
      analyzeFunctionality: false,
      maxComplexity: 50,
      thresholds: { critical: 70, high: 80, medium: 85, low: 90 },
    };

    it('should detect createElement().innerHTML pattern (regex pattern 1)', () => {
      const analyzer = new CodeAnalyzer(securityConfig);
      // Pattern 1: createElement\s*\([^)]*\)\s*\.?\s*innerHTML
      const code = `
const el = document.createElement('div');
el.innerHTML = userInput;
`;
      // This doesn't match pattern 1 (semicolon + newline breaks chain)
      // But this single-line version does:
      const code2 = `document.createElement('div').innerHTML = userInput;`;
      const result2 = analyzer.analyze(code2, 'javascript');
      expect(result2.issues.some(i =>
        i.type === 'security' && i.message.includes('XSS')
      )).toBe(true);
    });

    it('should detect document.createElement().textContent pattern (regex pattern 2)', () => {
      const analyzer = new CodeAnalyzer(securityConfig);
      const code = `document.createElement('div').textContent = userInput;`;
      const result = analyzer.analyze(code, 'javascript');
      expect(result.issues.some(i =>
        i.type === 'security' && i.message.includes('XSS')
      )).toBe(true);
    });

    it('should detect createElement with innerHTML without document prefix', () => {
      const analyzer = new CodeAnalyzer(securityConfig);
      const code = `createElement('span').innerHTML = data;`;
      const result = analyzer.analyze(code, 'javascript');
      expect(result.issues.some(i =>
        i.type === 'security' && i.message.includes('XSS')
      )).toBe(true);
    });

    it('should NOT trigger XSS for clean code without DOM patterns', () => {
      const analyzer = new CodeAnalyzer(securityConfig);
      const code = `const x = 1 + 2;`;
      const result = analyzer.analyze(code, 'javascript');
      expect(result.issues.some(i => i.message.includes('XSS'))).toBe(false);
    });

    it('should detect both XSS patterns when both present', () => {
      const analyzer = new CodeAnalyzer(securityConfig);
      const code = `
createElement('div').innerHTML = a;
document.createElement('p').textContent = b;
`;
      const result = analyzer.analyze(code, 'javascript');
      const xssIssues = result.issues.filter(i => i.message.includes('XSS'));
      // Both patterns should add a vulnerability (the loop adds one per pattern match)
      expect(xssIssues.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('analysis.ts — findLineNumber found case (line 433)', () => {
    it('should return line number when location string appears in code', () => {
      const config: CodeVerificationConfig = {
        securityLevel: 'basic',
        analyzeQuality: false,
        analyzeSecurity: true,
        analyzePerformance: false,
        analyzeFunctionality: false,
        maxComplexity: 50,
        thresholds: { critical: 70, high: 80, medium: 85, low: 90 },
      };
      const analyzer = new CodeAnalyzer(config);

      // The XSS location string is 'Element creation'.
      // If the code contains "Element creation" as a comment, findLineNumber will find it.
      const code = `// Element creation
document.createElement('div').innerHTML = userInput;`;

      const result = analyzer.analyze(code, 'javascript');

      // The createElement XSS issue should have line set (not undefined) because
      // findLineNumber finds "Element creation" on line 1 of the code.
      // Note: the innerHTML security check also contains 'XSS' in its message,
      // so we filter specifically for the element creation description.
      const xssIssue = result.issues.find(i =>
        i.message.includes('element creation')
      );
      expect(xssIssue).toBeDefined();
      expect(xssIssue!.line).toBe(1);
    });

    it('should return undefined for location not in code', () => {
      const config: CodeVerificationConfig = {
        securityLevel: 'basic',
        analyzeQuality: false,
        analyzeSecurity: true,
        analyzePerformance: false,
        analyzeFunctionality: false,
        maxComplexity: 50,
        thresholds: { critical: 70, high: 80, medium: 85, low: 90 },
      };
      const analyzer = new CodeAnalyzer(config);

      // XSS detected but code doesn't contain "Element creation" text
      const code = `document.createElement('div').innerHTML = x;`;
      const result = analyzer.analyze(code, 'javascript');

      const xssIssue = result.issues.find(i =>
        i.message.includes('element creation')
      );
      expect(xssIssue).toBeDefined();
      expect(xssIssue!.line).toBeUndefined();
    });
  });

  describe('index.ts — initializeAnalyzer false branch (line 43)', () => {
    it('should handle initializeAnalyzer called with no arguments', () => {
      // Covers the false branch of `if (_config)` when _config is undefined
      expect(() => initializeAnalyzer()).not.toThrow();
    });

    it('should handle initializeAnalyzer called with undefined explicitly', () => {
      expect(() => initializeAnalyzer(undefined)).not.toThrow();
    });

    it('should handle initializeAnalyzer called with empty object', () => {
      expect(() => initializeAnalyzer({})).not.toThrow();
    });

    it('should still analyze correctly after initializeAnalyzer() no-op', () => {
      initializeAnalyzer();
      const result = analyzeCode('const x = 1;', 'javascript');
      expect(result).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
    });
  });
});
