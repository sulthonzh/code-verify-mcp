#!/usr/bin/env node
import { Command } from 'commander';
import { verifyCodeSnippet, generateTests, analyzeComplexity, getConfig, initializeAnalyzer } from './index';
import type { CodeSnippetVerification, VerificationIssue } from './types';

const program = new Command();

program
  .name('code-verify-mcp')
  .description('AI Code Verification MCP Server - Verify AI-generated code quality and security')
  .version('1.0.0');

// Verify command
program
  .command('verify')
  .description('Verify code snippet for quality, security, and performance issues')
  .argument('<code>', 'Code to verify')
  .option('-l, --language <lang>', 'Programming language', 'javascript')
  .option('-s, --security-level <level>', 'Security level: basic, strict, comprehensive', 'basic')
  .option('--quality', 'Analyze code quality', true)
  .option('--security', 'Analyze security', true)
  .option('--performance', 'Analyze performance', true)
  .option('--functional', 'Analyze functionality', true)
  .option('-o, --output <format>', 'Output format: json, markdown, text', 'text')
  .action((code: string, options: Record<string, unknown>) => {
    const result = verifyCodeSnippet(
      code,
      options.language as string,
      {
        securityLevel: options.securityLevel as 'basic' | 'strict' | 'comprehensive',
      }
    );

    if (options.output === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else if (options.output === 'markdown') {
      printMarkdown(result);
    } else {
      printText(result);
    }

    // Exit with non-zero if code is invalid
    if (!result.isValid) {
      process.exit(1);
    }
  });

// Generate tests command
program
  .command('generate-tests')
  .description('Generate test cases based on code analysis')
  .argument('<code>', 'Code to analyze')
  .option('-l, --language <lang>', 'Programming language', 'javascript')
  .action((code: string, options: Record<string, unknown>) => {
    const tests = generateTests(code, options.language as string);

    if (tests.tests.length === 0) {
      console.log('No tests generated. The code appears to be valid.');
      return;
    }

    console.log(`Generated ${tests.tests.length} test cases:\n`);
    tests.tests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.description}`);
      console.log(`   Type: ${test.type}`);
      console.log('   Code:');
      test.code.split('\n').forEach(line => {
        console.log(`     ${line}`);
      });
      console.log();
    });
  });

// Complexity analysis command
program
  .command('complexity')
  .description('Analyze code complexity metrics')
  .argument('<code>', 'Code to analyze')
  .option('-l, --language <lang>', 'Programming language', 'javascript')
  .action((code: string, options: Record<string, unknown>) => {
    const complexity = analyzeComplexity(code, options.language as string);

    console.log('Complexity Analysis Results:\n');
    console.log(`  Cyclomatic Complexity: ${complexity.cyclomaticComplexity.toFixed(2)}`);
    console.log(`  Cognitive Complexity: ${complexity.cognitiveComplexity.toFixed(2)}`);
    console.log(`  Maintainability Index: ${complexity.maintainabilityIndex.toFixed(2)}`);
    console.log();

    if (complexity.suggestions.length > 0) {
      console.log('Recommendations:');
      complexity.suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion}`);
      });
      console.log();
    }

    // Check against thresholds
    if (complexity.cyclomaticComplexity > 10) {
      console.warn('⚠️  Warning: High cyclomatic complexity detected');
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    const config = getConfig();
    console.log('Current Configuration:\n');
    console.log(`  Security Level: ${config.securityLevel}`);
    console.log(`  Analyze Quality: ${config.analyzeQuality}`);
    console.log(`  Analyze Security: ${config.analyzeSecurity}`);
    console.log(`  Analyze Performance: ${config.analyzePerformance}`);
    console.log(`  Analyze Functionality: ${config.analyzeFunctionality}`);
    console.log(`  Max Complexity: ${config.maxComplexity}`);
    console.log();
    console.log('Thresholds:');
    console.log(`  Critical: ${config.thresholds.critical}`);
    console.log(`  High: ${config.thresholds.high}`);
    console.log(`  Medium: ${config.thresholds.medium}`);
    console.log(`  Low: ${config.thresholds.low}`);
  });

// Initialize analyzer command
program
  .command('init')
  .description('Initialize the code analyzer with custom configuration')
  .option('--security-level <level>', 'Security level: basic, strict, comprehensive', 'basic')
  .option('--max-complexity <number>', 'Maximum complexity threshold', '50')
  .action((options: Record<string, unknown>) => {
    initializeAnalyzer({
      securityLevel: options.securityLevel as 'basic' | 'strict' | 'comprehensive',
      maxComplexity: parseInt(options.maxComplexity as string),
    });
    console.log('Code analyzer initialized successfully!');
    console.log(`  Security Level: ${options.securityLevel}`);
    console.log(`  Max Complexity: ${options.maxComplexity}`);
  });

// Demo command
program
  .command('demo')
  .description('Run a demo of the code verification capabilities')
  .action(() => {
    const demoCode = `
// Example function with various issues
function calculateDiscount(price, quantity, customerType) {
  let discount = 0;
  
  if (customerType === 'VIP') {
    discount = price * 0.2;
  }
  
  for (let i = 0; i < quantity; i++) {
    price = price * 0.95;
  }
  
  return price - discount;
}

console.log(calculateDiscount(100, 10, 'VIP'));
`;

    console.log('Running code verification demo...\n');
    console.log('Code:');
    console.log(demoCode);
    console.log('\nVerification Results:\n');

    const result = verifyCodeSnippet(demoCode, 'javascript');

    if (result.isValid) {
      console.log('✅ Code is valid');
    } else {
      console.log('❌ Code has issues:');
    }

    result.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
      console.log(`   ${issue.message}`);
      if (issue.suggestion) {
        console.log(`   💡 ${issue.suggestion}`);
      }
      if (issue.line) {
        console.log(`   📍 Line ${issue.line}`);
      }
    });

    console.log(`\nFinal Score: ${result.score}/100`);
    console.log(`\nSummary:`);
    console.log(`  Total Issues: ${result.summary.totalIssues}`);
    console.log(`  Critical: ${result.summary.criticalCount}`);
    console.log(`  High: ${result.summary.highCount}`);
    console.log(`  Medium: ${result.summary.mediumCount}`);
    console.log(`  Low: ${result.summary.lowCount}`);

    console.log(`\nRecommendations:`);
    result.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Text output printer
function printText(result: CodeSnippetVerification): void {
  console.log(`Verification Results:\n`);

  if (result.isValid) {
    console.log('✅ Code is valid');
  } else {
    console.log('❌ Code has issues:\n');
  }

  result.issues.forEach((issue: VerificationIssue, index: number) => {
    console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
    console.log(`   ${issue.message}`);
    if (issue.suggestion) {
      console.log(`   💡 ${issue.suggestion}`);
    }
    if (issue.line) {
      console.log(`   📍 Line ${issue.line}`);
    }
    console.log();
  });

  console.log(`Final Score: ${result.score}/100`);
  console.log(`\nSummary:`);
  console.log(`  Total Issues: ${result.summary.totalIssues}`);
  console.log(`  Critical: ${result.summary.criticalCount}`);
  console.log(`  High: ${result.summary.highCount}`);
  console.log(`  Medium: ${result.summary.mediumCount}`);
  console.log(`  Low: ${result.summary.lowCount}`);

  console.log(`\nRecommendations:`);
  result.recommendations.forEach((rec: string, index: number) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
}

// Markdown output printer
function printMarkdown(result: CodeSnippetVerification): void {
  console.log('# Code Verification Report\n');

  if (result.isValid) {
    console.log('✅ Code is valid\n');
  } else {
    console.log('❌ Code has issues\n');
  }

  console.log(`## Final Score: ${result.score}/100\n`);

  console.log('### Summary');
  console.log('| Metric | Count |');
  console.log('|--------|-------|');
  console.log(`| Total Issues | ${result.summary.totalIssues} |`);
  console.log(`| Critical | ${result.summary.criticalCount} |`);
  console.log(`| High | ${result.summary.highCount} |`);
  console.log(`| Medium | ${result.summary.mediumCount} |`);
  console.log(`| Low | ${result.summary.lowCount} |`);

  if (result.issues.length > 0) {
    console.log('\n### Issues\n');

    result.issues.forEach((issue: VerificationIssue, index: number) => {
      console.log(`#### ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
      console.log(`- **Message:** ${issue.message}`);
      if (issue.suggestion) {
        console.log(`- **Suggestion:** ${issue.suggestion}`);
      }
      if (issue.line) {
        console.log(`- **Line:** ${issue.line}`);
      }
      console.log();
    });
  }

  if (result.recommendations.length > 0) {
    console.log('### Recommendations\n');

    result.recommendations.forEach((rec: string, index: number) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
}
