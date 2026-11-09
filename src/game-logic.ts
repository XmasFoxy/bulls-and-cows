const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

export interface GuessResult {
  bulls: number;
  cows: number;
}

export interface GameSettings {
  readonly length: number;
  readonly base: number;
}

export interface GuessEntry {
  readonly guess: string;
  readonly result: GuessResult;
}

export interface GameState {
  readonly settings: GameSettings;
  readonly secret: string;
  readonly guesses: readonly GuessEntry[];
  readonly startedAt: number;
  readonly status: "playing" | "won";
}

export const createDigitValidator = (
  base: number,
): ((char: string) => boolean) => {
  if (!Number.isInteger(base) || base < 2 || base > DIGITS.length) {
    throw new RangeError("Base must be an integer between 2 and 36.");
  }

  return (char: string): boolean => {
    const digitIndex = DIGITS.indexOf(char.toLowerCase());
    return char.length === 1 && digitIndex >= 0 && digitIndex < base;
  };
};

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

export const isValidGuess = (
  guess: string,
  length: number,
  base: number,
): boolean => {
  if (
    !Number.isInteger(length) ||
    length < 1 ||
    length > base ||
    guess.length !== length
  ) {
    return false;
  }

  const isValidDigit = createDigitValidator(base);
  const normalizedDigits = [...guess.toLowerCase()];

  return (
    [...guess].every(isValidDigit) && new Set(normalizedDigits).size === length
  );
};

const possibleSecretsCache = new Map<string, number>();

const countPermutations = (length: number, base: number): number => {
  const key = `${length}:${base}`;
  const cached = possibleSecretsCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const count =
    length === 0 ? 1 : base * countPermutations(length - 1, base - 1);
  possibleSecretsCache.set(key, count);
  return count;
};

export const countPossibleSecrets = (length: number, base: number): number => {
  if (!Number.isInteger(base) || base < 2 || base > DIGITS.length) {
    throw new RangeError("Base must be an integer between 2 and 36.");
  }
  if (!Number.isInteger(length) || length < 0 || length > base) {
    throw new RangeError("Length must be an integer between 0 and the base.");
  }

  return countPermutations(length, base);
};

export const submitGuess = (state: GameState, guess: string): GameState => {
  if (state.status === "won") {
    return state;
  }
  if (!isValidGuess(guess, state.settings.length, state.settings.base)) {
    throw new RangeError("Guess does not match the game settings.");
  }
  if (
    state.guesses.some(
      (entry) => entry.guess.toLowerCase() === guess.toLowerCase(),
    )
  ) {
    return state;
  }

  const result = evaluateGuess(state.secret, guess);
  return {
    ...state,
    guesses: [...state.guesses, { guess, result }],
    status: result.bulls === state.settings.length ? "won" : "playing",
  };
};
