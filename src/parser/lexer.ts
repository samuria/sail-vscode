import { Token, TokenText } from './tokens';

// two char ops checked first so <= doesn't become < then =
const TWO_CHAR_TOKENS: Record<string, Token> = {
  '<<': Token.LSHIFT,
  '->': Token.LAMBDA,
  '<=': Token.LE,
  '>=': Token.GE,
  '<>': Token.NE,
  '=<': Token.EL,
  '=>': Token.EG,
  '><': Token.NEQ,
  '..': Token.RANGE,
  '+:': Token.ASSIGN_PLUS,
  '-:': Token.ASSIGN_MINUS,
  '*:': Token.ASSIGN_MULTIPLY,
  '/:': Token.ASSIGN_DIVIDE,
  '^:': Token.ASSIGN_POWER,
  '&:': Token.ASSIGN_CONCAT,
};

const ONE_CHAR_TOKENS: Record<string, Token> = {
  '(': Token.OPEN_PAREN,
  ')': Token.CLOSE_PAREN,
  '[': Token.OPEN_BRACKET,
  ']': Token.CLOSE_BRACKET,
  '{': Token.OPEN_BRACE,
  '}': Token.CLOSE_BRACE,
  '#': Token.HASH,
  '~': Token.CACHE,
  '+': Token.PLUS,
  '-': Token.MINUS,
  '.': Token.DOT,
  '*': Token.MULTIPLY,
  '/': Token.DIVIDE,
  '^': Token.POWER,
  '%': Token.PERCENT,
  '&': Token.AMPERSAND,
  '_': Token.UNDERSCORE,
  '<': Token.LT,
  '>': Token.GT,
  '=': Token.EQ,
  ',': Token.COMMA,
  ';': Token.SEMICOLON,
  '`': Token.ANNOTATION,
  ':': Token.ASSIGN,
};

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isLetter(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

function isIdentStart(ch: string): boolean {
  return isLetter(ch);
}

function isIdentPart(ch: string): boolean {
  return isLetter(ch) || isDigit(ch) || ch === '_' || ch === '!';
}

export function tokenize(source: string): TokenText[] {
  const tokens: TokenText[] = [];
  let pos = 0;
  let line = 1;
  let col = 0;
  const len = source.length;

  function peek(offset = 0): string {
    const idx = pos + offset;
    return idx < len ? source[idx] : '';
  }

  function advance(): string {
    const ch = source[pos];
    pos++;
    if (ch === '\n') {
      line++;
      col = 0;
    } else {
      col++;
    }
    return ch;
  }

  function makeToken(token: Token, value: string, startLine: number, startCol: number): TokenText {
    return { token, value, line: startLine, column: startCol, endLine: line, endColumn: col };
  }

  while (pos < len) {
    const ch = source[pos];

    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      advance();
      continue;
    }

    // block comments only, sail has no line comments
    if (ch === '/' && peek(1) === '*') {
      advance();
      advance();
      while (pos < len) {
        if (source[pos] === '*' && peek(1) === '/') {
          advance();
          advance();
          break;
        }
        advance();
      }
      continue;
    }

    if (ch === '"') {
      const startLine = line;
      const startCol = col;
      advance();
      let str = '';
      while (pos < len && source[pos] !== '"') {
        if (source[pos] === '\\' && peek(1) === '"') {
          str += '\\"';
          advance();
          advance();
        } else {
          str += source[pos];
          advance();
        }
      }
      if (pos < len) {
        advance();
      }
      tokens.push(makeToken(Token.STRING, str, startLine, startCol));
      continue;
    }

    if (isDigit(ch)) {
      const startLine = line;
      const startCol = col;
      let num = '';
      while (pos < len && isDigit(source[pos])) {
        num += source[pos];
        advance();
      }
      // decimal part, but not if next char is also a dot (that's range ..)
      if (pos < len && source[pos] === '.' && peek(1) !== '.') {
        num += source[pos];
        advance();
        while (pos < len && isDigit(source[pos])) {
          num += source[pos];
          advance();
        }
      }
      tokens.push(makeToken(Token.NUMBER, num, startLine, startCol));
      continue;
    }

    if (isIdentStart(ch)) {
      const startLine = line;
      const startCol = col;
      let ident = '';
      while (pos < len && isIdentPart(source[pos])) {
        ident += source[pos];
        advance();
      }
      // domain prefix followed by {uuid} means we're in a literal object reference
      // consume the whole thing as one token so the parser doesn't choke on uuids
      if (ident.includes('!') && pos < len && source[pos] === '{') {
        while (pos < len) {
          if (source[pos] === '{') {
            ident += source[pos];
            advance();
            while (pos < len && source[pos] !== '}') {
              ident += source[pos];
              advance();
            }
            if (pos < len && source[pos] === '}') {
              ident += source[pos];
              advance();
            }
          }
          while (pos < len && (isIdentPart(source[pos]) || source[pos] === '\'' || source[pos] === ' ')) {
            if (source[pos] === ' ') {
              // spaces are allowed in lor display names like "My Record Type"
              if (ident.includes('!')) {
                ident += source[pos];
                advance();
              } else {
                break;
              }
            } else {
              ident += source[pos];
              advance();
            }
          }
          // dot continues the lor path (e.g. .fields.{uuid}name)
          if (pos < len && source[pos] === '.' && pos + 1 < len && source[pos + 1] !== '.') {
            ident += source[pos];
            advance();
          } else {
            break;
          }
        }
      }

      // single quotes can appear in identifier names
      if (pos < len && source[pos] === '\'') {
        while (pos < len && (isIdentPart(source[pos]) || source[pos] === '\'' || source[pos] === ' ')) {
          if (source[pos] === ' ') {
            if (ident.includes('!')) {
              ident += source[pos];
              advance();
            } else {
              break;
            }
          } else {
            ident += source[pos];
            advance();
          }
        }
      }
      tokens.push(makeToken(Token.IDENTIFIER, ident, startLine, startCol));
      continue;
    }

    // single-quoted identifiers like 'type!{uuid}Whatever'
    if (ch === '\'') {
      const startLine = line;
      const startCol = col;
      advance();
      let ident = '\'';
      while (pos < len && source[pos] !== '\'') {
        ident += source[pos];
        advance();
      }
      if (pos < len) {
        ident += source[pos];
        advance();
      }
      tokens.push(makeToken(Token.IDENTIFIER, ident, startLine, startCol));
      continue;
    }

    if (pos + 1 < len) {
      const twoChar = source[pos] + source[pos + 1];
      const twoCharToken = TWO_CHAR_TOKENS[twoChar];
      if (twoCharToken !== undefined) {
        const startLine = line;
        const startCol = col;
        advance();
        advance();
        tokens.push(makeToken(twoCharToken, twoChar, startLine, startCol));
        continue;
      }
    }

    const oneCharToken = ONE_CHAR_TOKENS[ch];
    if (oneCharToken !== undefined) {
      const startLine = line;
      const startCol = col;
      advance();
      tokens.push(makeToken(oneCharToken, ch, startLine, startCol));
      continue;
    }

    // mystery character, just skip it
    advance();
  }

  tokens.push({ token: Token.EOF, value: '', line, column: col, endLine: line, endColumn: col });
  return tokens;
}
