import {
  VerificationIssue,
  SecurityScanResult,
  SecurityVulnerability,
  VerificationResult,
  CodeVerificationConfig,
} from './types';

export class CodeAnalyzer {
  constructor(private config: CodeVerificationConfig) {}

  /**
   * Analyze code and return comprehensive verification result
   */
  analyze(code: string, language: string): VerificationResult {
    const issues: VerificationIssue[] = [];
    const recommendations: string[] = [];

    // Run all analysis modules based on config
    if (this.config.analyzeSecurity) {
      const securityResult = this.analyzeSecurity(code, language);
      issues.push(...securityResult.vulnerabilities.map(v => ({
        type: 'security' as const,
        severity: v.severity,
        message: v.description,
        suggestion: v.suggestion,
        line: this.findLineNumber(code, v.location),
        code: v.type,
      })));
      recommendations.push(...securityResult.recommendations);
    }

    if (this.config.analyzeQuality) {
      const qualityResult = this.analyzeQuality(code, language);
      issues.push(...qualityResult.issues);
      recommendations.push(...qualityResult.recommendations);
    }

    if (this.config.analyzePerformance) {
      const performanceResult = this.analyzePerformance(code, language);
      issues.push(...performanceResult.issues);
      recommendations.push(...performanceResult.recommendations);
    }

    if (this.config.analyzeFunctionality) {
      const functionalResult = this.analyzeFunctionality(code, language);
      issues.push(...functionalResult.issues);
      recommendations.push(...functionalResult.recommendations);
    }

    // Calculate score
    const score = this.calculateScore(issues);

    return {
      isValid: score >= this.config.thresholds.low,
      score,
      issues,
      recommendations,
      summary: this.calculateSummary(issues),
    };
  }

  /**
   * Analyze code quality
   */
  private analyzeQuality(code: string, _language: string): {
    issues: VerificationIssue[];
    recommendations: string[];
  } {
    const issues: VerificationIssue[] = [];
    const recommendations: string[] = [];

    // Check for long functions and complex functions
    const lines = code.split('\n');
    let currentFunctionLines = 0;
    let inFunction = false;
    let funcHasControlFlow = false;
    let funcBraceDepth = 0;
    let currentFuncName = '';

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comment-only lines for function detection
      const isCommentLine = trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
      const funcStartMatch = isCommentLine ? null : line.match(/function\s+(\w+)/);
      const arrowMatch = isCommentLine ? null : line.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>)/);

      if (funcStartMatch || arrowMatch) {
        if (inFunction && funcHasControlFlow) {
          issues.push({
            type: 'quality',
            severity: 'medium',
            message: `Function '${currentFuncName}' contains control flow statements which may increase complexity`,
            suggestion: 'Consider extracting complex logic into separate, focused functions',
          });
        }
        inFunction = true;
        currentFunctionLines = 0;
        funcHasControlFlow = false;
        funcBraceDepth = 0;
        currentFuncName = funcStartMatch ? funcStartMatch[1] : (arrowMatch ? arrowMatch[1] : '');
      }

      if (inFunction) {
        currentFunctionLines++;
        // Count braces but ignore those in strings or comments
        for (let ci = 0; ci < line.length; ci++) {
          const ch = line[ci];
          if (ch === '/' && ci + 1 < line.length && line[ci + 1] === '/') break; // rest is comment
          if (ch === '{') funcBraceDepth++;
          else if (ch === '}') funcBraceDepth--;
        }
        if (!isCommentLine && /\b(?:for|while|if|switch)\s*\(/.test(line)) {
          funcHasControlFlow = true;
        }
        if (currentFunctionLines > 50 && this.config.maxComplexity && currentFunctionLines > this.config.maxComplexity) {
          issues.push({
            type: 'quality',
            severity: 'medium',
            message: `Function exceeds recommended length of ${this.config.maxComplexity} lines`,
            suggestion: 'Consider breaking the function into smaller, focused functions',
          });
        }
        if (funcBraceDepth <= 0 && currentFunctionLines > 0) {
          if (funcHasControlFlow) {
            issues.push({
              type: 'quality',
              severity: 'medium',
              message: `Function '${currentFuncName}' contains control flow statements which may increase complexity`,
              suggestion: 'Consider extracting complex logic into separate, focused functions',
            });
          }
          inFunction = false;
        }
      }
    }

    // Check for TODO/FIXME comments
    const todoComments = code.match(/\/\/\s*(TODO|FIXME|HACK)/gi);
    if (todoComments && todoComments.length > 0) {
      issues.push({
        type: 'quality',
        severity: 'medium',
        message: `Found ${todoComments.length} technical debt markers (TODO/FIXME/HACK)`,
        suggestion: 'Address these technical debt items before production deployment',
      });
    }

    // Check for magic numbers
    const magicNumbers = code.match(/\b\d+\b/g);
    if (magicNumbers && magicNumbers.length > 10) {
      issues.push({
        type: 'quality',
        severity: 'low',
        message: `Found ${magicNumbers.length} magic numbers without constants`,
        suggestion: 'Consider defining constants for magic numbers for better readability and maintainability',
      });
    }

    return { issues, recommendations };
  }

  /**
   * Analyze security
   */
  private analyzeSecurity(code: string, language: string): SecurityScanResult {
    const vulnerabilities: SecurityVulnerability[] = [];
    const recommendations: string[] = [];

    // Security patterns to check
    const securityChecks = [
      {
        pattern: /eval\s*\(/gi,
        severity: 'critical' as const,
        message: 'Found eval() which is a security risk',
        suggestion: 'Avoid using eval() with dynamic input. Use safer alternatives.',
      },
      {
        pattern: /\bexec\s*\(/gi,
        severity: 'critical' as const,
        message: 'Found exec() which is a security risk',
        suggestion: 'Avoid using exec() with dynamic input. Use safer alternatives.',
      },
      {
        pattern: /innerHTML\s*=/gi,
        severity: 'high' as const,
        message: 'Found innerHTML assignment which can lead to XSS vulnerabilities',
        suggestion: 'Use textContent instead of innerHTML for non-HTML content.',
      },
      {
        pattern: /document\.write\s*\(/gi,
        severity: 'high' as const,
        message: 'Found document.write() which can cause security issues',
        suggestion: 'Avoid document.write() in modern web development.',
      },
      {
        pattern: /dangerouslySetInnerHTML/gi,
        severity: 'high' as const,
        message: 'Found dangerouslySetInnerHTML which can lead to XSS vulnerabilities',
        suggestion: 'Sanitize HTML input before rendering with dangerouslySetInnerHTML.',
      },
      {
        pattern: /\balert\s*\(/gi,
        severity: 'low' as const,
        message: 'Found alert() which blocks user interaction',
        suggestion: 'Consider using non-blocking alternatives like toasts or modals.',
      },
      {
        pattern: /console\.log\s*\(/gi,
        severity: 'low' as const,
        message: 'Found console.log() statements in code',
        suggestion: 'Remove console.log() statements in production code.',
      },
    ];

    for (const check of securityChecks) {
      const matches = code.match(check.pattern);
      if (matches) {
        vulnerabilities.push({
          type: check.message.split('(')[0],
          severity: check.severity,
          location: `${check.pattern}`,
          description: check.message,
          suggestion: check.suggestion,
        });
        recommendations.push(check.suggestion);
      }
    }

    // SQL injection checks
    if (language === 'javascript' || language === 'typescript' || language === 'python') {
      const queryPatterns = [
        /\$[a-zA-Z_]\w*/g, // $query, $sql, etc.
        /execute\s*\(\s*['"`]/gi,
        /query\s*\(\s*['"`]/gi,
      ];

      for (const pattern of queryPatterns) {
        const matches = code.match(pattern);
        if (matches && matches.length > 0) {
          vulnerabilities.push({
            type: 'SQL Injection',
            severity: 'critical' as const,
            location: `Query pattern: ${matches[0]}`,
            description: 'Found dynamic query construction that may lead to SQL injection',
            suggestion: 'Use parameterized queries instead of string concatenation for SQL.',
          });
          break;
        }
      }
    }

    // XSS checks
    if (language === 'javascript' || language === 'typescript') {
      const xssPatterns = [
        /createElement\s*\([^)]*\)\s*innerHTML/gi,
        /document\.createElement[^)]*textContent/gi,
      ];

      for (const pattern of xssPatterns) {
        if (code.match(pattern)) {
          vulnerabilities.push({
            type: 'XSS',
            severity: 'high' as const,
            location: 'Element creation',
            description: 'Potential XSS vulnerability detected in element creation',
            suggestion: 'Sanitize all user input before inserting into DOM elements.',
          });
        }
      }
    }

    // Calculate security score
    const score = this.calculateSecurityScore(vulnerabilities, recommendations);

    return { score, vulnerabilities, recommendations };
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(vulnerabilities: SecurityVulnerability[], _recommendations: string[]): number {
    let score = 100;

    for (const vuln of vulnerabilities) {
      if (vuln.severity === 'critical') score -= 25;
      else if (vuln.severity === 'high') score -= 15;
      else if (vuln.severity === 'medium') score -= 8;
      else if (vuln.severity === 'low') score -= 3;
    }

    return Math.max(0, score);
  }

  /**
   * Analyze performance
   */
  private analyzePerformance(code: string, _language: string): {
    issues: VerificationIssue[];
    recommendations: string[];
  } {
    const issues: VerificationIssue[] = [];
    const recommendations: string[] = [];

    // Check for N^2 complexity patterns (nested loops)
    const nestedLoops = code.match(/for\s*\([^)]*\)\s*\{[^}]*?for\s*\(/gi);
    if (nestedLoops && nestedLoops.length > 0) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        message: `Found ${nestedLoops.length} nested loop patterns which may indicate O(n²) complexity`,
        suggestion: 'Consider optimizing nested loops with algorithms like binary search, hashing, or dynamic programming',
      });
    }

    // Check for repeated operations
    const repeatedRegex = /(\w+)\s*\+=\s*\1/gi;
    const repeatedOps = code.match(repeatedRegex);
    if (repeatedOps && repeatedOps.length > 0) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        message: `Found repeated operations that could be optimized`,
        suggestion: 'Consider using more efficient algorithms or caching results',
      });
    }

    // Check for memory leaks (function expressions that are not cleaned up)
    const functionLeaks = code.match(/function\s+(\w+)\s*\([^)]*\)\s*\{[^}]*\}\s*[\s\n]*\}/g);
    if (functionLeaks && functionLeaks.length > 0) {
      issues.push({
        type: 'performance',
        severity: 'low',
        message: 'Found potential memory leak patterns',
        suggestion: 'Ensure event listeners and timers are properly cleaned up',
      });
    }

    return { issues, recommendations };
  }

  /**
   * Analyze functionality
   */
  private analyzeFunctionality(code: string, language: string): {
    issues: VerificationIssue[];
    recommendations: string[];
  } {
    const issues: VerificationIssue[] = [];
    const recommendations: string[] = [];

    // Check for empty functions (including comment-only functions)
    const emptyFunctions = code.match(/function\s+(\w+)\s*\([^)]*\)\s*\{\s*(?:\/\/[^\n]*\s*|\/\*[\s\S]*?\*\/\s*)*\}/g);
    if (emptyFunctions && emptyFunctions.length > 0) {
      issues.push({
        type: 'functional',
        severity: 'medium',
        message: `Found ${emptyFunctions.length} empty functions`,
        suggestion: 'Either implement the function logic or remove it if it\'s not needed',
      });
    }

    // Check for unused variables
    const unusedPatterns = [
      /\bconst\s+(\w+)\s*=/g,
      /\blet\s+(\w+)\s*=/g,
    ];

    for (const pattern of unusedPatterns) {
      const matches = code.match(pattern);
      if (matches && matches.length > 5) {
        issues.push({
          type: 'functional',
          severity: 'low',
          message: 'Potential unused variables detected',
          suggestion: 'Remove variables that are not being used',
        });
      }
    }

    // Check for undefined behavior
    if (language === 'javascript' || language === 'typescript') {
      const unsafeDereferences = code.match(/\w+\s*\.\w+\s*\?/g);
      if (unsafeDereferences && unsafeDereferences.length > 0) {
        issues.push({
          type: 'functional',
          severity: 'medium',
          message: 'Found optional chaining usage that may hide errors',
          suggestion: 'Consider adding null checks for undefined/null values',
        });
      }
    }

    return { issues, recommendations };
  }

  /**
   * Calculate overall score from issues
   */
  private calculateScore(issues: VerificationIssue[]): number {
    let score = 100;

    for (const issue of issues) {
      if (issue.severity === 'critical') score -= 30;
      else if (issue.severity === 'high') score -= 15;
      else if (issue.severity === 'medium') score -= 7;
      else if (issue.severity === 'low') score -= 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(issues: VerificationIssue[]): VerificationResult['summary'] {
    return {
      totalIssues: issues.length,
      criticalCount: issues.filter(i => i.severity === 'critical').length,
      highCount: issues.filter(i => i.severity === 'high').length,
      mediumCount: issues.filter(i => i.severity === 'medium').length,
      lowCount: issues.filter(i => i.severity === 'low').length,
    };
  }

  /**
   * Find line number from location string
   */
  private findLineNumber(code: string, location: string): number | undefined {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(location)) {
        return i + 1;
      }
    }
    return undefined;
  }
}
