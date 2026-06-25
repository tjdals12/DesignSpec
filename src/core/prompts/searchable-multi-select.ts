import chalk from "chalk";

export interface SearchableChoice {
  name: string;
  value: string;
  description?: string;
  configured?: boolean;
  detected?: boolean;
  preSelected?: boolean;
}

interface SearchableMultiSelectConfig {
  message: string;
  choices: SearchableChoice[];
  pageSize?: number;
  validate?: (selected: string[]) => boolean | string;
}

async function createSearchableMultiSelect(): Promise<
  (config: SearchableMultiSelectConfig) => Promise<string[]>
> {
  const {
    createPrompt,
    useState,
    useKeypress,
    useMemo,
    usePrefix,
    isEnterKey,
    isUpKey,
    isDownKey,
  } = await import("@inquirer/core");

  return createPrompt<string[], SearchableMultiSelectConfig>((config, done) => {
    const { message, choices, pageSize = 15, validate } = config;

    const [selectedValues, setSelectedValues] = useState<string[]>(() =>
      choices.filter((choice) => choice.preSelected).map((choice) => choice.value),
    );
    const [cursor, setCursor] = useState(0);
    const [status, setStatus] = useState<"idle" | "done">("idle");
    const [error, setError] = useState<string | null>(null);

    const prefix = usePrefix({ status });
    const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
    const choiceMap = useMemo(
      () => new Map(choices.map((choice) => [choice.value, choice])),
      [choices],
    );

    useKeypress((key) => {
      if (status === "done") return;

      if (isEnterKey(key)) {
        if (validate) {
          const result = validate(selectedValues);
          if (result !== true) {
            setError(typeof result === "string" ? result : "Invalid");
            return;
          }
        }
        setStatus("done");
        done(selectedValues);
        return;
      }

      if (key.name === "space") {
        const choice = choices[cursor];
        if (choice) {
          if (selectedSet.has(choice.value)) {
            setSelectedValues(selectedValues.filter((value) => value !== choice.value));
          } else {
            setSelectedValues([...selectedValues, choice.value]);
          }
        }
        return;
      }

      if (isUpKey(key)) {
        setCursor(Math.max(0, cursor - 1));
        return;
      }
      if (isDownKey(key)) {
        setCursor(Math.min(choices.length - 1, cursor + 1));
      }
    });

    if (status === "done") {
      const names = selectedValues.map((value) => choiceMap.get(value)?.name ?? value).join(", ");
      return `${prefix} ${chalk.bold(message)} ${chalk.cyan(names || "(none)")}`;
    }

    const lines: string[] = [];
    lines.push(`${prefix} ${chalk.bold(message)}`);

    const startIndex = Math.max(
      0,
      Math.min(cursor - Math.floor(pageSize / 2), choices.length - pageSize),
    );
    const endIndex = Math.min(startIndex + pageSize, choices.length);
    const visibleChoices = choices.slice(startIndex, endIndex);

    for (let i = 0; i < visibleChoices.length; i++) {
      const item = visibleChoices[i]!;
      const actualIndex = startIndex + i;
      const isActive = actualIndex === cursor;
      const selected = selectedSet.has(item.value);
      const icon = selected ? chalk.green("◉") : chalk.dim("○");
      const arrow = isActive ? chalk.cyan("›") : " ";
      const name = isActive ? chalk.cyan(item.name) : item.name;
      const isRefresh = selected && item.configured;
      const statusLabel = !selected
        ? item.configured
          ? " (configured)"
          : item.detected
            ? " (detected)"
            : ""
        : "";
      const suffix = selected
        ? chalk.dim(isRefresh ? " (refresh)" : " (selected)")
        : chalk.dim(statusLabel);
      lines.push(`  ${arrow} ${icon} ${name}${suffix}`);
    }

    if (choices.length > pageSize) {
      const currentPage = Math.floor(cursor / pageSize) + 1;
      const totalPages = Math.ceil(choices.length / pageSize);
      lines.push(chalk.dim(`  (${currentPage}/${totalPages})`));
    }

    lines.push(
      `  ${chalk.cyan("↑↓")} navigate • ${chalk.cyan("Space")} toggle • ${chalk.cyan("Enter")} confirm`,
    );

    if (error) lines.push(chalk.red(`  ${error}`));

    return lines.join("\n");
  });
}

export async function searchableMultiSelect(
  config: SearchableMultiSelectConfig,
): Promise<string[]> {
  const prompt = await createSearchableMultiSelect();
  return prompt(config);
}

export default searchableMultiSelect;
