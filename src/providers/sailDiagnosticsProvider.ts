import * as vscode from 'vscode';
import { validateSail, SailDiagnostic } from '../parser';

export class SailDiagnosticsProvider implements vscode.Disposable {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private disposables: vscode.Disposable[] = [];
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('sail');

    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.languageId === 'sail') { this.validateDocument(doc); }
      })
    );

    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document.languageId === 'sail') { this.debouncedValidate(event.document); }
      })
    );

    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((doc) => {
        if (doc.languageId === 'sail') { this.validateDocument(doc); }
      })
    );

    this.disposables.push(
      vscode.workspace.onDidCloseTextDocument((doc) => {
        this.diagnosticCollection.delete(doc.uri);
        const timer = this.debounceTimers.get(doc.uri.toString());
        if (timer) {
          clearTimeout(timer);
          this.debounceTimers.delete(doc.uri.toString());
        }
      })
    );

    for (const doc of vscode.workspace.textDocuments) {
      if (doc.languageId === 'sail') { this.validateDocument(doc); }
    }
  }

  private debouncedValidate(document: vscode.TextDocument): void {
    const key = document.uri.toString();
    const existing = this.debounceTimers.get(key);
    if (existing) { clearTimeout(existing); }
    this.debounceTimers.set(
      key,
      setTimeout(() => {
        this.debounceTimers.delete(key);
        this.validateDocument(document);
      }, 500)
    );
  }

  private validateDocument(document: vscode.TextDocument): void {
    const sailDiags = validateSail(document.getText());
    this.diagnosticCollection.set(document.uri, sailDiags.map((d) => this.toVsDiag(d, document)));
  }

  private toVsDiag(d: SailDiagnostic, document: vscode.TextDocument): vscode.Diagnostic {
    const line = Math.max(0, Math.min(d.line, document.lineCount - 1));
    const lineText = document.lineAt(line).text;
    const startCol = Math.max(0, Math.min(d.startCol, lineText.length));
    const endCol = Math.max(startCol, Math.min(d.endCol, lineText.length));
    const range = new vscode.Range(new vscode.Position(line, startCol), new vscode.Position(line, endCol));
    const severity = d.severity === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
    const diag = new vscode.Diagnostic(range, d.message, severity);
    diag.source = 'sail';
    return diag;
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
    for (const d of this.disposables) { d.dispose(); }
    for (const timer of this.debounceTimers.values()) { clearTimeout(timer); }
    this.debounceTimers.clear();
  }
}
