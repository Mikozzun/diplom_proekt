"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsController = void 0;
const common_1 = require("@nestjs/common");
let LogsController = class LogsController {
    dashboard() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Frogger — Live Logs</title>
<style>
  :root {
    --bg: #0d1117; --surface: #161b22; --border: #30363d;
    --text: #c9d1d9; --muted: #8b949e;
    --log: #58a6ff; --warn: #d29922; --error: #f85149;
    --debug: #8b949e; --verbose: #a371f7;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    background: var(--bg); color: var(--text);
    display: flex; flex-direction: column; height: 100vh;
  }

  /* ── Header ─────────────────────────────── */
  header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 20px; background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  header h1 { font-size: 16px; font-weight: 600; }
  header h1 span { color: var(--log); }
  .controls { display: flex; gap: 8px; align-items: center; }
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 12px; font-size: 11px;
    background: #1f6feb22; color: var(--log); border: 1px solid #1f6feb44;
  }
  .badge .dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #3fb950; animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%,100%{ opacity:1 } 50%{ opacity:.3 } }
  button {
    padding: 4px 12px; border-radius: 6px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text); cursor: pointer;
    font-size: 12px; font-family: inherit;
  }
  button:hover { background: var(--border); }

  /* ── Filters ────────────────────────────── */
  .filters {
    display: flex; gap: 6px; padding: 8px 20px;
    background: var(--surface); border-bottom: 1px solid var(--border);
  }
  .filters label {
    padding: 3px 10px; border-radius: 4px; font-size: 11px;
    cursor: pointer; user-select: none; border: 1px solid transparent;
  }
  .filters input { display: none; }
  .filters input:checked + span { border-color: var(--log); color: var(--log); }
  .filters label span {
    border: 1px solid var(--border); border-radius: 4px;
    padding: 3px 10px; display: inline-block;
  }

  /* ── Log list ───────────────────────────── */
  #log-container {
    flex: 1; overflow-y: auto; padding: 8px 0;
    scroll-behavior: smooth;
  }
  .log-row {
    display: flex; padding: 2px 20px; font-size: 12.5px;
    line-height: 1.6; border-left: 3px solid transparent;
  }
  .log-row:hover { background: #ffffff06; }
  .log-row .ts { color: var(--muted); min-width: 90px; flex-shrink: 0; }
  .log-row .lvl { min-width: 64px; flex-shrink: 0; font-weight: 600; }
  .log-row .ctx { color: #d2a8ff; min-width: 180px; flex-shrink: 0; }
  .log-row .msg { white-space: pre-wrap; word-break: break-all; }

  .log-row.LOG   { border-left-color: var(--log); }
  .log-row.LOG   .lvl { color: var(--log); }
  .log-row.WARN  { border-left-color: var(--warn); }
  .log-row.WARN  .lvl { color: var(--warn); }
  .log-row.ERROR { border-left-color: var(--error); }
  .log-row.ERROR .lvl { color: var(--error); }
  .log-row.DEBUG { border-left-color: var(--debug); }
  .log-row.DEBUG .lvl { color: var(--debug); }
  .log-row.VERBOSE { border-left-color: var(--verbose); }
  .log-row.VERBOSE .lvl { color: var(--verbose); }

  .empty {
    display: flex; align-items: center; justify-content: center;
    height: 100%; color: var(--muted); font-size: 14px;
  }

  /* ── Footer ─────────────────────────────── */
  footer {
    padding: 6px 20px; font-size: 11px; color: var(--muted);
    background: var(--surface); border-top: 1px solid var(--border);
    display: flex; justify-content: space-between;
  }
</style>
</head>
<body>
  <header>
    <h1>🐸 Frogger — <span>Live Logs</span></h1>
    <div class="controls">
      <div class="badge"><span class="dot"></span> connected</div>
      <button id="btn-scroll" title="Auto-scroll">⬇ Auto</button>
      <button id="btn-clear" title="Clear logs">🗑 Clear</button>
    </div>
  </header>

  <div class="filters" id="filters">
    <label><input type="checkbox" value="LOG" checked /><span>LOG</span></label>
    <label><input type="checkbox" value="WARN" checked /><span>WARN</span></label>
    <label><input type="checkbox" value="ERROR" checked /><span>ERROR</span></label>
    <label><input type="checkbox" value="DEBUG" checked /><span>DEBUG</span></label>
    <label><input type="checkbox" value="VERBOSE" checked /><span>VERBOSE</span></label>
  </div>

  <div id="log-container">
    <div class="empty" id="empty-msg">Waiting for logs…</div>
  </div>

  <footer>
    <span id="count">0 entries</span>
    <span id="status">connecting…</span>
  </footer>

<script src="/socket.io/socket.io.js"></script>
<script>
(function () {
  const container = document.getElementById('log-container');
  const emptyMsg  = document.getElementById('empty-msg');
  const countEl   = document.getElementById('count');
  const statusEl  = document.getElementById('status');
  const btnScroll = document.getElementById('btn-scroll');
  const btnClear  = document.getElementById('btn-clear');
  const filtersEl = document.getElementById('filters');

  let autoScroll = true;
  let entries = 0;
  const MAX_ENTRIES = 2000;

  // ── Visible levels ──────────────────────
  function visibleLevels() {
    return [...filtersEl.querySelectorAll('input:checked')].map(i => i.value);
  }
  filtersEl.addEventListener('change', () => {
    const levels = visibleLevels();
    container.querySelectorAll('.log-row').forEach(r => {
      r.style.display = levels.includes(r.dataset.level) ? '' : 'none';
    });
  });

  // ── Auto-scroll toggle ─────────────────
  btnScroll.addEventListener('click', () => {
    autoScroll = !autoScroll;
    btnScroll.textContent = autoScroll ? '⬇ Auto' : '⏸ Paused';
  });
  container.addEventListener('scroll', () => {
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 40;
    if (!atBottom && autoScroll) {
      autoScroll = false;
      btnScroll.textContent = '⏸ Paused';
    }
  });

  // ── Clear ───────────────────────────────
  btnClear.addEventListener('click', () => {
    container.innerHTML = '<div class="empty" id="empty-msg">Cleared – waiting for logs…</div>';
    entries = 0;
    countEl.textContent = '0 entries';
  });

  // ── Socket.IO ───────────────────────────
  const socket = io({ transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    statusEl.textContent = 'connected';
    document.querySelector('.badge').style.borderColor = '#3fb95044';
  });
  socket.on('disconnect', () => {
    statusEl.textContent = 'disconnected';
    document.querySelector('.badge').style.borderColor = '#f8514944';
    document.querySelector('.dot').style.background = '#f85149';
  });
  socket.on('connect_error', () => {
    statusEl.textContent = 'connection error';
  });

  socket.on('log', (entry) => {
    const em = container.querySelector('.empty');
    if (em) em.remove();

    // Cap entries
    if (entries >= MAX_ENTRIES) {
      const first = container.querySelector('.log-row');
      if (first) first.remove();
      entries--;
    }

    const row = document.createElement('div');
    row.className = 'log-row ' + entry.level;
    row.dataset.level = entry.level;

    const time = new Date(entry.timestamp).toLocaleTimeString();
    row.innerHTML =
      '<span class="ts">' + time + '</span>' +
      '<span class="lvl">' + entry.level + '</span>' +
      '<span class="ctx">[' + escapeHtml(entry.context) + ']</span>' +
      '<span class="msg">' + escapeHtml(entry.message) + '</span>';

    const levels = visibleLevels();
    if (!levels.includes(entry.level)) row.style.display = 'none';

    container.appendChild(row);
    entries++;
    countEl.textContent = entries + ' entries';

    if (autoScroll) container.scrollTop = container.scrollHeight;
  });

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
})();
</script>
</body>
</html>`;
    }
};
exports.LogsController = LogsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.Header)('Content-Type', 'text/html'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], LogsController.prototype, "dashboard", null);
exports.LogsController = LogsController = __decorate([
    (0, common_1.Controller)('logs')
], LogsController);
//# sourceMappingURL=logs.controller.js.map