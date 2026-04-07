const vscode = require('vscode');

/**
 * SAIL expression formatter for Appian SAIL code.
 */
const TYPE_START = 'type!{';
const SMALL_FUNCTION_WIDTH = 40;

let state;

function formatSail(expression) {
  state = {
    indentLevel: 0,
    isComment: false,
    isQuote: false,
    isSingleQuote: false,
    isTypeConstructor: false,
    suppressCommas: false,
    insert: null,
    position: 0,
    smallFunctionCount: 0
  };

  var string = expression.replace(/\t/g, '  ');

  while (state.position < string.length) {
    var prevChar = state.position > 0 ? string.charAt(state.position - 1) : '\0';
    var currentChar = string.charAt(state.position);
    var nextChar = state.position < string.length - 1 ? string.charAt(state.position + 1) : '\0';

    if (isStartOfQuote(currentChar)) {
      state.isQuote = !state.isQuote;
    } else if (isStartOfSingleQuote(currentChar)) {
      state.isSingleQuote = !state.isSingleQuote;
    } else if (isStartOfComment(currentChar, nextChar)) {
      state.isComment = true;
      state.position += 1;
      continue;
    } else if (isEndOfComment(currentChar, nextChar)) {
      state.isComment = false;
      state.position += 2;
      if (isFollowedByNewLine(string, state.position)) {
        state.insert = getSpaces(state.indentLevel);
        string = insertTextAtIndex(string, state.insert, state.position);
        state.position += state.insert.length;
      }
      continue;
    } else if (isStartOfTypeConstructor(string.substring(state.position))) {
      state.isTypeConstructor = true;
      state.position += TYPE_START.length;
      continue;
    } else if (isEndOfTypeConstructor(currentChar)) {
      state.position += 1;
      state.isTypeConstructor = false;
      continue;
    }

    string = parseNonSpecialText(string, prevChar, currentChar, nextChar);
    state.position += 1;
  }

  string = string.replace(/\((\s)+\)/g, '()');
  string = string.replace(/\{(\s)+\}/g, '{}');
  string = string.trim();
  return string;
}

function parseNonSpecialText(string, prevChar, currentChar, nextChar) {
  if (isNotSpecialText()) {
    if (isWhiteSpace(currentChar)) {
      string = string.substring(0, state.position) + string.substring(state.position + 1);
      state.position -= 1;
    } else if (isBrace(currentChar)) {
      state.suppressCommas = isOpenBrace(currentChar);
    } else if (isOpeningCharacter(currentChar)) {
      var closeDistance = findCloseDistance(string, state.position);
      if (closeDistance < SMALL_FUNCTION_WIDTH) {
        state.smallFunctionCount += 1;
        if (currentChar === '{') {
          state.insert = ' ';
          string = insertTextAtIndex(string, state.insert, state.position + 1);
          state.position += state.insert.length;
        }
      } else {
        state.indentLevel += 1;
        state.insert = getSpaces(state.indentLevel);
        string = insertTextAtIndex(string, state.insert, state.position + 1);
        state.position += state.insert.length;
      }
    } else if (isClosingCharacter(currentChar)) {
      if (state.smallFunctionCount > 0) {
        state.smallFunctionCount -= 1;
        if (currentChar === '}') {
          state.insert = ' ';
          string = insertTextAtIndex(string, state.insert, state.position);
          state.position += state.insert.length;
        }
      } else {
        state.indentLevel -= 1;
        state.insert = getSpaces(state.indentLevel);
        string = insertTextAtIndex(string, state.insert, state.position);
        state.position += state.insert.length;
      }
    } else if (currentChar === ',') {
      if (state.suppressCommas || state.smallFunctionCount > 0) {
        state.insert = ' ';
      } else {
        state.insert = getSpaces(state.indentLevel);
      }
      string = insertTextAtIndex(string, state.insert, state.position + 1);
      state.position += state.insert.length;
    } else if (isOpCharacter(currentChar)) {
      if (!isWhiteSpace(prevChar)) {
        string = insertTextAtIndex(string, ' ', state.position);
        state.position += 1;
      }
      if (isOpCharacter(string.charAt(state.position + 1)) || string.charAt(state.position + 1) === ':') {
        state.position += 1;
      }
      if (!isStartOfComment(string.charAt(state.position), string.charAt(state.position + 1))) {
        string = insertTextAtIndex(string, ' ', state.position + 1);
        state.position += 1;
      } else {
        string = insertTextAtIndex(string, ' ', state.position);
        state.position += 2;
        state.isComment = true;
      }
    } else if (currentChar === ':') {
      string = insertTextAtIndex(string, ' ', state.position + 1);
      state.position += 1;
    }
  }
  return string;
}

function findCloseDistance(string, start) {
  var openCount = 1;
  var nonWhitespaceCharsTraversed = 0;
  var inQuote = false;
  for (var i = start + 1; nonWhitespaceCharsTraversed < SMALL_FUNCTION_WIDTH && i < string.length; i++) {
    if (inQuote) {
      nonWhitespaceCharsTraversed += 1;
      if (string.charAt(i) === '"') {
        inQuote = false;
      }
    } else {
      if (string.charAt(i) === '"') {
        inQuote = true;
        nonWhitespaceCharsTraversed += 1;
      } else if (isStartOfComment(string.charAt(i), string.charAt(i + 1))) {
        return SMALL_FUNCTION_WIDTH;
      } else if (isOpeningCharacter(string.charAt(i))) {
        openCount += 1;
        nonWhitespaceCharsTraversed += 1;
      } else if (isClosingCharacter(string.charAt(i))) {
        openCount -= 1;
        nonWhitespaceCharsTraversed += 1;
        if (openCount === 0) {
          return nonWhitespaceCharsTraversed;
        }
      } else if (!isWhiteSpace(string.charAt(i))) {
        nonWhitespaceCharsTraversed += 1;
      }
    }
  }
  return SMALL_FUNCTION_WIDTH;
}

function getSpaces(integer) {
  var string = '\n';
  for (var i = 0; i < integer; i += 1) {
    string += '  ';
  }
  return string;
}

function isWhiteSpace(string) {
  return !!string.match(/\s/);
}

function isOpeningCharacter(char) {
  return char === '(' || char === '{';
}

function isClosingCharacter(char) {
  return char === ')' || char === '}';
}

function isOpenBrace(char) {
  return char === '[';
}

function isCloseBrace(char) {
  return char === ']';
}

function insertTextAtIndex(text, insert, position) {
  return text.substring(0, position) + insert + text.substring(position);
}

function isOpCharacter(char) {
  return !!char.match(/[&><=+\-\/*]/);
}

function isEndOfTypeConstructor(currentChar) {
  return state.isTypeConstructor && currentChar === '}';
}

function isStartOfTypeConstructor(string) {
  return string.startsWith(TYPE_START) && !state.isSingleQuote && !state.isComment &&
      !state.isQuote;
}

function isFollowedByNewLine(string, index) {
  return index < string.length && (string.charAt(index) === '\r' || string.charAt(index) === '\n');
}

function isEndOfComment(currentChar, nextChar) {
  return currentChar === '*' && nextChar === '/' && !state.isQuote && !state.isSingleQuote && !state.isTypeConstructor;
}

function isStartOfComment(currentChar, nextChar) {
  return currentChar === '/' && nextChar === '*' && !state.isQuote && !state.isSingleQuote && !state.isTypeConstructor;
}

function isStartOfSingleQuote(currentChar) {
  return currentChar === '\'' && !state.isQuote && !state.isComment && !state.isTypeConstructor;
}

function isStartOfQuote(currentChar) {
  return currentChar === '"' && !state.isSingleQuote && !state.isComment && !state.isTypeConstructor;
}

function isBrace(currentChar) {
  return isOpenBrace(currentChar) || isCloseBrace(currentChar);
}

function isNotSpecialText() {
  return !state.isQuote && !state.isComment && !state.isSingleQuote && !state.isTypeConstructor;
}

/**
 * VS Code formatter provider
 */
class SailFormattingProvider {
  provideDocumentFormattingEdits(document) {
    const text = document.getText();
    const formatted = formatSail(text);

    if (text === formatted) return [];

    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(text.length)
    );
    return [vscode.TextEdit.replace(fullRange, formatted)];
  }
}

function activate(context) {
  const formatter = vscode.languages.registerDocumentFormattingEditProvider(
    'sail',
    new SailFormattingProvider()
  );
  context.subscriptions.push(formatter);
}

function deactivate() {}

module.exports = { activate, deactivate, formatSail };
