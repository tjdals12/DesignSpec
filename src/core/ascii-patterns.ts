/**
 * ASCII art animation frames for the welcome screen.
 *
 * DesignSpec's brand is a white wireframe on black, so the logo is a screen
 * window that draws itself in: corners → border → title dots → content rows.
 * Each frame is an array of strings (one per row). The build-up reads as
 * "a screen being specced out before it's built", matching the product.
 */

// Full Unicode (box-drawing) is safe on macOS/Linux and modern Windows
// terminals; fall back to ASCII elsewhere.
const supportsUnicode =
  process.platform !== "win32" ||
  Boolean(process.env.WT_SESSION) ||
  Boolean(process.env.TERM_PROGRAM);

interface FrameChars {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
  dot: string;
}

const CHARS: FrameChars = supportsUnicode
  ? {
      topLeft: "┌",
      topRight: "┐",
      bottomLeft: "└",
      bottomRight: "┘",
      horizontal: "─",
      vertical: "│",
      dot: "•",
    }
  : {
      topLeft: "+",
      topRight: "+",
      bottomLeft: "+",
      bottomRight: "+",
      horizontal: "-",
      vertical: "|",
      dot: "o",
    };

const {
  topLeft: TL,
  topRight: TR,
  bottomLeft: BL,
  bottomRight: BR,
  horizontal: H,
  vertical: V,
  dot: O,
} = CHARS;

const INNER_WIDTH = 12;
const TOTAL_WIDTH = INNER_WIDTH + 2;

/** Wraps inner content (padded to the inner width) in vertical borders. */
function row(inner: string): string {
  return `${V}${inner.padEnd(INNER_WIDTH).slice(0, INNER_WIDTH)}${V}`;
}

const blankRow = " ".repeat(TOTAL_WIDTH);
const borderTop = `${TL}${H.repeat(INNER_WIDTH)}${TR}`;
const borderBottom = `${BL}${H.repeat(INNER_WIDTH)}${BR}`;
const cornersTop = `${TL}${" ".repeat(INNER_WIDTH)}${TR}`;
const cornersBottom = `${BL}${" ".repeat(INNER_WIDTH)}${BR}`;

const emptyInner = row("");
const titleRow = row(` ${O} ${O} ${O}`);
const lineFull = row(` ${H.repeat(10)}`);
const twoCols = row(` ${H.repeat(4)}  ${H.repeat(4)}`);
const lineMedium = row(` ${H.repeat(8)}`);
const twoColsShort = row(` ${H.repeat(3)}   ${H.repeat(3)}`);

/**
 * Frames of the logo build-up. Combined with the per-frame brightness ramp in
 * the welcome screen, the window grows and comes into focus.
 */
export const WELCOME_ANIMATION = {
  interval: 130,
  frames: [
    // Frame 0: empty
    [
      blankRow,
      blankRow,
      blankRow,
      blankRow,
      blankRow,
      blankRow,
      blankRow,
      blankRow,
      blankRow,
      blankRow,
      blankRow,
    ],
    // Frame 1: corners
    [
      cornersTop,
      blankRow,
      blankRow,
      blankRow,
      blankRow,
      blankRow,
      blankRow,
      blankRow,
      blankRow,
      blankRow,
      cornersBottom,
    ],
    // Frame 2: full border
    [
      borderTop,
      emptyInner,
      emptyInner,
      emptyInner,
      emptyInner,
      emptyInner,
      emptyInner,
      emptyInner,
      emptyInner,
      emptyInner,
      borderBottom,
    ],
    // Frame 3: border + title dots
    [
      borderTop,
      titleRow,
      emptyInner,
      emptyInner,
      emptyInner,
      emptyInner,
      emptyInner,
      emptyInner,
      emptyInner,
      emptyInner,
      borderBottom,
    ],
    // Frame 4: first content block fills in
    [
      borderTop,
      titleRow,
      emptyInner,
      lineFull,
      twoCols,
      twoCols,
      emptyInner,
      emptyInner,
      emptyInner,
      emptyInner,
      borderBottom,
    ],
    // Frame 5: second content block — complete wireframe
    [
      borderTop,
      titleRow,
      emptyInner,
      lineFull,
      twoCols,
      twoCols,
      emptyInner,
      lineMedium,
      twoColsShort,
      emptyInner,
      borderBottom,
    ],
    // Frame 6: hold the complete logo
    [
      borderTop,
      titleRow,
      emptyInner,
      lineFull,
      twoCols,
      twoCols,
      emptyInner,
      lineMedium,
      twoColsShort,
      emptyInner,
      borderBottom,
    ],
  ],
};

/** Index of the fully drawn frame, used as the static (non-animated) fallback. */
export const WELCOME_PEAK_FRAME_INDEX = 5;
