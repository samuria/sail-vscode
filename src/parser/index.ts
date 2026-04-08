export { Token, TokenText, TokenInfo, TOKEN_INFO } from './tokens';
export { tokenize } from './lexer';
export { Parser, SailDiagnostic } from './parser';

import { tokenize } from './lexer';
import { Parser, SailDiagnostic } from './parser';

export function validateSail(text: string): SailDiagnostic[] {
  if (!text || text.trim().length === 0) {
    return [];
  }
  const tokens = tokenize(text);
  const parser = new Parser(tokens);
  return parser.parse();
}
