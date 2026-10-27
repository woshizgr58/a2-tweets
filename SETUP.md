# Development setup

From this directory, run `npm ci` to install the tools if needed, then `npm run dev`.
Open http://127.0.0.1:8080. TypeScript recompiles on save and Live Server refreshes the page.
Press Ctrl+C in the terminal to stop both processes. Run `npm run build` for a one-time compilation.

## Part 1 implementation

- `js/about.js` calculates dates and summary counts and updates the page through the DOM.
- The `source`, `written`, and `writtenText` getters in `ts/tweet.ts` parse tweet templates and personal comments.
- Inspect `data/saved_tweets.json` to work out the tweet patterns.
- Format percentages with exactly two decimal places.
- `js/tweet.js` is generated automatically; edit `ts/tweet.ts` instead.

Parts 1, 2 and 3 are implemented. The About page populates all summary values.
The activities page displays activity counts and toggles individual/mean distance charts.
The descriptions page filters user-written text on every input change and displays linked tweets.
HTML and CSS changes are not required.

The page uses CDN libraries and styles, so an internet connection is needed for those resources.
Before submitting, fill in `readme.txt`, including assistance from Codex for workspace setup. Exclude `node_modules` from your submission ZIP.
