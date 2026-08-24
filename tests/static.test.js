const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('native hidden states cannot be overridden by component display rules', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important;/);
});

test('print output keeps a visible trim boundary at the selected photo size', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
  const printStyles = css.slice(css.indexOf('@media print'));

  assert.match(printStyles, /\.print-photo\s*\{[^}]*outline:\s*0\.15mm solid #b8b8b8;/s);
});

test('direct-file use does not depend on secure-context UUID APIs', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  assert.doesNotMatch(app, /crypto\.randomUUID/);
});
