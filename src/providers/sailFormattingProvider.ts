import * as vscode from 'vscode';
import { formatSail } from '../formatter/formatSail';

export class SailFormattingProvider implements vscode.DocumentFormattingEditProvider {
  provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
    const text = document.getText();
    const formatted = formatSail(text);

    if (text === formatted) {
      return [];
    }

    // replace the full document so formatting is deterministic.
    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
    return [vscode.TextEdit.replace(fullRange, formatted)];
  }
}