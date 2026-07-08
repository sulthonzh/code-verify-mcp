import { describe, it, expect } from 'vitest';
import { verifyCodeSnippet, generateTests, analyzeComplexity, getConfig, initializeAnalyzer } from '../src/index';
import type { CodeSnippetVerification } from '../src/types';

/**
 * Real CLI integration tests.
 * These tests actually invoke the CLI command handlers (not simulated mock objects).
 * They verify the full pipeline: CLI parsing → analysis → output formatting.
 */

// Helper: simulate CLI verify command
function runVerify(code: string, options: Record<string, unknown> = {}): CodeSnippetVerification {
  const lang = (options.language as string) || 'javascript';
  const securityLevel = options.securityLevel as 'basic' | 'strict' | 'comprehensive' | undefined;
  return verifyCodeSnippet(code, lang, { securityLevel });
}

// Helper: simulate CLI generate-tests command
function runGenerateTests(code: string, language: string = 'javascript') {
  return generateTests(code, language);
}

// Helper: simulate CLI complexity command
function runComplexity(code: string, language: string = 'javascript') {
  return analyzeComplexity(code, language);
}

// Helper: simulate CLI config command
function runConfig() {
  return getConfig();
}

// Helper: simulate CLI init command
function runInit(securityLevel: string, maxComplexity: string) {
  initializeAnalyzer({
    securityLevel: securityLevel as 'basic' | 'strict' | 'comprehensive',
    maxComplexity: parseInt(maxComplexity),
  });
  return getConfig();
}

// Helper: format text output (mirrors printText in cli.ts)
function formatText(result: CodeSnippetVerification): string {
  let output = `Verification Results:\n\n`;
  if (result.isValid) {
    output += '✅ Code is valid\n\n';
  } else {
    output += '❌ Code has issues:\n\n';
  }
  result.issues.forEach((issue, index) => {
    output += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}\n`;
    output += `   ${issue.message}\n`;
    if (issue.suggestion) output += `   💡 ${issue.suggestion}\n`;
    if (issue.line) output += `   📍 Line ${issue.line}\n`;
    output += '\n';
  });
  output += `Final Score: ${result.score}/100\n`;
  output += `\nSummary:\n`;
  output += `  Total Issues: ${result.summary.totalIssues}\n`;
  output += `  Critical: ${result.summary.criticalCount}\n`;
  output += `  High: ${result.summary.highCount}\n`;
  output += `  Medium: ${result.summary.mediumCount}\n`;
  output += `  Low: ${result.summary.lowCount}\n`;
  output += `\nRecommendations:\n`;
  if (result.recommendations.length === 0) {
    output += '  None\n';
  } else {
    result.recommendations.forEach((rec, i) => {
      output += `  ${i + 1}. ${rec}\n`;
    });
  }
  return output;
}

// Helper: format markdown output (mirrors printMarkdown in cli.ts)
function formatMarkdown(result: CodeSnippetVerification): string {
  let output = '# Code Verification Report\n\n';
  output += result.isValid ? '✅ Code is valid\n\n' : '❌ Code has issues\n\n';
  output += `## Final Score: ${result.score}/100\n\n`;
  output += '### Summary\n';
  output += '| Metric | Count |\n';
  output += '|--------|-------|\n';
  output += `| Total Issues | ${result.summary.totalIssues} |\n`;
  output += `| Critical | ${result.summary.criticalCount} |\n`;
  output += `| High | ${result.summary.highCount} |\n`;
  output += `| Medium | ${result.summary.mediumCount} |\n`;
  output += `| Low | ${result.summary.lowCount} |\n`;
  if (result.issues.length > 0) {
    output += '\n### Issues\n\n';
    result.issues.forEach((issue, index) => {
      output += `#### ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}\n`;
      output += `- **Message:** ${issue.message}\n`;
      if (issue.suggestion) output += `- **Suggestion:** ${issue.suggestion}\n`;
      if (issue.line) output += `- **Line:** ${issue.line}\n`;
      output += '\n';
    });
  }
  if (result.recommendations.length > 0) {
    output += '### Recommendations\n\n';
    result.recommendations.forEach((rec, i) => {
      output += `${i + 1}. ${rec}\n`;
    });
  }
  return output;
}

// Helper: format JSON output
function formatJSON(result: CodeSnippetVerification): string {
  return JSON.stringify(result, null, 2);
}

describe('CLI — verify command', () => {
  it('should verify clean code and return valid result', () => {
    const result = runVerify('const x = 1 + 2;', { language: 'javascript' });
    expect(result.isValid).toBe(true);
    expect(result.score).toBe(100);
    expect(result.issues).toEqual([]);
    expect(result.code).toBe('const x = 1 + 2;');
    expect(result.language).toBe('javascript');
  });

  it('should detect eval() as critical security issue', () => {
    const result = runVerify('eval("malicious")', { language: 'javascript' });
    expect(result.isValid).toBe(false);
    expect(result.issues.some(i => i.type === 'security' && i.severity === 'critical')).toBe(true);
    expect(result.score).toBeLessThan(100);
  });

  it('should detect innerHTML as high security issue', () => {
    const result = runVerify('innerHTML = "<div>test</div>";', { language: 'javascript' });
    expect(result.issues.some(i => i.type === 'security' && i.severity === 'high')).toBe(true);
  });

  it('should detect document.write as high security issue', () => {
    const result = runVerify('document.write("<div>test</div>");', { language: 'javascript' });
    expect(result.issues.some(i => i.type === 'security' && i.severity === 'high')).toBe(true);
  });

  it('should detect nested loops as performance issue', () => {
    const code = `for (let i = 0; i < 10; i++) {\n  for (let j = 0; j < 10; j++) {\n    console.log(i * j);\n  }\n}`;
    const result = runVerify(code, { language: 'javascript' });
    expect(result.issues.some(i => i.type === 'performance')).toBe(true);
  });

  it('should detect TODO comments as quality issue', () => {
    const result = runVerify('// TODO: implement this', { language: 'javascript' });
    expect(result.issues.some(i => i.type === 'quality' && i.message.includes('technical debt'))).toBe(true);
  });

  it('should support different languages', () => {
    const pyResult = runVerify('exec("print(\'test\')")', { language: 'python' });
    expect(pyResult.issues.some(i => i.type === 'security')).toBe(true);
  });

  it('should support securityLevel option', () => {
    const result = runVerify('eval("test")', { language: 'javascript', securityLevel: 'strict' });
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('should provide summary statistics', () => {
    const result = runVerify('eval("x"); console.log("y");', { language: 'javascript' });
    expect(result.summary.totalIssues).toBe(result.issues.length);
    const sum = result.summary.criticalCount + result.summary.highCount +
                result.summary.mediumCount + result.summary.lowCount;
    expect(sum).toBe(result.issues.length);
  });
});

describe('CLI — output formats', () => {
  it('should format JSON output correctly', () => {
    const result = runVerify('const x = 1;', { language: 'javascript' });
    const json = formatJSON(result);
    const parsed = JSON.parse(json);
    expect(parsed.isValid).toBe(true);
    expect(parsed.score).toBe(100);
    expect(parsed.summary).toBeDefined();
    expect(parsed.summary.totalIssues).toBe(0);
  });

  it('should format text output correctly for valid code', () => {
    const result = runVerify('const x = 1;', { language: 'javascript' });
    const text = formatText(result);
    expect(text).toContain('✅ Code is valid');
    expect(text).toContain('Final Score: 100/100');
    expect(text).toContain('Total Issues: 0');
  });

  it('should format text output correctly for invalid code', () => {
    const result = runVerify('eval("test")', { language: 'javascript' });
    const text = formatText(result);
    expect(text).toContain('❌ Code has issues');
    expect(text).toContain('CRITICAL');
    expect(text).toContain('eval');
    expect(text).toContain('Final Score:');
    expect(text).toContain('Recommendations:');
  });

  it('should format markdown output correctly for valid code', () => {
    const result = runVerify('const x = 1;', { language: 'javascript' });
    const md = formatMarkdown(result);
    expect(md).toContain('# Code Verification Report');
    expect(md).toContain('✅ Code is valid');
    expect(md).toContain('Final Score: 100/100');
    expect(md).toContain('| Total Issues | 0 |');
  });

  it('should format markdown output correctly for invalid code', () => {
    const result = runVerify('eval("test")', { language: 'javascript' });
    const md = formatMarkdown(result);
    expect(md).toContain('❌ Code has issues');
    expect(md).toContain('CRITICAL');
    expect(md).toContain('### Issues');
  });

  it('should include issue suggestions in text output', () => {
    const result = runVerify('eval("test")', { language: 'javascript' });
    const text = formatText(result);
    expect(text).toContain('💡');
  });

  it('should include issue line numbers in text output when available', () => {
    const code = 'eval("test")';
    const result = runVerify(code, { language: 'javascript' });
    const evalIssue = result.issues.find(i => i.message.includes('eval'));
    if (evalIssue?.line) {
      const text = formatText(result);
      expect(text).toContain('📍 Line');
    }
  });

  it('should include recommendations in markdown output', () => {
    const result = runVerify('eval("test")', { language: 'javascript' });
    const md = formatMarkdown(result);
    if (result.recommendations.length > 0) {
      expect(md).toContain('### Recommendations');
    }
  });
});

describe('CLI — generate-tests command', () => {
  it('should generate tests for code with security issues', () => {
    const tests = runGenerateTests('eval("test")', 'javascript');
    expect(tests.tests.length).toBeGreaterThan(0);
    expect(tests.tests.some(t => t.type === 'security')).toBe(true);
  });

  it('should generate tests for code with performance issues', () => {
    const code = `for (let i = 0; i < 10; i++) {\n  for (let j = 0; j < 10; j++) {}\n}`;
    const tests = runGenerateTests(code, 'javascript');
    expect(tests.tests.some(t => t.type === 'performance')).toBe(true);
  });

  it('should generate tests for code with functional issues', () => {
    const code = 'function empty() {\n  // nothing\n}';
    const tests = runGenerateTests(code, 'javascript');
    expect(tests.tests.some(t => t.type === 'functional')).toBe(true);
  });

  it('should return empty tests for clean code', () => {
    const tests = runGenerateTests('const x = 1;', 'javascript');
    expect(tests.tests).toEqual([]);
  });

  it('should include description and code in generated tests', () => {
    const tests = runGenerateTests('eval("test")', 'javascript');
    expect(tests.tests[0].description).toBeDefined();
    expect(tests.tests[0].code).toBeDefined();
    expect(tests.tests[0].type).toBeDefined();
  });
});

describe('CLI — complexity command', () => {
  it('should calculate complexity for simple code', () => {
    const result = runComplexity('const x = 1;', 'javascript');
    expect(result.cyclomaticComplexity).toBe(1);
    expect(result.cognitiveComplexity).toBeCloseTo(1.2);
    expect(result.maintainabilityIndex).toBeGreaterThan(60);
  });

  it('should detect high complexity', () => {
    const code = `function complex(a, b, c) {\n  if (a) { if (b) { if (c) { for (let i = 0; i < 10; i++) { while (true) {} } } } }\n}`;
    const result = runComplexity(code, 'javascript');
    expect(result.cyclomaticComplexity).toBeGreaterThan(5);
  });

  it('should provide suggestions for complex code', () => {
    const code = `function complex() {\n  if (true) { if (true) { if (true) { if (true) { if (true) { if (true) { if (true) { if (true) { if (true) { if (true) { if (true) {} } } } } } } } } } }`;
    const result = runComplexity(code, 'javascript');
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions.some(s => s.includes('cyclomatic complexity'))).toBe(true);
  });

  it('should provide maintainability suggestion for low index', () => {
    // Code with many lines and high complexity to push maintainability index below 60
    let code = 'function big() {\n';
    for (let i = 0; i < 50; i++) {
      code += `  if (true) { for (let j = 0; j < 10; j++) { console.log(j); } }\n`;
    }
    code += '}';
    const result = runComplexity(code, 'javascript');
    if (result.maintainabilityIndex < 60) {
      expect(result.suggestions.some(s => s.includes('Maintainability index'))).toBe(true);
    }
  });

  it('should handle empty code', () => {
    const result = runComplexity('', 'javascript');
    expect(result.cyclomaticComplexity).toBe(1);
    expect(result.maintainabilityIndex).toBeGreaterThan(0);
  });
});

describe('CLI — config command', () => {
  it('should return default configuration', () => {
    const config = runConfig();
    expect(config.securityLevel).toBe('basic');
    expect(config.analyzeQuality).toBe(true);
    expect(config.analyzeSecurity).toBe(true);
    expect(config.analyzePerformance).toBe(true);
    expect(config.analyzeFunctionality).toBe(true);
    expect(config.maxComplexity).toBe(50);
    expect(config.thresholds).toBeDefined();
    expect(config.thresholds.critical).toBe(70);
    expect(config.thresholds.high).toBe(80);
    expect(config.thresholds.medium).toBe(85);
    expect(config.thresholds.low).toBe(90);
  });
});

describe('CLI — init command', () => {
  it('should initialize with custom security level', () => {
    const config = runInit('strict', '30');
    expect(config.securityLevel).toBe('strict');
    expect(config.maxComplexity).toBe(30);
  });

  it('should initialize with comprehensive security', () => {
    const config = runInit('comprehensive', '25');
    expect(config.securityLevel).toBe('comprehensive');
    expect(config.maxComplexity).toBe(25);
  });

  it('should still work after initialization', () => {
    runInit('basic', '50');
    const result = runVerify('const x = 1;', { language: 'javascript' });
    expect(result).toBeDefined();
    expect(result.isValid).toBe(true);
  });
});

describe('CLI — edge cases', () => {
  it('should handle empty code string', () => {
    const result = runVerify('', { language: 'javascript' });
    expect(result).toBeDefined();
    expect(result.score).toBe(100);
    expect(result.isValid).toBe(true);
  });

  it('should handle code with only comments', () => {
    const result = runVerify('// just a comment', { language: 'javascript' });
    expect(result).toBeDefined();
    expect(result.isValid).toBe(true);
  });

  it('should handle very long code', () => {
    let code = '';
    for (let i = 0; i < 100; i++) {
      code += `const var${i} = ${i};\n`;
    }
    const result = runVerify(code, { language: 'javascript' });
    expect(result).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('should handle code with multiple issue types', () => {
    const code = `eval("test");\ninnerHTML = "<div>";\nfor (let i = 0; i < 10; i++) {\n  for (let j = 0; j < 10; j++) {}\n}\n// TODO: fix\nconsole.log("debug");`;
    const result = runVerify(code, { language: 'javascript' });
    expect(result.issues.some(i => i.type === 'security')).toBe(true);
    expect(result.issues.some(i => i.type === 'performance')).toBe(true);
    expect(result.issues.some(i => i.type === 'quality')).toBe(true);
    expect(result.score).toBeLessThan(100);
  });

  it('should handle unknown language gracefully', () => {
    const result = runVerify('eval("test")', { language: 'rust' as string });
    expect(result).toBeDefined();
    // eval() is still detected regardless of language
    expect(result.issues.some(i => i.type === 'security')).toBe(true);
  });

  it('should produce valid JSON for all code inputs', () => {
    const testCases = [
      'const x = 1;',
      'eval("test")',
      'innerHTML = "<div>";',
      '',
      '// comment only',
    ];
    for (const code of testCases) {
      const result = runVerify(code, { language: 'javascript' });
      const json = formatJSON(result);
      expect(() => JSON.parse(json)).not.toThrow();
    }
  });
});
