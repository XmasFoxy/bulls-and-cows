import { describe, expect, it } from "vitest";
import { generateSecret } from "../src/game-logic.js";

describe("generateSecret", () => {
  it("generates unique digits deterministically from the injected random source", () => {
    expect(generateSecret(4, 10, () => 0)).toBe("0123");
  });

  it("allows a leading zero and supports hexadecimal digits", () => {
    expect(generateSecret(4, 16, () => 0)).toBe("0123");
  });

  it("rejects a length larger than the digit alphabet", () => {
    expect(() => generateSecret(3, 2, () => 0)).toThrow(RangeError);
  });
});
