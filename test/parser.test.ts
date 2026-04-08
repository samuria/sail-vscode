import { validateSail, tokenize, Token } from '../src/parser';

// ─── helpers ────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function expect(label: string, condition: boolean): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(label);
    console.log(`  FAIL: ${label}`);
  }
}

function expectValid(label: string, input: string): void {
  const result = validateSail(input);
  expect(label, result.length === 0);
  if (result.length > 0) {
    console.log(`        got: ${result.map(d => d.message).join('; ')}`);
  }
}

function expectError(label: string, input: string, messagePart?: string): void {
  const result = validateSail(input);
  const hasError = result.length > 0;
  if (messagePart) {
    const hasMatch = result.some(d => d.message.includes(messagePart));
    expect(label, hasError && hasMatch);
    if (!hasMatch && hasError) {
      console.log(`        expected message containing "${messagePart}"`);
      console.log(`        got: ${result.map(d => d.message).join('; ')}`);
    }
  } else {
    expect(label, hasError);
  }
}

function expectTokens(label: string, input: string, expected: Token[]): void {
  const tokens = tokenize(input);
  const actual = tokens.map(t => t.token).filter(t => t !== Token.EOF);
  const match = actual.length === expected.length && actual.every((t, i) => t === expected[i]);
  expect(label, match);
  if (!match) {
    console.log(`        expected: ${expected.join(', ')}`);
    console.log(`        got:      ${actual.join(', ')}`);
  }
}

// ─── lexer tests ────────────────────────────────────────────────────

console.log('\n=== lexer ===\n');

expectTokens('empty string', '', []);

expectTokens('single number', '42', [Token.NUMBER]);

expectTokens('decimal number', '3.14', [Token.NUMBER]);

expectTokens('simple addition', '1 + 2', [Token.NUMBER, Token.PLUS, Token.NUMBER]);

expectTokens('string literal', '"hello"', [Token.STRING]);

expectTokens('identifier', 'foo', [Token.IDENTIFIER]);

expectTokens('domain identifier', 'a!localVariables', [Token.IDENTIFIER]);

expectTokens('rule reference', 'rule!myRule', [Token.IDENTIFIER]);

expectTokens('all the parens', '()[]{}', [
  Token.OPEN_PAREN, Token.CLOSE_PAREN,
  Token.OPEN_BRACKET, Token.CLOSE_BRACKET,
  Token.OPEN_BRACE, Token.CLOSE_BRACE,
]);

expectTokens('two char operators', '<= >= <> .. ->', [
  Token.LE, Token.GE, Token.NE, Token.RANGE, Token.LAMBDA,
]);

expectTokens('assignment operators', '+: -: *: /:', [
  Token.ASSIGN_PLUS, Token.ASSIGN_MINUS, Token.ASSIGN_MULTIPLY, Token.ASSIGN_DIVIDE,
]);

expectTokens('colon is assign', ':', [Token.ASSIGN]);

expectTokens('semicolon', ';', [Token.SEMICOLON]);

expectTokens('block comment skipped', '/* what */ 1', [Token.NUMBER]);

expectTokens('multiline comment', '/* line1\nline2 */ 42', [Token.NUMBER]);

// this is how sail actually escapes strings, not with backslash
expectTokens('string with escaped quote', '"say \\"hi\\""', [Token.STRING]);

expectTokens('record type lor as single token', 'recordType!{abc-123}MyRecord.fields.{def-456}name', [
  Token.IDENTIFIER,
]);

expectTokens('single quoted identifier', "'type!{abc}Foo'", [Token.IDENTIFIER]);

expectTokens('number before range', '1..10', [Token.NUMBER, Token.RANGE, Token.NUMBER]);

// i have no idea why underscore is its own token but here we are
expectTokens('underscore is a token', '_', [Token.UNDERSCORE]);

expectTokens('hash', '#', [Token.HASH]);

expectTokens('comparison operators', '< > = <> >< =< =>', [
  Token.LT, Token.GT, Token.EQ, Token.NE, Token.NEQ, Token.EL, Token.EG,
]);

// line tracking
(() => {
  const tokens = tokenize('1\n+\n2');
  const lines = tokens.filter(t => t.token !== Token.EOF).map(t => t.line);
  expect('line tracking across newlines', lines[0] === 1 && lines[1] === 2 && lines[2] === 3);
})();

// ─── parser: valid expressions ──────────────────────────────────────

console.log('\n=== parser: valid ===\n');

expectValid('number literal', '42');
expectValid('negative number', '-5');
expectValid('decimal', '3.14');
expectValid('string literal', '"hello world"');
expectValid('true', 'true');
expectValid('false', 'false');
expectValid('null', 'null');

expectValid('addition', '1 + 2');
expectValid('subtraction', '10 - 3');
expectValid('multiplication', '2 * 3');
expectValid('division', '10 / 2');
expectValid('power', '2 ^ 8');
expectValid('modulo/percent', '50%');
expectValid('string concat', '"a" & "b"');
expectValid('comparison eq', '1 = 1');
expectValid('comparison ne', '1 <> 2');
expectValid('comparison lt', '1 < 2');
expectValid('comparison le', '1 <= 2');
expectValid('comparison gt', '2 > 1');
expectValid('comparison ge', '2 >= 1');
expectValid('range', '1..10');
expectValid('chained arithmetic', '1 + 2 * 3 - 4 / 2');

expectValid('parenthesized', '(1 + 2)');
expectValid('nested parens', '((1 + 2) * 3)');
expectValid('empty list', '{}');
expectValid('list literal', '{1, 2, 3}');
expectValid('nested list', '{{1, 2}, {3, 4}}');

expectValid('function call no args', 'today()');
expectValid('function call one arg', 'fn!tostring(42)');
expectValid('function call multi args', 'if(true, "yes", "no")');
expectValid('domain function', 'a!localVariables(local!x: 1, local!x)');
expectValid('rule reference call', 'rule!myRule(ri!input)');
expectValid('keyword args', 'a!textField(label: "name", value: local!val)');
expectValid('nested function calls', 'a!localVariables(local!x: fn!len("test"), local!x + 1)');

expectValid('dot access', 'local!map.field');
expectValid('chained dots', 'local!a.b.c');
expectValid('index access', 'local!list[1]');
expectValid('index with expression', 'local!list[local!i + 1]');
expectValid('dot then index', 'local!map.items[0]');

expectValid('record type reference', 'recordType!{abc-123}MyRecord.fields.{def-456}name');
expectValid('single quoted type', "'type!{abc}Number'");

// the parser is intentionally lenient about these, just like the real one
expectValid('trailing plus (lenient)', '1 +');
expectValid('trailing minus (lenient)', '1 -');
expectValid('trailing multiply (lenient)', '1 *');
expectValid('trailing ampersand (lenient)', '"x" &');

expectValid('block comment before expression', '/* comment */ 1 + 2');
expectValid('block comment mid expression', '1 + /* surprise */ 2');

expectValid('semicolon separated', '1; 2; 3');
expectValid('statement list in braces', '{local!x: 1; local!x + 1}');

expectValid('assignment', 'local!x: 42');
expectValid('plus assign', 'local!x +: 1');

expectValid('lambda', 'fn!apply(local!x, {1, 2, 3})');

expectValid('complex real world expression', `
  a!localVariables(
    local!items: {1, 2, 3, 4, 5},
    local!filtered: a!forEach(
      items: local!items,
      expression: if(fv!item > 2, fv!item, null)
    ),
    a!gridField(
      label: "my grid",
      data: local!filtered,
      columns: {
        a!gridColumn(label: "value", value: fv!item)
      }
    )
  )
`);

// ─── parser: errors ─────────────────────────────────────────────────

console.log('\n=== parser: errors ===\n');

expectError('unmatched close paren', '1 + 2)', 'Unmatched close parenthesis');
expectError('unmatched close bracket', '1]', 'Unmatched close bracket');
expectError('unmatched close brace', '1}', 'Unmatched close brace');
expectError('unclosed paren', '(1 + 2', 'not closed');
expectError('unclosed function call', 'fn!tostring(', 'not closed');
expectError('empty parens', '()', 'Unexpected empty parentheses');
expectError('hash is not valid', '#test', '# symbol is not a valid operator');
expectError('missing close paren nested', '((1 + 2)', 'not closed');
expectError('empty index', 'local!x[]', 'no indices');

// the parser should recover and keep going after errors
expectError('multiple errors', '() #', 'Unexpected empty parentheses');
(() => {
  const result = validateSail('() #');
  expect('multiple errors found both', result.length >= 2);
})();

// error position tracking
(() => {
  const result = validateSail('1 + 2)');
  expect('error on correct line', result.length > 0 && result[0].line === 0);
  expect('error on correct column', result.length > 0 && result[0].startCol === 5);
})();

(() => {
  const result = validateSail('1\n2\n)');
  // the ) is the second error (first is the unexpected 2), and it's on 0-based line 2
  const parenError = result.find(d => d.message.includes('Unmatched close parenthesis'));
  expect('multiline error on line 3', parenError !== undefined && parenError.line === 2);
})();

// junk that should definitely not pass
expectError('random garbage', 'asdf)qwer{{}+', 'Unmatched close parenthesis');

// ─── edge cases ─────────────────────────────────────────────────────

console.log('\n=== edge cases ===\n');

// the kind of stuff that would make you question reality
expectValid('empty string input', '');
expectValid('only whitespace', '   \n\t  ');
expectValid('only a comment', '/* nothing to see here */');
expectValid('deeply nested', '((((((1))))))');
expectValid('many commas in list', '{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}');
expectValid('function returning function', 'a!localVariables(local!fn: rule!getFn(), local!fn())');
expectValid('consecutive dots', 'local!a.b.c.d.e');
expectValid('index chain', 'local!a[1][2][3]');

// ─── results ────────────────────────────────────────────────────────

console.log(`\n${'='.repeat(50)}`);
console.log(`${passed}/${passed + failed} tests passed`);
if (failures.length > 0) {
  console.log(`\nfailures:`);
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
  process.exit(1);
}
console.log('');
