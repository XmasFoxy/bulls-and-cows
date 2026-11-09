# Design

## Data structures and algorithms

- `GameSettings` stores the selected secret length and number-system base.
- `GameState` stores those settings, the secret, a readonly array of `GuessEntry`
  values, the start time, and the round status. `submitGuess` returns a new
  state and appends history with `[...state.guesses, entry]`; previous state
  and history remain unchanged.
- `evaluateGuess` normalizes digits to lowercase, counts exact-position matches
  with `filter`, and uses a `Set` to count all matching digits. Cows are the
  matching-digit count minus bulls.
- `countPossibleSecrets` uses the recurrence
  `P(length, base) = base * P(length - 1, base - 1)`, with `P(0, base) = 1`.
  Results are cached by `(length, base)` in a `Map`.
- The UI stores score records as a sorted array in `localStorage`; each record
  includes its settings so results from different games remain distinguishable.

## Complexity

Let `B` be the number-system base and `L` the secret length.

| Function               | Time                                | Space                                | Reason                                                                                 |
| ---------------------- | ----------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| `generateSecret`       | O(B + L)                            | O(B)                                 | Builds the digit alphabet, then performs `L` partial Fisher–Yates swaps.               |
| `evaluateGuess`        | O(L) expected                       | O(L)                                 | Uses array filters and a set for constant-average-time membership checks.              |
| `isValidGuess`         | O(L) expected                       | O(L)                                 | Checks each digit once and uses a set to detect duplicates.                            |
| `countPossibleSecrets` | O(L) on a cache miss; O(1) on a hit | O(L) call stack, plus cached results | Each recursive step does constant work; memoization stores each visited argument pair. |

## Functional and clean-code principles

- **Pure core and dependency injection:** `src/game-logic.ts` has no DOM or
  storage access. `generateSecret` accepts a random-number source, making its
  results deterministic in tests.
- **Higher-order functions:** `evaluateGuess` uses `filter`; `isValidGuess`
  uses `every`; `createDigitValidator(base)` returns a digit predicate used
  both by validation and the live input filter in `src/main.ts`.
- **Immutability:** `GameState` and its history are readonly. `submitGuess`
  creates a new state and history array rather than mutating either.
- **Single responsibility and descriptive names:** validation, scoring,
  generation, state updates, rendering, and score persistence are kept in
  focused functions with explicit names.
- **Explicit boundaries and errors:** invalid bases, lengths, and random-source
  values are rejected by the core functions. Storage read/write failures are
  reported in the UI instead of being silently treated as successful.
- **Testability:** `tests/game-logic.test.ts` exercises the core functions
  without a browser; injected randomness keeps generation tests repeatable.
