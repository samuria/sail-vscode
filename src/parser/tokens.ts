export enum Token {
  OPEN_PAREN = 'OPEN_PAREN',
  CLOSE_PAREN = 'CLOSE_PAREN',
  OPEN_BRACKET = 'OPEN_BRACKET',
  CLOSE_BRACKET = 'CLOSE_BRACKET',
  OPEN_BRACE = 'OPEN_BRACE',
  CLOSE_BRACE = 'CLOSE_BRACE',
  HASH = 'HASH',
  CACHE = 'CACHE',
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  DOT = 'DOT',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  POWER = 'POWER',
  PERCENT = 'PERCENT',
  AMPERSAND = 'AMPERSAND',
  UNDERSCORE = 'UNDERSCORE',
  LSHIFT = 'LSHIFT',
  LAMBDA = 'LAMBDA',
  LT = 'LT',
  LE = 'LE',
  GT = 'GT',
  GE = 'GE',
  EQ = 'EQ',
  NE = 'NE',
  EL = 'EL',
  EG = 'EG',
  NEQ = 'NEQ',
  COMMA = 'COMMA',
  SEMICOLON = 'SEMICOLON',
  RANGE = 'RANGE',
  ANNOTATION = 'ANNOTATION',
  ASSIGN = 'ASSIGN',
  ASSIGN_PLUS = 'ASSIGN_PLUS',
  ASSIGN_MINUS = 'ASSIGN_MINUS',
  ASSIGN_MULTIPLY = 'ASSIGN_MULTIPLY',
  ASSIGN_DIVIDE = 'ASSIGN_DIVIDE',
  ASSIGN_POWER = 'ASSIGN_POWER',
  ASSIGN_CONCAT = 'ASSIGN_CONCAT',

  NUMBER = 'NUMBER',
  STRING = 'STRING',
  IDENTIFIER = 'IDENTIFIER',
  EOF = 'EOF',
}

export interface TokenInfo {
  text: string;
  assignment: boolean;
  comparison: boolean;
  node?: string;
}

export const TOKEN_INFO: Record<string, TokenInfo> = {
  [Token.OPEN_PAREN]:      { text: '(',  assignment: false, comparison: false },
  [Token.CLOSE_PAREN]:     { text: ')',  assignment: false, comparison: false },
  [Token.OPEN_BRACKET]:    { text: '[',  assignment: false, comparison: false },
  [Token.CLOSE_BRACKET]:   { text: ']',  assignment: false, comparison: false },
  [Token.OPEN_BRACE]:      { text: '{',  assignment: false, comparison: false },
  [Token.CLOSE_BRACE]:     { text: '}',  assignment: false, comparison: false },
  [Token.HASH]:            { text: '#',  assignment: false, comparison: false },
  [Token.CACHE]:           { text: '~',  assignment: false, comparison: false },
  [Token.PLUS]:            { text: '+',  assignment: false, comparison: false },
  [Token.MINUS]:           { text: '-',  assignment: false, comparison: false },
  [Token.DOT]:             { text: '.',  assignment: false, comparison: false },
  [Token.MULTIPLY]:        { text: '*',  assignment: false, comparison: false },
  [Token.DIVIDE]:          { text: '/',  assignment: false, comparison: false },
  [Token.POWER]:           { text: '^',  assignment: false, comparison: false },
  [Token.PERCENT]:         { text: '%',  assignment: false, comparison: false },
  [Token.AMPERSAND]:       { text: '&',  assignment: false, comparison: false },
  [Token.UNDERSCORE]:      { text: '_',  assignment: false, comparison: false },
  [Token.LSHIFT]:          { text: '<<', assignment: false, comparison: false },
  [Token.LAMBDA]:          { text: '->', assignment: false, comparison: false },
  [Token.LT]:              { text: '<',  assignment: false, comparison: true },
  [Token.LE]:              { text: '<=', assignment: false, comparison: true },
  [Token.GT]:              { text: '>',  assignment: false, comparison: true },
  [Token.GE]:              { text: '>=', assignment: false, comparison: true },
  [Token.EQ]:              { text: '=',  assignment: false, comparison: true },
  [Token.NE]:              { text: '<>', assignment: false, comparison: true },
  [Token.EL]:              { text: '=<', assignment: false, comparison: true },
  [Token.EG]:              { text: '=>', assignment: false, comparison: true },
  [Token.NEQ]:             { text: '><', assignment: false, comparison: true },
  [Token.COMMA]:           { text: ',',  assignment: false, comparison: false },
  [Token.SEMICOLON]:       { text: ';',  assignment: false, comparison: false },
  [Token.RANGE]:           { text: '..', assignment: false, comparison: false },
  [Token.ANNOTATION]:      { text: '`',  assignment: false, comparison: false },
  [Token.ASSIGN]:          { text: ':',  assignment: true,  comparison: false, node: 'assign' },
  [Token.ASSIGN_PLUS]:     { text: '+:', assignment: true,  comparison: false, node: 'assign_add' },
  [Token.ASSIGN_MINUS]:    { text: '-:', assignment: true,  comparison: false, node: 'assign_sub' },
  [Token.ASSIGN_MULTIPLY]: { text: '*:', assignment: true,  comparison: false, node: 'assign_mul' },
  [Token.ASSIGN_DIVIDE]:   { text: '/:', assignment: true,  comparison: false, node: 'assign_div' },
  [Token.ASSIGN_POWER]:    { text: '^:', assignment: true,  comparison: false, node: 'assign_pow' },
  [Token.ASSIGN_CONCAT]:   { text: '&:', assignment: true,  comparison: false, node: 'assign_cat' },
};

export interface TokenText {
  token: Token;
  value: string;
  line: number;        // 1-based
  column: number;      // 0-based
  endLine: number;     // 1-based
  endColumn: number;   // 0-based
}
