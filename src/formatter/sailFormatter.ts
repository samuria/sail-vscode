import { FormatterState } from './types';

const TYPE_START = 'type!{';
const SMALL_FUNCTION_WIDTH = 40;
const INDENT = '  ';
const NIL_CHAR = '\0';

export class SailFormatter {
  private text: string;

  private state: FormatterState = {
    indentLevel: 0,
    inBlockComment: false,
    inDoubleQuote: false,
    inSingleQuote: false,
    inTypeConstructor: false,
    suppressCommas: false,
    position: 0,
    compactGroupDepth: 0
  };

  constructor(expression: string) {
    this.text = expression.replace(/\t/g, INDENT);
  }

  public format(): string {
    while (this.state.position < this.text.length) {
      const prevChar = this.current(-1);
      const currentChar = this.current();
      const nextChar = this.current(1);

      // track formatter modes so spacing rules do not run inside literal regions.
      if (this.isStartOfDoubleQuote(currentChar)) {
        this.state.inDoubleQuote = !this.state.inDoubleQuote;
      } else if (this.isStartOfSingleQuote(currentChar)) {
        this.state.inSingleQuote = !this.state.inSingleQuote;
      } else if (this.isStartOfBlockComment(currentChar, nextChar)) {
        this.state.inBlockComment = true;
        this.advance(2);
        continue;
      } else if (this.isEndOfBlockComment(currentChar, nextChar)) {
        this.state.inBlockComment = false;
        this.advance(2);
        if (this.isFollowedByNewLine(this.state.position)) {
          const indentation = this.indentation(this.state.indentLevel);
          this.insert(indentation, this.state.position);
          this.advance(indentation.length);
        }
        continue;
      } else if (this.isStartOfTypeConstructor(this.text.substring(this.state.position))) {
        this.state.inTypeConstructor = true;
        this.advance(TYPE_START.length);
        continue;
      } else if (this.isEndOfTypeConstructor(currentChar)) {
        this.advance();
        this.state.inTypeConstructor = false;
        continue;
      }

      this.parseRegularCharacter(prevChar, currentChar);
      this.advance();
    }

    this.text = this.text.replace(/\((\s)+\)/g, '()');
    this.text = this.text.replace(/\{(\s)+\}/g, '{}');
    return this.text.trim();
  }

  private parseRegularCharacter(prevChar: string, currentChar: string): void {
    if (!this.isRegularFormattingZone()) {
      return;
    }

    if (this.isWhitespace(currentChar)) {
      this.remove(this.state.position);
      this.advance(-1);
      return;
    }

    if (this.isBracket(currentChar)) {
      this.state.suppressCommas = currentChar === '[';
      return;
    }

    if (this.isOpeningCharacter(currentChar)) {
      const closeDistance = this.findCloseDistance(this.state.position);
      // keep short groups inline and expand longer groups across lines.
      if (closeDistance < SMALL_FUNCTION_WIDTH) {
        this.state.compactGroupDepth += 1;
        if (currentChar === '{') {
          this.insert(' ', this.state.position + 1);
          this.advance(1);
        }
      } else {
        this.state.indentLevel += 1;
        const indentation = this.indentation(this.state.indentLevel);
        this.insert(indentation, this.state.position + 1);
        this.advance(indentation.length);
      }
      return;
    }

    if (this.isClosingCharacter(currentChar)) {
      if (this.state.compactGroupDepth > 0) {
        this.state.compactGroupDepth -= 1;
        if (currentChar === '}') {
          this.insert(' ', this.state.position);
          this.advance(1);
        }
      } else {
        this.state.indentLevel -= 1;
        const indentation = this.indentation(this.state.indentLevel);
        this.insert(indentation, this.state.position);
        this.advance(indentation.length);
      }
      return;
    }

    if (currentChar === ',') {
      const separator = this.state.suppressCommas || this.state.compactGroupDepth > 0
        ? ' '
        : this.indentation(this.state.indentLevel);
      this.insert(separator, this.state.position + 1);
      this.advance(separator.length);
      return;
    }

    if (this.isOperator(currentChar)) {
      if (!this.isWhitespace(prevChar)) {
        this.insert(' ', this.state.position);
        this.advance(1);
      }

      if (this.isOperator(this.current(1)) || this.current(1) === ':') {
        this.advance(1);
      }

      if (!this.isStartOfBlockComment(this.current(), this.current(1))) {
        this.insert(' ', this.state.position + 1);
        this.advance(1);
      } else {
        this.insert(' ', this.state.position);
        this.advance(2);
        this.state.inBlockComment = true;
      }
      return;
    }

    if (currentChar === ':') {
      this.insert(' ', this.state.position + 1);
      this.advance(1);
    }
  }

  private findCloseDistance(start: number): number {
    let openCount = 1;
    let nonWhitespaceChars = 0;
    let inQuote = false;

    // stop scanning once we know the group is too long for inline formatting.
    for (let i = start + 1; nonWhitespaceChars < SMALL_FUNCTION_WIDTH && i < this.text.length; i += 1) {
      const char = this.text.charAt(i);
      const nextChar = this.text.charAt(i + 1);

      if (inQuote) {
        nonWhitespaceChars += 1;
        if (char === '"') {
          inQuote = false;
        }
        continue;
      }

      if (char === '"') {
        inQuote = true;
        nonWhitespaceChars += 1;
      } else if (this.isStartOfBlockComment(char, nextChar)) {
        return SMALL_FUNCTION_WIDTH;
      } else if (this.isOpeningCharacter(char)) {
        openCount += 1;
        nonWhitespaceChars += 1;
      } else if (this.isClosingCharacter(char)) {
        openCount -= 1;
        nonWhitespaceChars += 1;
        if (openCount === 0) {
          return nonWhitespaceChars;
        }
      } else if (!this.isWhitespace(char)) {
        nonWhitespaceChars += 1;
      }
    }

    return SMALL_FUNCTION_WIDTH;
  }

  private current(offset = 0): string {
    const index = this.state.position + offset;
    if (index < 0 || index >= this.text.length) {
      return NIL_CHAR;
    }
    return this.text.charAt(index);
  }

  private advance(step = 1): void {
    this.state.position += step;
  }

  private insert(value: string, index: number): void {
    this.text = this.text.substring(0, index) + value + this.text.substring(index);
  }

  private remove(index: number): void {
    this.text = this.text.substring(0, index) + this.text.substring(index + 1);
  }

  private indentation(level: number): string {
    return `\n${INDENT.repeat(level)}`;
  }

  private isRegularFormattingZone(): boolean {
    return !this.state.inDoubleQuote
      && !this.state.inBlockComment
      && !this.state.inSingleQuote
      && !this.state.inTypeConstructor;
  }

  private isWhitespace(value: string): boolean {
    return /\s/.test(value);
  }

  private isOpeningCharacter(char: string): boolean {
    return char === '(' || char === '{';
  }

  private isClosingCharacter(char: string): boolean {
    return char === ')' || char === '}';
  }

  private isBracket(char: string): boolean {
    return char === '[' || char === ']';
  }

  private isOperator(char: string): boolean {
    return /[&><=+\-/*]/.test(char);
  }

  private isStartOfTypeConstructor(value: string): boolean {
    return value.startsWith(TYPE_START)
      && !this.state.inSingleQuote
      && !this.state.inBlockComment
      && !this.state.inDoubleQuote;
  }

  private isEndOfTypeConstructor(char: string): boolean {
    return this.state.inTypeConstructor && char === '}';
  }

  private isFollowedByNewLine(index: number): boolean {
    return index < this.text.length && (this.text.charAt(index) === '\r' || this.text.charAt(index) === '\n');
  }

  private isEndOfBlockComment(currentChar: string, nextChar: string): boolean {
    return currentChar === '*'
      && nextChar === '/'
      && !this.state.inDoubleQuote
      && !this.state.inSingleQuote
      && !this.state.inTypeConstructor;
  }

  private isStartOfBlockComment(currentChar: string, nextChar: string): boolean {
    return currentChar === '/'
      && nextChar === '*'
      && !this.state.inDoubleQuote
      && !this.state.inSingleQuote
      && !this.state.inTypeConstructor;
  }

  private isStartOfSingleQuote(char: string): boolean {
    return char === '\''
      && !this.state.inDoubleQuote
      && !this.state.inBlockComment
      && !this.state.inTypeConstructor;
  }

  private isStartOfDoubleQuote(char: string): boolean {
    return char === '"'
      && !this.state.inSingleQuote
      && !this.state.inBlockComment
      && !this.state.inTypeConstructor;
  }
}