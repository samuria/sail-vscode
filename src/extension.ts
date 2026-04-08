import * as vscode from 'vscode';
import { SailFormattingProvider } from './providers/sailFormattingProvider';
import { SailDiagnosticsProvider } from './providers/sailDiagnosticsProvider';

export { formatSail } from './formatter/formatSail';
export { validateSail } from './parser';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider('sail', new SailFormattingProvider())
  );
  context.subscriptions.push(new SailDiagnosticsProvider());
}

export function deactivate(): void {}
