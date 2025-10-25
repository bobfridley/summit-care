// types/deno-edge-globals.d.ts
// Minimal shims so TypeScript knows about Deno in Edge runtimes.
// You’re already including DOM/WebWorker libs in tsconfig.server.json.

declare const Deno:
  | {
      env?: { get?: (key: string) => string | undefined };
    }
  | undefined;

// If you ever handle 'fetch' events directly (not needed for Vercel handlers),
// uncomment below so TS knows about it:
//
// interface FetchEvent extends Event {
//   readonly request: Request;
//   respondWith(response: Response | Promise<Response>): void;
// }
//
// declare var FetchEvent: {
//   prototype: FetchEvent;
//   new (type: string, eventInitDict: any): FetchEvent;
// };
