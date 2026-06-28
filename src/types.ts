export interface VerificationIssue {
  type: 'security' | 'quality' | 'performance' | 'functional';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion?: string;
  line?: number;
  code?: string;
}

export interface VerificationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: VerificationIssue[];
  recommendations: string[];
  summary: {
    totalIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
}

export interface CodeQualityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  linesOfCode: number;
  functions: number;
  classes: number;
  functionsPerClass: number;
}

export interface SecurityVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
}

export interface SecurityScanResult {
  score: number; // 0-100
  vulnerabilities: SecurityVulnerability[];
  recommendations: string[];
}

export interface ComplexityAnalysis {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  suggestions: string[];
}

export interface CodeVerificationConfig {
  securityLevel: 'basic' | 'strict' | 'comprehensive';
  analyzeQuality: boolean;
  analyzeSecurity: boolean;
  analyzePerformance: boolean;
  analyzeFunctionality: boolean;
  ignorePatterns?: string[];
  maxComplexity?: number;
  minMaintainabilityIndex?: number;
  thresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface VerificationOptions {
  code: string;
  language: string;
  frameworks?: string[];
  securityLevel?: 'basic' | 'strict' | 'comprehensive';
}

export interface CodeSnippetVerification extends VerificationResult {
  code: string;
  language: string;
}

export interface TestGenerationResult {
  tests: Array<{
    description: string;
    code: string;
    type: 'security' | 'performance' | 'functional';
  }>;
}
