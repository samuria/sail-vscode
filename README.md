# sail-vscode

Syntax highlighting and document formatting for Appian SAIL (.sail) files. Supports `a!`, `rule!`, `fn!`, `cons!` functions, all variable prefixes (`local!`, `ri!`, `fv!`, etc.), record type URNs, strings, comments, and more.

![Screenshot](images/screenshot.png)

## Installation

### From source

1. Clone this repository
2. Run `npm install` and `npm run compile`
3. Symlink the folder into your VS Code extensions directory:
   - macOS/Linux: `~/.vscode/extensions/`
   - Windows: `%USERPROFILE%\.vscode\extensions\`
4. Restart VS Code

### From .vsix file

1. Run `npm run package` to build the `.vsix` file
2. In VS Code, open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
3. Run "Extensions: Install from VSIX..." and select the file

## License

MIT
