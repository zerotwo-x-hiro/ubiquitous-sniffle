import { describe, expect, it } from "vitest";
import { greet, VERSION } from "./index.js";

describe("greet", () => {
  it("greets the world when no name is provided", () => {
    const result = greet();
    expect(result.message).toMatch(/Hello, world/);
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();
  });

  it("greets a named recipient", () => {
    const result = greet("Ada");
    expect(result.message).toContain("Hello, Ada");
  });

  it("trims whitespace from names", () => {
    const result = greet("  Grace  ");
    expect(result.message).toContain("Hello, Grace");
  });

  it("treats empty/whitespace-only names as world", () => {
    expect(greet("").message).toContain("Hello, world");
    expect(greet("   ").message).toContain("Hello, world");
  });
});

describe("VERSION", () => {
  it("is a semver-looking string", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
