import { Token, TokenText, TOKEN_INFO } from './tokens';

export interface SailDiagnostic {
  message: string;
  line: number;      // 0-based for vscode
  startCol: number;  // 0-based
  endCol: number;    // 0-based
  severity: 'error' | 'warning';
}

export class Parser {
  private tokens: TokenText[];
  private pos: number;
  private diagnostics: SailDiagnostic[] = [];

  constructor(tokens: TokenText[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  parse(): SailDiagnostic[] {
    this.diagnostics = [];
    if (this.tokens.length === 0 || (this.tokens.length === 1 && this.tokens[0].token === Token.EOF)) {
      return this.diagnostics;
    }
    this.rootExpression();

    // anything left over after parsing is suspicious
    while (!this.atEnd()) {
      const leftover = this.current();
      if (leftover.token === Token.CLOSE_PAREN) {
        this.addError('Unmatched close parenthesis )', leftover);
      } else if (leftover.token === Token.CLOSE_BRACKET) {
        this.addError('Unmatched close bracket ]', leftover);
      } else if (leftover.token === Token.CLOSE_BRACE) {
        this.addError('Unmatched close brace }', leftover);
      } else if (this.isAssignment(leftover)) {
        this.addError('The Expression is missing', leftover);
      } else {
        this.addError(`Invalid symbol found (${leftover.token.toLowerCase()})`, leftover);
      }
      this.advance();
    }

    return this.diagnostics;
  }

  private current(): TokenText {
    return this.tokens[this.pos] ?? this.tokens[this.tokens.length - 1];
  }

  private peek(offset = 0): TokenText {
    const idx = this.pos + offset;
    return this.tokens[idx] ?? this.tokens[this.tokens.length - 1];
  }

  private remaining(): number {
    return this.tokens.length - this.pos;
  }

  private atEnd(): boolean {
    return this.pos >= this.tokens.length || this.current().token === Token.EOF;
  }

  private advance(): TokenText {
    const tok = this.current();
    if (!this.atEnd()) {
      this.pos++;
    }
    return tok;
  }

  private check(token: Token): boolean {
    return !this.atEnd() && this.current().token === token;
  }

  private match(token: Token): boolean {
    if (this.check(token)) {
      this.advance();
      return true;
    }
    return false;
  }

  private addError(message: string, tok?: TokenText): void {
    const t = tok ?? this.current();
    this.diagnostics.push({
      message,
      line: t.line - 1,
      startCol: t.column,
      endCol: Math.max(t.endColumn, t.column + 1),
      severity: 'error',
    });
  }

  private isAssignment(tok: TokenText): boolean {
    const info = TOKEN_INFO[tok.token];
    return info !== undefined && info.assignment;
  }

  // root: statements separated by semicolons
  private rootExpression(): void {
    if (this.atEnd()) { return; }
    this.assignmentExpression();
    while (this.match(Token.SEMICOLON)) {
      if (!this.atEnd()) {
        this.assignmentExpression();
      }
    }
  }

  // assignment is right-to-left
  private assignmentExpression(): void {
    this.equalityExpression();
    if (!this.atEnd() && this.isAssignment(this.current())) {
      this.advance();
      if (!this.atEnd()) {
        this.assignmentExpression();
      }
    }
  }

  private equalityExpression(): void {
    this.greaterExpression();
    this.equalityExpressionA();
  }

  private equalityExpressionA(): void {
    if (this.atEnd()) { return; }
    const tok = this.current();
    if (tok.token === Token.EQ || tok.token === Token.NE || tok.token === Token.NEQ) {
      this.advance();
      if (this.remaining() < 1) { return; }
      this.greaterExpression();
      this.equalityExpressionA();
    }
  }

  private greaterExpression(): void {
    this.lesserExpression();
    this.greaterExpressionA();
  }

  private greaterExpressionA(): void {
    if (this.atEnd()) { return; }
    const tok = this.current();
    if (tok.token === Token.GT || tok.token === Token.GE || tok.token === Token.EG) {
      this.advance();
      if (this.remaining() < 1) { return; }
      this.lesserExpression();
      this.greaterExpressionA();
    }
  }

  private lesserExpression(): void {
    this.concatExpression();
    this.lesserExpressionA();
  }

  private lesserExpressionA(): void {
    if (this.atEnd()) { return; }
    const tok = this.current();
    if (tok.token === Token.LT || tok.token === Token.LE || tok.token === Token.EL) {
      this.advance();
      if (this.remaining() < 1) { return; }
      this.concatExpression();
      this.lesserExpressionA();
    }
  }

  private concatExpression(): void {
    this.addExpression();
    this.concatExpressionA();
  }

  private concatExpressionA(): void {
    if (this.atEnd()) { return; }
    if (this.current().token === Token.AMPERSAND) {
      this.advance();
      if (this.remaining() < 1) { return; }
      this.addExpression();
      this.concatExpressionA();
    }
  }

  private addExpression(): void {
    this.mulExpression();
    this.addExpressionA();
  }

  // trailing operators silently ignored when nothing follows (yes, really)
  private addExpressionA(): void {
    if (this.atEnd()) { return; }
    const tok = this.current();
    if (tok.token === Token.PLUS || tok.token === Token.MINUS || tok.token === Token.RANGE) {
      this.advance();
      if (this.remaining() < 1) { return; }
      this.mulExpression();
      this.addExpressionA();
    }
  }

  private mulExpression(): void {
    this.powerExpression();
    this.mulExpressionA();
  }

  private mulExpressionA(): void {
    if (this.atEnd()) { return; }
    const tok = this.current();
    if (tok.token === Token.MULTIPLY || tok.token === Token.DIVIDE) {
      this.advance();
      if (this.remaining() < 1) { return; }
      this.powerExpression();
      this.mulExpressionA();
    }
  }

  private powerExpression(): void {
    this.negateExpression();
    this.powerExpressionA();
  }

  private powerExpressionA(): void {
    if (this.atEnd()) { return; }
    if (this.current().token === Token.POWER) {
      this.advance();
      if (this.remaining() < 1) { return; }
      this.negateExpression();
      this.powerExpressionA();
    }
  }

  private negateExpression(): void {
    if (this.check(Token.MINUS)) {
      this.advance();
      this.negateExpression();
    } else {
      this.percentExpression();
    }
  }

  private percentExpression(): void {
    this.primaryExpression();
    if (this.check(Token.PERCENT)) {
      this.advance();
    }
  }

  private primaryExpression(): void {
    if (this.atEnd()) { return; }

    const tok = this.current();

    switch (tok.token) {
      case Token.OPEN_PAREN: {
        this.advance();
        if (this.check(Token.CLOSE_PAREN)) {
          this.addError('Unexpected empty parentheses', tok);
          this.advance();
          break;
        }
        if (this.atEnd()) {
          this.addError('Parenthesized expression not closed (expression ends before finding right parenthesis).', tok);
          break;
        }
        this.rootExpression();
        if (this.check(Token.CLOSE_PAREN)) {
          this.advance();
        } else if (this.atEnd()) {
          this.addError('Parenthesized expression not closed (expression ends before finding right parenthesis).', tok);
        } else {
          this.addError(`Missing right parenthesis in expression, found ${this.current().value}`, this.current());
        }
        break;
      }

      case Token.CLOSE_PAREN: {
        this.addError('Unmatched close parenthesis )', tok);
        this.advance();
        break;
      }

      case Token.OPEN_BRACE: {
        this.advance();
        if (this.check(Token.CLOSE_BRACE)) {
          this.advance();
          break;
        }
        if (this.atEnd()) {
          this.addError('Could not create list, no elements present after open brace.', tok);
          break;
        }
        this.rootExpression();
        while (this.match(Token.COMMA)) {
          if (!this.atEnd() && !this.check(Token.CLOSE_BRACE)) {
            this.rootExpression();
          }
        }
        if (this.check(Token.CLOSE_BRACE)) {
          this.advance();
        }
        break;
      }

      case Token.NUMBER:
      case Token.STRING: {
        this.advance();
        break;
      }

      case Token.HASH: {
        this.addError('The # symbol is not a valid operator', tok);
        this.advance();
        break;
      }

      case Token.IDENTIFIER: {
        const identTok = this.advance();
        const name = identTok.value;
        if (name === 'true' || name === 'false' || name === 'null') {
          break;
        }
        if (this.check(Token.OPEN_PAREN)) {
          this.parseFunctionCall(identTok);
        }
        break;
      }

      case Token.ANNOTATION:
      case Token.CACHE: {
        this.advance();
        break;
      }

      default: {
        this.addError(`Invalid symbol found (${tok.token.toLowerCase()})`, tok);
        this.advance();
        break;
      }
    }

    this.postfixOps();
  }

  // indexing and dot access after any primary expression
  private postfixOps(): void {
    while (!this.atEnd()) {
      if (this.check(Token.OPEN_BRACKET)) {
        const bracketTok = this.advance();
        if (this.check(Token.CLOSE_BRACKET)) {
          this.addError('Could not index, no indices present after open bracket.', bracketTok);
          this.advance();
          continue;
        }
        if (this.atEnd()) {
          this.addError('Could not index, no indices present after open bracket.', bracketTok);
          break;
        }
        this.rootExpression();
        if (this.check(Token.CLOSE_BRACKET)) {
          this.advance();
        }
        continue;
      }

      if (this.check(Token.DOT)) {
        this.advance();
        if (this.check(Token.IDENTIFIER)) {
          this.advance();
        }
        continue;
      }

      break;
    }
  }

  private parseFunctionCall(nameTok: TokenText): void {
    const openParen = this.advance();
    if (this.check(Token.CLOSE_PAREN)) {
      this.advance();
      return;
    }
    if (this.atEnd()) {
      this.addError('Function parameter list not closed by close parenthesis.', openParen);
      return;
    }

    this.parseFunctionArg();
    while (this.match(Token.COMMA)) {
      if (!this.atEnd() && !this.check(Token.CLOSE_PAREN)) {
        this.parseFunctionArg();
      }
    }

    if (this.check(Token.CLOSE_PAREN)) {
      this.advance();
    } else {
      this.addError('Function parameter list not closed by close parenthesis.', openParen);
    }
  }

  // keyword args (name: value) just fall out of assignment parsing naturally
  private parseFunctionArg(): void {
    this.assignmentExpression();
  }
}
