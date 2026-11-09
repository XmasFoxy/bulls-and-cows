const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

export interface GuessResult {
  bulls: number;
  cows: number;
}

export const generateSecret = (
  length: number,
  base: number,
  random: () => number = Math.random,
): string => {
  if (!Number.isInteger(base) || base < 2 || base > DIGITS.length) {
    throw new RangeError("Base must be an integer between 2 and 36.");
  }
  if (!Number.isInteger(length) || length < 1 || length > base) {
    throw new RangeError("Length must be an integer between 1 and the base.");
  }

  const digits = Array.from({ length: base }, (_, index) => DIGITS[index]);

  for (let index = 0; index < length; index += 1) {
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new RangeError("Random source must return a value in [0, 1).");
    }

    const swapIndex = index + Math.floor(sample * (base - index));
    [digits[index], digits[swapIndex]] = [digits[swapIndex], digits[index]];
  }

  return digits.slice(0, length).join("");
};

export const evaluateGuess = (secret: string, guess: string): GuessResult => {
  const secretDigits = [...secret.toLowerCase()];
  const guessDigits = [...guess.toLowerCase()];
  const bulls = guessDigits.filter(
    (digit, index) => digit === secretDigits[index],
  ).length;
  const secretSet = new Set(secretDigits);
  const matches = guessDigits.filter((digit) => secretSet.has(digit)).length;

  return { bulls, cows: matches - bulls };
};
