import { describe, it, expect, beforeEach } from 'vitest';
import { CodeAnalyzer } from '../src/analysis';
import { CodeVerificationConfig } from '../src/types';

describe('CodeAnalyzer', () => {
  let analyzer: CodeAnalyzer;

  beforeEach(() => {
    const config: CodeVerificationConfig = {
      securityLevel: 'basic',
      analyzeQuality: true,
      analyzeSecurity: true,
      analyzePerformance: true,
      analyzeFunctionality: true,
      maxComplexity: 50,
      thresholds: { critical: 70, high: 80, medium: 85, low: 90 },
    };
    analyzer = new CodeAnalyzer(config);
  });

  describe('analyze', () => {
    it('should analyze valid JavaScript code with no issues', () => {
      const code = `
function greet(name) {
  return \`Hello, \${name}!\`;
}

const result = greet('World');
`;

      const result = analyzer.analyze(code, 'javascript');

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(100);
      expect(result.issues.length).toBe(0);
    });

    it('should detect security issues', () => {
      const code = `
eval("console.log('test')");

innerHTML = '<div>test</div>';

document.write('<div>test</div>');
`;

      const result = analyzer.analyze(code, 'javascript');

      expect(result.issues.some(i => i.type === 'security' && i.severity === 'critical')).toBe(true);
      expect(result.issues.some(i => i.type === 'security' && i.severity === 'high')).toBe(true);
      expect(result.issues.some(i => i.type === 'security' && i.severity === 'high')).toBe(true);
    });

    it('should detect quality issues', () => {
      const code = `
function veryLongFunctionNameThatDoesWayTooMuchStuff() {
  // This function is way too long
  for (let i = 0; i < 100; i++) {
    console.log(i);
  }
}
`;

      const result = analyzer.analyze(code, 'javascript');

      expect(result.issues.some(i => i.type === 'quality' && i.severity === 'medium')).toBe(true);
    });

    it('should detect performance issues', () => {
      const code = `
for (let i = 0; i < 100; i++) {
  for (let j = 0; j < 100; j++) {
    console.log(i, j);
  }
}
`;

      const result = analyzer.analyze(code, 'javascript');

      expect(result.issues.some(i => i.type === 'performance' && i.severity === 'medium')).toBe(true);
    });

    it('should detect functional issues', () => {
      const code = `
function emptyFunction() {
  // Do nothing
}

let unused = 'this variable is never used';
`;

      const result = analyzer.analyze(code, 'javascript');

      expect(result.issues.some(i => i.type === 'functional' && i.severity === 'medium')).toBe(true);
    });

    it('should calculate score correctly', () => {
      const code = `
eval("console.log('test')");

function longFunction() {
  // function body
}
`;

      const result = analyzer.analyze(code, 'javascript');

      expect(result.score).toBeLessThan(100);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should provide summary statistics', () => {
      const code = `
eval("console.log('test')");

function longFunction() {
  // function body
}
`;

      const result = analyzer.analyze(code, 'javascript');

      expect(result.summary.totalIssues).toBeGreaterThan(0);
      expect(result.summary.criticalCount).toBeGreaterThanOrEqual(0);
      expect(result.summary.highCount).toBeGreaterThanOrEqual(0);
      expect(result.summary.mediumCount).toBeGreaterThanOrEqual(0);
      expect(result.summary.lowCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle different languages', () => {
      const javascriptCode = 'eval("console.log(\'test\')")';
      const pythonCode = 'exec("print(\'test\')")';

      const jsResult = analyzer.analyze(javascriptCode, 'javascript');
      const pyResult = analyzer.analyze(pythonCode, 'python');

      expect(jsResult.issues.some(i => i.type === 'security')).toBe(true);
      expect(pyResult.issues.some(i => i.type === 'security')).toBe(true);
    });

    it('should respect analysis configuration', () => {
      const code = `
eval("console.log('test')");

function longFunction() {
  // function body
}
`;

      const config: CodeVerificationConfig = {
        securityLevel: 'basic',
        analyzeQuality: false,
        analyzeSecurity: false,
        analyzePerformance: false,
        analyzeFunctionality: false,
        maxComplexity: 50,
        thresholds: { critical: 70, high: 80, medium: 85, low: 90 },
      };

      const customAnalyzer = new CodeAnalyzer(config);
      const result = customAnalyzer.analyze(code, 'javascript');

      expect(result.issues.length).toBe(0);
    });
  });

  describe('security analysis', () => {
    it('should detect eval() usage', () => {
      const code = 'eval("console.log(\'test\')")';

      const result = analyzer.analyze(code, 'javascript');

      expect(result.issues.some(i => i.type === 'security' && i.message.includes('eval'))).toBe(true);
    });

    it('should detect innerHTML usage', () => {
      const code = 'innerHTML = \'<div>test</div>\';';

      const result = analyzer.analyze(code, 'javascript');

      expect(result.issues.some(i => i.type === 'security' && i.severity === 'high')).toBe(true);
    });

    it('should detect SQL injection patterns', () => {
      const code = '$query("SELECT * FROM users WHERE id = " + userId)';

      const result = analyzer.analyze(code, 'javascript');

      expect(result.issues.some(i => i.type === 'security' && i.message.includes('SQL injection'))).toBe(true);
    });
  });

  describe('quality analysis', () => {
    it('should detect long functions', () => {
      const code = `
function veryLongFunctionNameThatDoesWayTooMuchStuff() {
  // This function is way too long
  for (let i = 0; i < 100; i++) {
    console.log(i);
  }
}
`;

      const result = analyzer.analyze(code, 'javascript');

      expect(result.issues.some(i => i.type === 'quality' && i.severity === 'medium')).toBe(true);
    });

    it('should detect TODO/FIXME comments', () => {
      const code = `
// TODO: Implement this function
function implementThis() {
  // code
}

// FIXME: Fix this bug
// HACK: This is a workaround
`;

      const result = analyzer.analyze(code, 'javascript');

      expect(result.issues.some(i => i.type === 'quality' && i.message.includes('TODO'))).toBe(true);
      expect(result.issues.some(i => i.type === 'quality' && i.message.includes('FIXME'))).toBe(true);
      expect(result.issues.some(i => i.type === 'quality' && i.message.includes('HACK'))).toBe(true);
    });
  });

  describe('performance analysis', () => {
    it('should detect nested loops', () => {
      const code = `
for (let i = 0; i < 100; i++) {
  for (let j = 0; j < 100; j++) {
    console.log(i, j);
  }
}
`;

      const result = analyzer.analyze(code, 'javascript');

      expect(result.issues.some(i => i.type === 'performance' && i.severity === 'medium')).toBe(true);
    });
  });

  describe('functional analysis', () => {
    it('should detect empty functions', () => {
      const code = `
function emptyFunction() {
}
`;

      const result = analyzer.analyze(code, 'javascript');

      expect(result.issues.some(i => i.type === 'functional' && i.severity === 'medium')).toBe(true);
    });
  });

  describe('issue severity', () => {
    it('should correctly categorize issue severity', () => {
      const code = `
eval("console.log('test')");

innerHTML = '<div>test</div>';

console.log('test');

// TODO: Fix this
`;

      const result = analyzer.analyze(code, 'javascript');

      const severityCounts = {
        critical: result.issues.filter(i => i.severity === 'critical').length,
        high: result.issues.filter(i => i.severity === 'high').length,
        medium: result.issues.filter(i => i.severity === 'medium').length,
        low: result.issues.filter(i => i.severity === 'low').length,
      };

      expect(severityCounts.critical).toBeGreaterThan(0);
      expect(severityCounts.high).toBeGreaterThan(0);
      expect(severityCounts.medium).toBeGreaterThanOrEqual(0);
      expect(severityCounts.low).toBeGreaterThan(0);
    });
  });
});
