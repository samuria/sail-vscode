import * as vscode from 'vscode';
import { SailFormattingProvider } from './providers/sailFormattingProvider';

export { formatSail } from './formatter/formatSail';

export function activate(context: vscode.ExtensionContext): void {
  // register sail document formatting with vscode.
  const formatter = vscode.languages.registerDocumentFormattingEditProvider('sail', new SailFormattingProvider());
  context.subscriptions.push(formatter);
}

export function deactivate(): void {}
