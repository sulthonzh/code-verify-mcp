import { CodeAnalyzer } from './analysis';
import {
  CodeVerificationConfig,
  CodeVerificationConfig as ICodeVerificationConfig,
  VerificationResult,
  CodeSnippetVerification,
  TestGenerationResult,
  ComplexityAnalysis,
} from './types';

/**
 * CodeVerify MCP - AI Code Verification Server
 *
 * This module provides code verification capabilities for AI-generated code.
 * It analyzes code for security issues, quality problems, performance bottlenecks,
 * and functional correctness.
 */

// Create default configuration
const defaultConfig: CodeVerificationConfig = {
  securityLevel: 'basic',
  analyzeQuality: true,
  analyzeSecurity: true,
  analyzePerformance: true,
  analyzeFunctionality: true,
  ignorePatterns: ['node_modules', '.git', '.vscode', '.idea'],
  maxComplexity: 50,
  minMaintainabilityIndex: 60,
  thresholds: {
    critical: 70,
    high: 80,
    medium: 85,
    low: 90,
  },
};

// Global analyzer instance
let analyzer: CodeAnalyzer;

/**
 * Initialize the code analyzer
 */
export function initializeAnalyzer(config?: Partial<CodeVerificationConfig>): void {
  const finalConfig: CodeVerificationConfig = {
    ...defaultConfig,
    ...config,
  };

  analyzer = new CodeAnalyzer(finalConfig);
}

/**
 * Analyze a code snippet
 */
export function analyzeCode(
  code: string,
  language: string,
  options?: {
    securityLevel?: 'basic' | 'strict' | 'comprehensive';
    analyzeQuality?: boolean;
    analyzeSecurity?: boolean;
    analyzePerformance?: boolean;
    analyzeFunctionality?: boolean;
  }
): VerificationResult {
  const config: CodeVerificationConfig = {
    securityLevel: options?.securityLevel || defaultConfig.securityLevel,
    analyzeQuality: options?.analyzeQuality !== false,
    analyzeSecurity: options?.analyzeSecurity !== false,
    analyzePerformance: options?.analyzePerformance !== false,
    analyzeFunctionality: options?.analyzeFunctionality !== false,
    maxComplexity: defaultConfig.maxComplexity,
    thresholds: defaultConfig.thresholds,
  };

  return analyzer.analyze(code, language);
}

/**
 * Analyze code and return formatted result with code snippet
 */
export function verifyCodeSnippet(
  code: string,
  language: string,
  options?: {
    securityLevel?: 'basic' | 'strict' | 'comprehensive';
  }
): CodeSnippetVerification {
  const result = analyzeCode(code, language, {
    securityLevel: options?.securityLevel,
  });

  return {
    ...result,
    code,
    language,
  };
}

/**
 * Generate test cases based on code analysis
 */
export function generateTests(code: string, language: string): TestGenerationResult {
  const issues = analyzeCode(code, language).issues;
  const tests: TestGenerationResult['tests'] = [];

  // Generate security tests
  const securityIssues = issues.filter(i => i.type === 'security');
  for (const issue of securityIssues) {
    tests.push({
      description: `Test for ${issue.type} vulnerability at line ${issue.line}`,
      code: `// Security test for ${issue.type}\n// Expected: Security issue should be detected\n// Line ${issue.line}: ${issue.message}`,
      type: 'security',
    });
  }

  // Generate performance tests
  const performanceIssues = issues.filter(i => i.type === 'performance');
  for (const issue of performanceIssues) {
    tests.push({
      description: `Performance test for ${issue.type} issue`,
      code: `// Performance test for ${issue.type}\n// Expected: Performance analysis should identify this issue\n// ${issue.message}`,
      type: 'performance',
    });
  }

  // Generate functional tests
  const functionalIssues = issues.filter(i => i.type === 'functional');
  for (const issue of functionalIssues) {
    tests.push({
      description: `Functional test for ${issue.type} issue`,
      code: `// Functional test for ${issue.type}\n// Expected: Functionality should be properly tested\n// ${issue.message}`,
      type: 'functional',
    });
  }

  return { tests };
}

/**
 * Analyze code complexity
 */
export function analyzeComplexity(code: string, language: string): ComplexityAnalysis {
  const lines = code.split('\n');
  const functions = countFunctions(code);
  const classes = countClasses(code);

  // Simple complexity estimation
  const cyclomaticComplexity = estimateCyclomaticComplexity(code);
  const cognitiveComplexity = cyclomaticComplexity * 1.2; // Simplified estimate
  const maintainabilityIndex = 100 - (cyclomaticComplexity * 1.5) - (lines.length * 0.05) - (functions * 0.5);

  const recommendations: string[] = [];
  if (cyclomaticComplexity > 10) {
    recommendations.push('Code has high cyclomatic complexity. Consider refactoring to reduce complexity.');
  }
  if (maintainabilityIndex < 60) {
    recommendations.push('Maintainability index is below 60. Consider refactoring for better maintainability.');
  }

  return {
    cyclomaticComplexity,
    cognitiveComplexity,
    maintainabilityIndex: Math.max(0, maintainabilityIndex),
    suggestions: recommendations,
  };
}

// Helper methods for complexity analysis
function countFunctions(code: string): number {
  const functionPatterns = [
    /\bfunction\s+\w+\s*\(/g,
    /const\s+\w+\s*=\s*\([^)]*\)\s*=>/g,
    /let\s+\w+\s*=\s*\([^)]*\)\s*=>/g,
    /class\s+\w+/g,
  ];

  let count = 0;
  for (const pattern of functionPatterns) {
    count += (code.match(pattern) || []).length;
  }
  return count;
}

function countClasses(code: string): number {
  return (code.match(/class\s+\w+/g) || []).length;
}

function estimateCyclomaticComplexity(code: string): number {
  // Simple complexity estimation based on control structures
  const controlStructures = [
    /\bif\s*\(/g,
    /\belse\s*\{/g,
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bcase\s+/g,
    /\bcatch\s*\(/g,
  ];

  let complexity = 1; // Base complexity
  for (const pattern of controlStructures) {
    complexity += (code.match(pattern) || []).length;
  }

  return complexity;
}

/**
 * Get current configuration
 */
export function getConfig(): ICodeVerificationConfig {
  return defaultConfig;
}

/**
 * Validate code snippet
 */
export function validateCode(
  code: string,
  language: string,
  options?: {
    securityLevel?: 'basic' | 'strict' | 'comprehensive';
  }
): {
  isValid: boolean;
  score: number;
  issues: any[];
} {
  const result = verifyCodeSnippet(code, language, {
    securityLevel: options?.securityLevel,
  });

  return {
    isValid: result.isValid,
    score: result.score,
    issues: result.issues,
  };
}
