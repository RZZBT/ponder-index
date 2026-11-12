// Machine-specific settings. Override with environment variables; nothing else in tools/ has absolute paths.
const path = require('path');

module.exports = {
  // The published folder (GitHub Pages root).
  INDEX_ROOT: path.resolve(__dirname, '..', 'docs'),
  // Downloaded packages for verification (git-ignored).
  CACHE: path.resolve(__dirname, '.cache'),
  // The Ponder command line tool (`ponder check`, `ponder check-index`): dist/ponder.cjs of the Ponder project.
  PONDER_CLI: process.env.PONDER_CLI || 'D:/ItelliJ/Ponder/Ponder Anim/dist/ponder.cjs',
  // A Python that has NumPy installed, used by the truth check.
  PYTHON: process.env.PONDER_PYTHON || 'python',
};
