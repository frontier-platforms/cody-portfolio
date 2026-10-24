// The browser database only holds gold tables and has external access disabled; this is a second, cheap check.
const BLOCKED = /\b(insert|update|delete|create|drop|alter|attach|detach|copy|export|import|install|load|pragma|set|call|checkpoint)\b/i;

export function checkSql(sql: string): string | null {
  const trimmed = sql.trim().replace(/;\s*$/, "");
  if (!/^(select|with)\b/i.test(trimmed)) return "Only SELECT queries are allowed.";
  if (trimmed.includes(";")) return "Run one statement at a time.";
  if (BLOCKED.test(trimmed.replace(/'[^']*'/g, "''"))) return "Only read-only SELECT queries are allowed.";
  return null;
}
