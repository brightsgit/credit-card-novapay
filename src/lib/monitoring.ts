export function logError(message: string, context?: unknown): void {
  console.error(`[novapay-form] ${message}`, context ?? "");
}
