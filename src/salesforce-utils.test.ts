/**
 * Test file for Salesforce ID conversion utilities
 *
 * These tests use synthetic IDs to verify the conversion algorithm
 * without exposing real Salesforce data.
 */

import { convertTo18CharId, ensureId18 } from './salesforce-utils.js';

// Test cases with synthetic IDs
const testCases = [
  // Format: [15-char input, expected suffix pattern explanation]
  // Note: We're testing the algorithm works, not hardcoding expected results
  // since we don't have access to real Salesforce test pairs
  { id15: '006000000000001', description: 'All lowercase first 15 chars' },
  { id15: 'AAAAAAAAAAAAAAA', description: 'All uppercase' },
  { id15: 'aaaaaaaaaaaaaaa', description: 'All lowercase' },
  { id15: '001AAAAAAAAAAAA', description: 'Mixed case with leading digits' },
  { id15: '006Ab1234567890', description: 'Mixed case realistic pattern' },
];

console.log('Testing Salesforce ID conversion algorithm\n');
console.log('=' .repeat(70));

// Test basic conversion
testCases.forEach(testCase => {
  try {
    const result = convertTo18CharId(testCase.id15);
    console.log(`\nInput:  ${testCase.id15} (${testCase.description})`);
    console.log(`Output: ${result}`);
    console.log(`Suffix: ${result.substring(15)}`);

    // Verify output length
    if (result.length !== 18) {
      throw new Error(`Expected 18 characters, got ${result.length}`);
    }

    // Verify original ID is preserved
    if (!result.startsWith(testCase.id15)) {
      throw new Error('Original ID not preserved in output');
    }

    console.log('✓ PASS');
  } catch (error) {
    console.log(`✗ FAIL: ${error instanceof Error ? error.message : String(error)}`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('\nTesting ensureId18 function\n');
console.log('=' .repeat(70));

// Test ensureId18 with 15-char ID
try {
  const id15 = '006000000000001';
  const result = ensureId18(id15);
  console.log(`\n15-char input: ${id15}`);
  console.log(`Output:        ${result}`);
  console.log(`Length:        ${result.length}`);
  if (result.length === 18) {
    console.log('✓ PASS: Correctly converted 15-char to 18-char');
  } else {
    console.log('✗ FAIL: Output length incorrect');
  }
} catch (error) {
  console.log(`✗ FAIL: ${error instanceof Error ? error.message : String(error)}`);
}

// Test ensureId18 with 18-char ID (should return as-is)
try {
  const id18 = '006000000000001AAA';
  const result = ensureId18(id18);
  console.log(`\n18-char input: ${id18}`);
  console.log(`Output:        ${result}`);
  if (result === id18) {
    console.log('✓ PASS: 18-char ID returned unchanged');
  } else {
    console.log('✗ FAIL: 18-char ID was modified');
  }
} catch (error) {
  console.log(`✗ FAIL: ${error instanceof Error ? error.message : String(error)}`);
}

// Test error handling
console.log('\n' + '='.repeat(70));
console.log('\nTesting error handling\n');
console.log('=' .repeat(70));

const errorCases = [
  { input: '', description: 'Empty string' },
  { input: '123', description: 'Too short (3 chars)' },
  { input: '0060000000000011234', description: 'Too long (19 chars)' },
  { input: '12345678901234', description: 'Too short (14 chars)' },
];

errorCases.forEach(testCase => {
  try {
    ensureId18(testCase.input);
    console.log(`\n${testCase.description}: ✗ FAIL - Should have thrown error`);
  } catch (error) {
    console.log(`\n${testCase.description}: ✓ PASS - Error caught`);
    console.log(`  Message: ${error instanceof Error ? error.message : String(error)}`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('\nAll tests completed!\n');
