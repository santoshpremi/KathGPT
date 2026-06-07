import { ensureRustApiReady, getRustApiBase } from "./init";

export class RustApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "RustApiError";
  }
}

export async function rustFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  await ensureRustApiReady();
  const res = await fetch(`${getRustApiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const message =
      typeof body?.error === "string" ? body.error : res.statusText;
    throw new RustApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
