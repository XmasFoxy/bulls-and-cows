import { describe, expect, it } from "vitest";
import {
  createDigitValidator,
  evaluateGuess,
  generateSecret,
  isValidGuess,
} from "../src/game-logic.js";

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
    expect(evaluateGuess("4271", "1234")).toEqual({ bulls: 1, cows: 2 });
  });

  it("compares hexadecimal digits without regard to case", () => {
    expect(evaluateGuess("1a2b", "A1B2")).toEqual({ bulls: 0, cows: 4 });
  });

  it("counts exact matches as bulls", () => {
    expect(evaluateGuess("0123", "0132")).toEqual({ bulls: 2, cows: 2 });
  });
});

describe("createDigitValidator", () => {
  it("accepts only digits available in the selected base", () => {
    const isBinaryDigit = createDigitValidator(2);

    expect(isBinaryDigit("0")).toBe(true);
    expect(isBinaryDigit("1")).toBe(true);
    expect(isBinaryDigit("2")).toBe(false);
    expect(isBinaryDigit("")).toBe(false);
  });

  it("accepts hexadecimal letters regardless of case", () => {
    const isHexDigit = createDigitValidator(16);

    expect(isHexDigit("A")).toBe(true);
    expect(isHexDigit("f")).toBe(true);
    expect(isHexDigit("g")).toBe(false);
  });

  it("rejects unsupported bases", () => {
    expect(() => createDigitValidator(1)).toThrow(RangeError);
  });
});

describe("isValidGuess", () => {
  it("requires the configured length and unique valid digits", () => {
    expect(isValidGuess("0123", 4, 10)).toBe(true);
    expect(isValidGuess("012", 4, 10)).toBe(false);
    expect(isValidGuess("0113", 4, 10)).toBe(false);
  });

  it("validates hexadecimal digits case-insensitively", () => {
    expect(isValidGuess("aF09", 4, 16)).toBe(true);
    expect(isValidGuess("aG09", 4, 16)).toBe(false);
    expect(isValidGuess("aA09", 4, 16)).toBe(false);
  });
});
