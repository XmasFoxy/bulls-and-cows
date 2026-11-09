# Bulls and Cows

A browser-based Bulls and Cows game written in TypeScript. The secret is
generated on the client; game logic has no DOM dependency.

## Run locally

```sh
npm ci
npm test
npm run lint
npm run build
```

Serve the repository root with any static HTTP server after building. The page
loads the compiled module from `dist/src/main.js`; `index.html` must be served
over HTTP rather than opened directly as a file.

## Game features

- Choose a secret length (2–6) and a number system (binary, octal, decimal, or
  hexadecimal) before starting.
- Enter unique digits; hexadecimal input is case-insensitive.
- Review immutable guess history and bulls/cows hints.
- Save the top ten results in browser local storage.
- Start another round without reloading the page.

See [DESIGN.md](./DESIGN.md) for the data structures, algorithms, complexity,
and clean-code decisions.

## Checks

- [ ] Length and number system can be changed before a round and are locked
      during play.
- [ ] Binary mode offers only length 2.
- [ ] Invalid symbols and repeated digits are filtered from input.
- [ ] Uppercase hexadecimal digits are accepted.
- [ ] Guess history shows correct bulls and cows; repeated guesses are not
      added twice.
- [ ] A win records attempts and elapsed time.
- [ ] Records survive a page reload.
- [ ] New game returns to settings without a reload.

The test and implementation commits for each required game-logic function are
kept in order in the branch history.
