/**
 * ASCII art animation frames for the welcome screen.
 *
 * DesignSpec's brand is a white wireframe on black, so the logo is a screen
 * window that draws itself in: corners → border → title dots → content lines.
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

const INNER_WIDTH = 10;

const blankRow = " ".repeat(INNER_WIDTH + 2);
const borderTop = `${TL}${H.repeat(INNER_WIDTH)}${TR}`;
const borderBottom = `${BL}${H.repeat(INNER_WIDTH)}${BR}`;
const emptyRow = `${V}${" ".repeat(INNER_WIDTH)}${V}`;
const cornersTop = `${TL}${" ".repeat(INNER_WIDTH)}${TR}`;
const cornersBottom = `${BL}${" ".repeat(INNER_WIDTH)}${BR}`;
const titleRow = `${V} ${O} ${O} ${O}    ${V}`;
const contentRow1 = `${V} ${H.repeat(6)}   ${V}`;
const contentRow2 = `${V} ${H.repeat(3)}  ${H.repeat(2)}  ${V}`;

/**
 * Frames of the logo build-up. Combined with the per-frame brightness ramp in
 * the welcome screen, the window grows and comes into focus.
 */
export const WELCOME_ANIMATION = {
  interval: 140,
  frames: [
    // Frame 0: empty
    [blankRow, blankRow, blankRow, blankRow, blankRow],
    // Frame 1: corners
    [cornersTop, blankRow, blankRow, blankRow, cornersBottom],
    // Frame 2: full border
    [borderTop, emptyRow, emptyRow, emptyRow, borderBottom],
    // Frame 3: border + title dots
    [borderTop, titleRow, emptyRow, emptyRow, borderBottom],
    // Frame 4: content lines fill in
    [borderTop, titleRow, contentRow1, contentRow2, borderBottom],
    // Frame 5: hold the complete logo
    [borderTop, titleRow, contentRow1, contentRow2, borderBottom],
  ],
};

/** Index of the fully drawn frame, used as the static (non-animated) fallback. */
export const WELCOME_PEAK_FRAME_INDEX = 4;
