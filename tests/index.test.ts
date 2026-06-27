import { describe, it, expect, beforeAll } from 'vitest';
import {
  initializeAnalyzer,
  analyzeCode,
  verifyCodeSnippet,
  generateTests,
  analyzeComplexity,
  getConfig,
  validateCode,
} from '../src/index';

describe('Integration Tests — index.ts', () => {
  beforeAll(() => {
    initializeAnalyzer({
      securityLevel: 'basic',
      maxComplexity: 50,
      thresholds: { critical: 70, high: 80, medium: 85, low: 90 },
    });
  });

  describe('analyzeCode', () => {
    it('should analyze clean code and return valid result', () => {
      const result = analyzeCode('const x = 1 + 2;', 'javascript');
      expect(result.isValid).toBe(true);
      expect(result.score).toBe(100);
      expect(result.issues).toEqual([]);
      expect(result.summary.totalIssues).toBe(0);
    });

    it('should detect eval() as security issue', () => {
      const result = analyzeCode('eval("malicious")', 'javascript');
      expect(result.issues.some(i => i.type === 'security')).toBe(true);
      expect(result.score).toBeLessThan(100);
    });

    it('should detect console.log as low severity issue', () => {
      const result = analyzeCode('console.log("debug")', 'javascript');
      const consoleIssue = result.issues.find(i => i.message.includes('console.log'));
      expect(consoleIssue).toBeDefined();
      expect(consoleIssue!.severity).toBe('low');
    });

    it('should detect nested loops as performance issue', () => {
      const code = `
for (let i = 0; i < 10; i++) {
  for (let j = 0; j < 10; j++) {
    console.log(i * j);
  }
}`;
      const result = analyzeCode(code, 'javascript');
      const perfIssue = result.issues.find(i => i.type === 'performance');
      expect(perfIssue).toBeDefined();
    });

    it('should detect TODO comments as quality issue', () => {
      const code = '// TODO: implement this later';
      const result = analyzeCode(code, 'javascript');
      const qualityIssue = result.issues.find(i => i.type === 'quality' && i.message.includes('technical debt'));
      expect(qualityIssue).toBeDefined();
    });

    it('should return proper summary with counts', () => {
      const code = 'eval("x"); console.log("y");';
      const result = analyzeCode(code, 'javascript');
      expect(result.summary.totalIssues).toBe(result.issues.length);
      expect(result.summary.criticalCount + result.summary.highCount + result.summary.mediumCount + result.summary.lowCount)
        .toBe(result.issues.length);
    });
  });

  describe('verifyCodeSnippet', () => {
    it('should return CodeSnippetVerification with code and language', () => {
      const code = 'const x = 1;';
      const result = verifyCodeSnippet(code, 'javascript');
      expect(result.code).toBe(code);
      expect(result.language).toBe('javascript');
      expect(result.isValid).toBe(true);
    });

    it('should handle securityLevel option', () => {
      const result = verifyCodeSnippet('eval("test")', 'javascript', {
        securityLevel: 'strict',
      });
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('generateTests', () => {
    it('should generate tests for code with security issues', () => {
      const code = 'eval("test")';
      const result = generateTests(code, 'javascript');
      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.tests.some(t => t.type === 'security')).toBe(true);
    });

    it('should generate tests for code with performance issues', () => {
      const code = `
for (let i = 0; i < 10; i++) {
  for (let j = 0; j < 10; j++) {}
}`;
      const result = generateTests(code, 'javascript');
      expect(result.tests.some(t => t.type === 'performance')).toBe(true);
    });

    it('should return empty tests for clean code', () => {
      const result = generateTests('const x = 1;', 'javascript');
      expect(result.tests).toEqual([]);
    });
  });

  describe('analyzeComplexity', () => {
    it('should analyze simple code with low complexity', () => {
      const result = analyzeComplexity('const x = 1;', 'javascript');
      expect(result.cyclomaticComplexity).toBe(1);
      expect(result.cognitiveComplexity).toBeCloseTo(1.2);
      expect(result.maintainabilityIndex).toBeGreaterThan(60);
    });

    it('should detect high complexity in code with many control structures', () => {
      const code = `
function complex(a, b, c) {
  if (a) { if (b) { if (c) { for (let i = 0; i < 10; i++) { while (true) {} } } } }
}`;
      const result = analyzeComplexity(code, 'javascript');
      expect(result.cyclomaticComplexity).toBeGreaterThan(5);
    });

    it('should provide suggestions for complex code', () => {
      const code = `
function complex() {
  if (true) { if (true) { if (true) { if (true) { if (true) { if (true) { if (true) { if (true) { if (true) { if (true) { if (true) {} } } } } } } } } } }`;
      const result = analyzeComplexity(code, 'javascript');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('getConfig', () => {
    it('should return the default configuration', () => {
      const config = getConfig();
      expect(config.securityLevel).toBe('basic');
      expect(config.analyzeQuality).toBe(true);
      expect(config.analyzeSecurity).toBe(true);
      expect(config.thresholds).toBeDefined();
      expect(config.thresholds.critical).toBe(70);
    });
  });

  describe('validateCode', () => {
    it('should validate clean code as valid', () => {
      const result = validateCode('const x = 1;', 'javascript');
      expect(result.isValid).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should flag invalid code', () => {
      const result = validateCode('eval("x")', 'javascript');
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('initializeAnalyzer', () => {
    it('should accept custom config', () => {
      initializeAnalyzer({
        securityLevel: 'comprehensive',
        maxComplexity: 30,
      });
      // Verify it works by analyzing code
      const result = analyzeCode('const x = 1;', 'javascript');
      expect(result).toBeDefined();
    });
  });
});
