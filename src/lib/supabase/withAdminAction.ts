import { requireAdmin } from './server';

export async function withAdminAction<T>(fn: (user: any) => Promise<T>): Promise<T> {
  const user = await requireAdmin();
  return fn(user);
}
