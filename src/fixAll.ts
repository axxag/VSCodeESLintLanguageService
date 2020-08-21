import * as vscode from 'vscode'

import { shouldBeLinted } from './utils'

function executeCodeActionProvider(uri: vscode.Uri, range: vscode.Range) {
  return vscode.commands.executeCommand<vscode.CodeAction[]>(
    "vscode.executeCodeActionProvider",
    uri,
    range
  );
}

async function getEsLintFixAllCodeAction(
  document: vscode.TextDocument
): Promise<vscode.CodeAction | undefined> {
  const diagnostics = vscode.languages
    .getDiagnostics(document.uri)
    .filter((diagnostic) => diagnostic.source === "eslint");

  for (const diagnostic of diagnostics) {
    const codeActions = await executeCodeActionProvider(
      document.uri,
      diagnostic.range
    );
    if (codeActions) {
      const fixAll = codeActions.filter(
        (action) => action.title === "Fix all auto-fixable eslint failures"
      );
      if (fixAll.length > 0) {
        return fixAll[0];
      }
    }
  }
  return undefined;
}

export class FixAllProvider implements vscode.CodeActionProvider {
  public static readonly fixAllCodeActionKind = vscode.CodeActionKind.SourceFixAll.append(
    "eslint"
  );

  public static metadata: vscode.CodeActionProviderMetadata = {
    providedCodeActionKinds: [FixAllProvider.fixAllCodeActionKind],
  };

  public async provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): Promise<vscode.CodeAction[]> {
    if (!context.only) {
      return [];
    }

    if (
      !context.only.contains(FixAllProvider.fixAllCodeActionKind) &&
      !FixAllProvider.fixAllCodeActionKind.contains(context.only)
    ) {
      return [];
    }

    if (!shouldBeLinted(document)) {
      return [];
    }

    const fixAllAction = await getEsLintFixAllCodeAction(document);
    if (!fixAllAction) {
      return [];
    }

    return [
      {
        ...fixAllAction,
        title: "Fix All ESLint",
        kind: FixAllProvider.fixAllCodeActionKind,
      },
    ];
  }
}
