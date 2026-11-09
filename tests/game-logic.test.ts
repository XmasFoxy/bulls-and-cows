import { describe, expect, it } from "vitest";
import { evaluateGuess, generateSecret } from "../src/game-logic.js";

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

describe("evaluateGuess", () => {
  it("counts bulls and cows without double-counting bulls", () => {
    expect(evaluateGuess("4271", "1234")).toEqual({ bulls: 0, cows: 3 });
  });

  it("compares hexadecimal digits without regard to case", () => {
    expect(evaluateGuess("1a2b", "A1B2")).toEqual({ bulls: 0, cows: 4 });
  });

  it("counts exact matches as bulls", () => {
    expect(evaluateGuess("0123", "0132")).toEqual({ bulls: 2, cows: 2 });
  });
});
