/**
 * ubiquitous-sniffle
 *
 * A welcoming entry point for the library. Replace this with your actual
 * functionality as the project grows.
 */

export interface Greeting {
  message: string;
  timestamp: string;
}

/**
 * Returns a friendly greeting, optionally addressed to `name`.
 */
export function greet(name?: string): Greeting {
  const recipient = name?.trim() || "world";
  return {
    message: `Hello, ${recipient}! Welcome to ubiquitous-sniffle.`,
    timestamp: new Date().toISOString(),
  };
}

export const VERSION = "0.1.0" as const;
