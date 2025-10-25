// Minimal globals so TS knows about Deno in this repo.
declare namespace Deno {
  /** Read environment variables at runtime. */
  const env: { get(name: string): string | undefined };

  /** Edge-style request handler registration. */
  function serve(handler: (req: Request) => Response | Promise<Response>): void;
}
