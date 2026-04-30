import chalk from "chalk";

export function getStatusColor(status: "blocked" | "ready" | "done"): (text: string) => string {
  switch (status) {
    case "blocked":
      return chalk.red;
    case "ready":
      return chalk.yellow;
    case "done":
      return chalk.green;
  }
}

export function getStatusIndicator(status: "blocked" | "ready" | "done") {
  switch (status) {
    case "blocked":
      return "[x]";
    case "ready":
      return "[ ]";
    case "done":
      return "[-]";
  }
}
