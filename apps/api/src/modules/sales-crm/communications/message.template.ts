const TOKEN = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;

/** Replaces `{{name}}` style placeholders. Unknown tokens are left in place. */
export function renderMessage(source: string, variables: Record<string, string>): string {
  return source.replace(TOKEN, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return variables[key] ?? "";
    }
    return match;
  });
}
