export interface FormatterState {
  indentLevel: number;
  inBlockComment: boolean;
  inDoubleQuote: boolean;
  inSingleQuote: boolean;
  inTypeConstructor: boolean;
  suppressCommas: boolean;
  position: number;
  compactGroupDepth: number;
}