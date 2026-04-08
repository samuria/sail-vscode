# sail-vscode

Syntax highlighting, formatting, and validation for Appian SAIL (.sail) files. Supports `a!`, `rule!`, `fn!`, `cons!` functions, all variable prefixes (`local!`, `ri!`, `fv!`, etc.), record type URNs, strings, comments, and more.

![Screenshot](images/screenshot.png)

## Features

### Syntax Highlighting

TextMate grammar for SAIL expressions. Colors functions, variables, record type references, strings, comments, operators, and keywords.

### Formatting

Auto-formats SAIL expressions with proper indentation. Trigger with `Shift+Option+F` (macOS) or `Shift+Alt+F` (Windows/Linux).

### Validation

local syntax validation that runs entirely in your editor with no server or api calls needed. errors show up as red squiggly underlines as you type. see [validation](#validation-1) below.

## Installation

### From .vsix file

1. Download the latest `.vsix` from the [releases page](https://github.com/samuria/sail-vscode/releases)
2. In VS Code, open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
3. Run "Extensions: Install from VSIX..." and select the file

### From source

1. Clone this repository
2. Run `npm install` and `npm run compile`
3. Symlink the folder into your VS Code extensions directory:
   - macOS/Linux: `~/.vscode/extensions/`
   - Windows: `%USERPROFILE%\.vscode\extensions\`
4. Restart VS Code

## Usage

Open any `.sail` file and syntax highlighting + validation will apply automatically.

To format a file, press `Shift+Option+F` (macOS) or `Shift+Alt+F` (Windows/Linux). You can also right-click in the editor and select "Format Document".

To format on save, add this to your VS Code settings:

```json
{
  "[sail]": {
    "editor.formatOnSave": true
  }
}
```

## Validation

local syntax validation that runs entirely in your editor with no server or api calls needed. errors show up as red squiggly underlines as you type.

the parser is a recursive descent implementation that handles the full sail grammar: arithmetic, comparisons, string concatenation, function calls with keyword arguments, list literals, dot access, indexing, assignments, record type references, and all the domain prefixes (`a!`, `fn!`, `rule!`, `local!`, etc.).

it catches things like:
- unmatched parentheses, brackets, braces
- unclosed function parameter lists
- empty parentheses `()`
- invalid operators (like `#`)
- malformed expressions

it is intentionally lenient in the same places the real parser is. for example, trailing operators like `1 +` are silently accepted.

validation runs on file open, on save, and on change (debounced 500ms).

## Testing

```bash
npm test
```

runs the parser test suite (lexer + parser + edge cases).

## Todo

- [ ] Record type collapse
- [ ] Autocomplete for built-in functions

## License

MIT
