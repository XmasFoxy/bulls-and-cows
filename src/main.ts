import {
  countPossibleSecrets,
  createDigitValidator,
  generateSecret,
  isValidGuess,
  submitGuess,
  type GameSettings,
  type GameState,
} from "./game-logic.js";

interface HighScore {
  readonly attempts: number;
  readonly seconds: number;
  readonly length: number;
  readonly base: number;
  readonly playedAt: string;
}

const STORAGE_KEY = "bulls-and-cows.scores";
const BASE_LABELS: Record<number, string> = {
  2: "Binary",
  8: "Octal",
  10: "Decimal",
  16: "Hexadecimal",
};
const root = document.createElement("main");
root.className = "app-shell";
const notice = document.createElement("p");
notice.className = "notice";
notice.setAttribute("role", "status");
const content = document.createElement("div");
content.className = "content";
root.append(notice, content);
document.body.append(root);

let scores: HighScore[] = [];
let timerId: number | undefined;
let scoreLoadFailed = false;

const createElement = <Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  className?: string,
): HTMLElementTagNameMap[Tag] => {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  return element;
};

const setNotice = (message: string, isError = false): void => {
  notice.textContent = message;
  notice.hidden = message.length === 0;
  notice.classList.toggle("notice-error", isError);
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
};

const isHighScore = (value: unknown): value is HighScore => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "attempts" in value &&
    typeof value.attempts === "number" &&
    Number.isInteger(value.attempts) &&
    value.attempts > 0 &&
    "seconds" in value &&
    typeof value.seconds === "number" &&
    Number.isFinite(value.seconds) &&
    value.seconds >= 0 &&
    "length" in value &&
    typeof value.length === "number" &&
    "base" in value &&
    typeof value.base === "number" &&
    "playedAt" in value &&
    typeof value.playedAt === "string"
  );
};

const loadScores = (): HighScore[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(isHighScore)) {
      throw new Error("Stored scores have an invalid format.");
    }
    return parsed;
  } catch (error) {
    console.error("Could not load saved scores.", error);
    scoreLoadFailed = true;
    return [];
  }
};

const saveScore = (score: HighScore): void => {
  scores = [...scores, score]
    .sort(
      (left, right) =>
        left.attempts - right.attempts || left.seconds - right.seconds,
    )
    .slice(0, 10);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch (error) {
    console.error("Could not save the game result.", error);
    setNotice("The result is shown below but could not be saved.", true);
  }
};

const renderScores = (): HTMLElement => {
  const section = createElement("section", "card scores-card");
  const title = createElement("h2");
  title.textContent = "Hall of fame";
  section.append(title);

  if (scores.length === 0) {
    const empty = createElement("p", "muted");
    empty.textContent = "Win a round to set the first record.";
    section.append(empty);
    return section;
  }

  const table = createElement("table");
  const head = createElement("thead");
  const headerRow = createElement("tr");
  ["Game", "Attempts", "Time", "Date"].forEach((label) => {
    const cell = createElement("th");
    cell.scope = "col";
    cell.textContent = label;
    headerRow.append(cell);
  });
  head.append(headerRow);
  const body = createElement("tbody");

  scores.forEach((score) => {
    const row = createElement("tr");
    const values = [
      `${score.length} digits · ${BASE_LABELS[score.base] ?? score.base}`,
      score.attempts.toString(),
      formatTime(score.seconds),
      new Date(score.playedAt).toLocaleDateString(),
    ];
    values.forEach((value) => {
      const cell = createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    body.append(row);
  });

  table.append(head, body);
  section.append(table);
  return section;
};

const renderPage = (panel: HTMLElement): void => {
  content.replaceChildren(panel, renderScores());
};

const renderSettings = (): void => {
  if (timerId !== undefined) {
    window.clearInterval(timerId);
    timerId = undefined;
  }
  setNotice("");

  const panel = createElement("section", "card settings-card");
  const title = createElement("h1");
  title.textContent = "Bulls and Cows";
  const intro = createElement("p", "muted");
  intro.textContent =
    "Crack the secret number. Each digit can appear only once.";

  const form = createElement("form", "settings-form");
  const baseLabel = createElement("label");
  baseLabel.textContent = "Number system";
  const baseSelect = createElement("select");
  baseSelect.name = "base";
  Object.entries(BASE_LABELS).forEach(([base, label]) => {
    const option = createElement("option");
    option.value = base;
    option.textContent = label;
    baseSelect.append(option);
  });
  baseLabel.append(baseSelect);

  const lengthLabel = createElement("label");
  lengthLabel.textContent = "Secret length";
  const lengthSelect = createElement("select");
  lengthSelect.name = "length";
  for (let length = 2; length <= 6; length += 1) {
    const option = createElement("option");
    option.value = length.toString();
    option.textContent = `${length} digits`;
    lengthSelect.append(option);
  }
  lengthLabel.append(lengthSelect);

  const possibilities = createElement("p", "muted possibilities");
  const updateSettings = (): void => {
    const base = Number(baseSelect.value);
    [...lengthSelect.options].forEach((option) => {
      option.disabled = Number(option.value) > base;
    });
    if (Number(lengthSelect.value) > base) {
      lengthSelect.value = base.toString();
    }
    possibilities.textContent = `${countPossibleSecrets(
      Number(lengthSelect.value),
      base,
    ).toLocaleString()} possible secrets`;
  };
  baseSelect.addEventListener("change", updateSettings);
  lengthSelect.addEventListener("change", updateSettings);
  updateSettings();

  const startButton = createElement("button", "primary-button");
  startButton.type = "submit";
  startButton.textContent = "Start game";
  form.append(baseLabel, lengthLabel, possibilities, startButton);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const settings: GameSettings = {
      length: Number(lengthSelect.value),
      base: Number(baseSelect.value),
    };
    const state: GameState = {
      settings,
      secret: generateSecret(settings.length, settings.base),
      guesses: [],
      startedAt: Date.now(),
      status: "playing",
    };
    renderGame(state);
  });

  panel.append(title, intro, form);
  renderPage(panel);
};

const renderGame = (state: GameState): void => {
  if (timerId !== undefined) {
    window.clearInterval(timerId);
    timerId = undefined;
  }

  const panel = createElement("section", "card game-card");
  const title = createElement("h1");
  title.textContent = "Guess the secret";
  const settings = createElement("p", "muted");
  settings.textContent = `${state.settings.length} digits · ${
    BASE_LABELS[state.settings.base]
  }`;

  const stats = createElement("div", "game-stats");
  const attempts = createElement("span");
  attempts.textContent = `Attempts: ${state.guesses.length}`;
  const elapsed = createElement("span");
  const updateElapsed = (): void => {
    elapsed.textContent = `Time: ${formatTime(
      Math.floor((Date.now() - state.startedAt) / 1000),
    )}`;
  };
  updateElapsed();
  stats.append(attempts, elapsed);

  const historyTitle = createElement("h2");
  historyTitle.textContent = "Guess history";
  const history = createElement("ol", "guess-history");
  state.guesses.forEach(({ guess, result }) => {
    const item = createElement("li");
    const entry = createElement("strong");
    entry.textContent = guess.toUpperCase();
    const hint = createElement("span");
    hint.textContent = `${result.bulls} bulls · ${result.cows} cows`;
    item.append(entry, hint);
    history.append(item);
  });

  panel.append(title, settings, stats);

  if (state.status === "won") {
    const victory = createElement("p", "victory");
    victory.textContent = `You cracked it in ${state.guesses.length} ${
      state.guesses.length === 1 ? "attempt" : "attempts"
    } and ${formatTime(Math.floor((Date.now() - state.startedAt) / 1000))}.`;
    const newGame = createElement("button", "primary-button");
    newGame.type = "button";
    newGame.textContent = "New game";
    newGame.addEventListener("click", renderSettings);
    panel.append(victory, newGame, historyTitle, history);
    renderPage(panel);
    return;
  }

  const form = createElement("form", "guess-form");
  const inputLabel = createElement("label");
  inputLabel.textContent = "Your guess";
  const input = createElement("input");
  input.type = "text";
  input.name = "guess";
  input.required = true;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.maxLength = state.settings.length;
  input.setAttribute("aria-label", "Enter your guess");
  const isValidDigit = createDigitValidator(state.settings.base);
  input.addEventListener("input", () => {
    const seen = new Set<string>();
    input.value = [...input.value]
      .filter((digit) => {
        const normalized = digit.toLowerCase();
        if (!isValidDigit(digit) || seen.has(normalized)) {
          return false;
        }
        seen.add(normalized);
        return true;
      })
      .slice(0, state.settings.length)
      .join("");
  });
  inputLabel.append(input);

  const submitButton = createElement("button", "primary-button");
  submitButton.type = "submit";
  submitButton.textContent = "Check guess";
  form.append(inputLabel, submitButton);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (
      !isValidGuess(input.value, state.settings.length, state.settings.base)
    ) {
      setNotice(
        "Enter a valid guess using unique digits from this system.",
        true,
      );
      input.focus();
      return;
    }

    const nextState = submitGuess(state, input.value);
    if (nextState === state) {
      setNotice("You have already tried that number.");
      input.focus();
      return;
    }

    setNotice("");
    if (nextState.status === "won") {
      saveScore({
        attempts: nextState.guesses.length,
        seconds: Math.floor((Date.now() - nextState.startedAt) / 1000),
        length: nextState.settings.length,
        base: nextState.settings.base,
        playedAt: new Date().toISOString(),
      });
    }
    renderGame(nextState);
  });

  panel.append(form, historyTitle, history);
  renderPage(panel);
  timerId = window.setInterval(updateElapsed, 1000);
  input.focus();
};

scores = loadScores();
renderSettings();
if (scoreLoadFailed) {
  setNotice("Saved scores could not be loaded from this browser.", true);
}
