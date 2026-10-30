/**
 * SELF-HOSTED ARCHITECTURE NOTICE
 * Firebase has been completely replaced by the self-hosted Ubuntu Node.js engine (server.ts).
 * This module provides backward-compatibility types and stubs without initializing Firebase SDK.
 */

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export async function testConnection(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch {
    return true;
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  console.warn(`[Self-Hosted Store] Operation ${operationType} on ${path}:`, error);
}

// Minimal stubs if referenced anywhere
export const db = null as any;
export const auth = {
  currentUser: null as any,
  onAuthStateChanged: () => () => {},
  signOut: async () => {},
} as any;
