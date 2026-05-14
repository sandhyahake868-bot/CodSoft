/* ============================================================
   Calcite Calculator — Logic
   Supports: basic arithmetic, decimals, %, ±, keyboard input
   ============================================================ */

'use strict';

/* ── DOM References ───────────────────────────────────────── */
const expressionEl = document.getElementById('expression');
const resultEl     = document.getElementById('result');

/* ── Calculator State ─────────────────────────────────────── */
let state = {
  current:     '0',      // number currently being typed
  previous:    '',       // previous operand
  operator:    null,     // pending operator (÷, ×, −, +)
  justEvaled:  false,    // true right after pressing =
  expression:  '',       // full expression string shown above
};

/* ── Operator map: symbol → JS operation ──────────────────── */
const OPS = {
  '÷': (a, b) => b === 0 ? null : a / b,
  '×': (a, b) => a * b,
  '−': (a, b) => a - b,
  '+': (a, b) => a + b,
};

/* ── Helpers ──────────────────────────────────────────────── */

/**
 * Format a number for display, limiting decimal places
 * and switching to exponential notation for very large numbers.
 */
function formatNumber(num) {
  if (!isFinite(num)) return 'Error';
  const abs = Math.abs(num);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-7)) {
    return parseFloat(num.toPrecision(8)).toExponential();
  }
  // Round to avoid floating-point noise
  const rounded = parseFloat(num.toPrecision(10));
  // Use toLocaleString for comma-grouped integers, raw for decimals
  return rounded.toString();
}

/**
 * Adjust the font size of the result element based on string length.
 */
function adjustResultSize(text) {
  resultEl.classList.remove('shrink', 'shrink-sm', 'error');
  const len = text.length;
  if (len > 14) resultEl.classList.add('shrink-sm');
  else if (len > 9)  resultEl.classList.add('shrink');
}

/** Update both display lines */
function render() {
  expressionEl.textContent = state.expression;
  resultEl.textContent     = state.current;
  adjustResultSize(state.current);
}

/** Flash the result display briefly */
function flashResult() {
  resultEl.classList.remove('flash');
  // Trigger reflow to restart animation
  void resultEl.offsetWidth;
  resultEl.classList.add('flash');
}

/** Highlight the active operator button */
function setActiveOperator(op) {
  document.querySelectorAll('.btn-op').forEach(b => {
    b.classList.toggle('active', b.dataset.value === op);
  });
}

/** Animate a button press (triggered by keyboard too) */
function animateButton(btn) {
  if (!btn) return;
  btn.classList.remove('pressed');
  void btn.offsetWidth;
  btn.classList.add('pressed');
}

/* ── Core Calculator Actions ──────────────────────────────── */

/** Input a digit (0–9) */
function inputNumber(digit) {
  // After evaluation, start fresh
  if (state.justEvaled) {
    state.current    = digit;
    state.expression = '';
    state.justEvaled = false;
    render();
    return;
  }
  // Replace '0' with digit, otherwise append
  if (state.current === '0' || state.current === 'Error') {
    state.current = digit;
  } else {
    if (state.current.length >= 15) return; // cap input length
    state.current += digit;
  }
  render();
}

/** Input a decimal point */
function inputDecimal() {
  if (state.justEvaled) {
    state.current    = '0.';
    state.justEvaled = false;
    state.expression = '';
    render();
    return;
  }
  if (state.current.includes('.')) return; // already has decimal
  state.current += '.';
  render();
}

/** Choose an operator */
function inputOperator(op) {
  resultEl.classList.remove('error');

  // If there's a pending operation and user hasn't typed a new number,
  // just swap the operator
  if (state.operator && !state.justEvaled && state.previous !== '') {
    // Allow chaining: evaluate what we have first
    if (!state.justEvaled) {
      calculate(false);
    }
  }

  state.previous   = state.current;
  state.operator   = op;
  state.justEvaled = false;
  state.expression = `${state.previous} ${op}`;

  // Signal that next number starts fresh
  state.justEvaled = true; // reuse flag so next digit resets current
  // But we still want to show current value, so just mark operator chosen
  state.justEvaled = false;

  // Mark that next digit input starts a new number
  state._awaitingSecond = true;

  setActiveOperator(op);
  render();
}

/** Evaluate the pending operation */
function calculate(final = true) {
  if (!state.operator || state.previous === '') return;

  const a   = parseFloat(state.previous);
  const b   = parseFloat(state.current);
  const fn  = OPS[state.operator];
  const res = fn(a, b);

  if (res === null) {
    // Division by zero
    state.expression = `${state.previous} ${state.operator} ${state.current} =`;
    state.current    = 'Error';
    resultEl.classList.add('error');
    state.operator   = null;
    state.previous   = '';
    state.justEvaled = true;
    state._awaitingSecond = false;
    setActiveOperator(null);
    render();
    return;
  }

  if (final) {
    state.expression = `${state.previous} ${state.operator} ${state.current} =`;
    flashResult();
  }

  state.current    = formatNumber(res);
  state.operator   = null;
  state.previous   = '';
  state.justEvaled = true;
  state._awaitingSecond = false;
  setActiveOperator(null);
  render();
}

/** All Clear */
function clearAll() {
  state = {
    current:      '0',
    previous:     '',
    operator:     null,
    justEvaled:   false,
    expression:   '',
    _awaitingSecond: false,
  };
  resultEl.classList.remove('error', 'flash');
  setActiveOperator(null);
  render();
}

/** Delete last character */
function deleteLast() {
  if (state.justEvaled || state.current === 'Error') {
    clearAll();
    return;
  }
  if (state.current.length <= 1) {
    state.current = '0';
  } else {
    state.current = state.current.slice(0, -1);
  }
  render();
}

/** Toggle sign (positive ↔ negative) */
function toggleSign() {
  if (state.current === '0' || state.current === 'Error') return;
  if (state.current.startsWith('-')) {
    state.current = state.current.slice(1);
  } else {
    state.current = '-' + state.current;
  }
  render();
}

/** Percent: divide current by 100 */
function percent() {
  if (state.current === 'Error') return;
  const val = parseFloat(state.current) / 100;
  state.current = formatNumber(val);
  render();
}

/* ── Override inputNumber to handle _awaitingSecond ─────────
   When an operator was just pressed, the next digit should
   replace the display rather than append to it.             */
const _originalInputNumber = inputNumber;
function smartInputNumber(digit) {
  if (state._awaitingSecond) {
    state.current         = digit;
    state._awaitingSecond = false;
    render();
    return;
  }
  _originalInputNumber(digit);
}

/* ── Button Click Handler ─────────────────────────────────── */
document.querySelector('.keypad').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;

  const { action, value } = btn.dataset;

  switch (action) {
    case 'number':   smartInputNumber(value); break;
    case 'decimal':  inputDecimal();          break;
    case 'operator': inputOperator(value);    break;
    case 'equals':   calculate(true);         break;
    case 'clear':    clearAll();              break;
    case 'delete':   deleteLast();            break;
    case 'sign':     toggleSign();            break;
    case 'percent':  percent();               break;
  }
});

/* ── Keyboard Support ─────────────────────────────────────── */
const KEY_MAP = {
  '0': () => smartInputNumber('0'),
  '1': () => smartInputNumber('1'),
  '2': () => smartInputNumber('2'),
  '3': () => smartInputNumber('3'),
  '4': () => smartInputNumber('4'),
  '5': () => smartInputNumber('5'),
  '6': () => smartInputNumber('6'),
  '7': () => smartInputNumber('7'),
  '8': () => smartInputNumber('8'),
  '9': () => smartInputNumber('9'),
  '.': () => inputDecimal(),
  ',': () => inputDecimal(),
  '+': () => inputOperator('+'),
  '-': () => inputOperator('−'),
  '*': () => inputOperator('×'),
  '/': () => inputOperator('÷'),
  'Enter':     () => calculate(true),
  '=':         () => calculate(true),
  'Backspace': () => deleteLast(),
  'Delete':    () => clearAll(),
  'Escape':    () => clearAll(),
  '%':         () => percent(),
};

/** Find the button element corresponding to a keyboard key */
function findButtonForKey(key) {
  const map = {
    '0': '[data-value="0"]',
    '1': '[data-value="1"]',
    '2': '[data-value="2"]',
    '3': '[data-value="3"]',
    '4': '[data-value="4"]',
    '5': '[data-value="5"]',
    '6': '[data-value="6"]',
    '7': '[data-value="7"]',
    '8': '[data-value="8"]',
    '9': '[data-value="9"]',
    '.': '[data-action="decimal"]',
    ',': '[data-action="decimal"]',
    '+': '[data-value="+"]',
    '-': '[data-value="−"]',
    '*': '[data-value="×"]',
    '/': '[data-value="÷"]',
    'Enter': '[data-action="equals"]',
    '=':     '[data-action="equals"]',
    'Backspace': '[data-action="delete"]',
    'Delete':    '[data-action="clear"]',
    'Escape':    '[data-action="clear"]',
    '%':         '[data-action="percent"]',
  };
  const selector = map[key];
  return selector ? document.querySelector(selector) : null;
}

document.addEventListener('keydown', (e) => {
  // Don't hijack browser shortcuts
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const handler = KEY_MAP[e.key];
  if (!handler) return;

  e.preventDefault();
  handler();
  animateButton(findButtonForKey(e.key));
});

/* ── Initial Render ───────────────────────────────────────── */
render();
