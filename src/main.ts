import './style.css';
import {
  BOARD_SIZE,
  DIR,
  ROUND_SECONDS,
  formatTime,
  generateBoard,
  getPowered,
  isSolved,
  roomCode,
  rotateMask,
  utcSeed,
  type Board
} from './core';

type Status = 'idle' | 'playing' | 'paused' | 'won' | 'lost';
interface Session {
  rotations: number[];
  elapsed: number;
  turns: number;
  status: Status;
  assist: boolean;
}

const app = document.querySelector<HTMLDivElement>('#app')!;
const DEMO_SEED = 'SPROUT-7';
const MAX_SHARED_TURNS = 9_999;
const MAX_ASSIST_SECONDS = 86_400;
let cleanupGame: (() => void) | undefined;

function path(): string {
  return window.location.pathname.replace(/\/$/, '') || '/';
}

function navigate(to: string, replace = false): void {
  if (replace) history.replaceState({}, '', to);
  else history.pushState({}, '', to);
  renderRoute();
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-route]');
  if (!link || link.origin !== location.origin) return;
  event.preventDefault();
  navigate(`${link.pathname}${link.search}`);
});

window.addEventListener('popstate', renderRoute);

function shell(content: string, demo = false): string {
  return `
    <a class="skip-link" href="#main">Skip to main content</a>
    ${demo ? `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo</strong> — sample board, nothing is saved to your daily game. <span><button data-reset-demo>Reset demo</button><a data-route data-exit-demo href="/play">Start for real</a></span></aside>` : ''}
    <header class="site-header">
      <a class="wordmark" data-route href="/" aria-label="Seed Sprint home"><span aria-hidden="true">✦</span> Seed Sprint</a>
      <nav aria-label="Main navigation"><a data-route href="/demo">Demo</a><a data-route href="/privacy">Privacy</a><button class="quiet-button" data-help>Show instructions</button></nav>
    </header>
    <main id="main" tabindex="-1">${content}</main>
    <footer>
      <p><strong>Seed Sprint</strong> is a five-minute daily signal puzzle.</p>
      <nav aria-label="Footer navigation"><a data-route href="/privacy">Privacy</a><a data-route href="/terms">Terms</a><a href="https://hello-factory.sociobot.in" rel="noreferrer">Built by Param Factory <span class="sr-only">(external site)</span></a></nav>
      <p class="fine-print">Version 1.0.1 · Hero image generated for this game.</p>
    </footer>
    <div class="route-announcer sr-only" aria-live="polite"></div>
    <dialog class="help-dialog" aria-labelledby="help-title">
      <div class="dialog-cutout"><h2 id="help-title">How to play</h2><ol><li>Rotate tiles to join every green line.</li><li>Connect all three seeds to the sprout.</li><li>Finish before five minutes ends.</li></ol><p>Use arrow keys to move. Press R to rotate. Press P to pause.</p><button data-close-help>Close instructions</button></div>
    </dialog>`;
}

function bindShell(): void {
  const dialog = document.querySelector<HTMLDialogElement>('.help-dialog');
  document.querySelector<HTMLButtonElement>('[data-help]')?.addEventListener('click', () => dialog?.showModal());
  document.querySelector<HTMLButtonElement>('[data-close-help]')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function heroCopy(): string {
  return `<div class="hero-copy">
    <p class="eyebrow">A new board starts at the same time each day</p>
    <h1 tabindex="-1">Race the same signal puzzle</h1>
    <p class="lede">For puzzle friends who want one shared five-minute board without accounts or schedules.</p>
    <div class="hero-actions"><a class="button primary" data-route href="/demo">Try it with sample data</a><span>Opens a partly solved practice board.</span></div>
    <ul class="plain-facts" aria-label="Game facts"><li>Free to play</li><li>Works offline after your first visit</li><li>Progress stays on this device</li></ul>
  </div>`;
}

function renderHome(): void {
  setMetadata('Seed Sprint — play a daily signal puzzle', 'Rotate a shared five-minute signal puzzle, then compare results with friends through a link.', '/');
  const board = generateBoard(utcSeed());
  app.innerHTML = shell(`
    <section class="hero-section">
      <div class="hero-art" aria-hidden="true"><picture><source srcset="/art/seed-circuit-720.avif 720w, /art/seed-circuit-1200.avif 1200w" sizes="(max-width: 900px) 100vw, 86vw" type="image/avif"><source srcset="/art/seed-circuit-720.webp 720w, /art/seed-circuit-1200.webp 1200w" sizes="(max-width: 900px) 100vw, 86vw" type="image/webp"><img src="/art/seed-circuit-1200.jpg" width="1200" height="800" alt="" fetchpriority="high" decoding="async"></picture></div>
      ${heroCopy()}
      <div class="game-column" aria-label="Today's game preview">
        <div class="date-strip"><span>Today</span><strong>${escapeText(utcSeed())}</strong></div>
        <div class="board-shell preview-shell">${boardHtml(board, board.tiles.map((tile) => tile.startRotation), new Set())}<div class="preview-cover"><strong>Today’s board is ready</strong><span>Finish before the five-minute clock ends.</span><a class="button primary" data-route href="/play">Play today’s board</a></div></div>
      </div>
    </section>
    <section class="how-section" aria-labelledby="how-heading"><div><h2 id="how-heading">How it works</h2></div><ol class="steps"><li><strong>Rotate the tiles.</strong><span>Join every line from the seeds to the sprout.</span></li><li><strong>Beat five minutes.</strong><span>The board is identical for everyone that day.</span></li><li><strong>Share your result.</strong><span>Share a result card that hides the board, or send the board link.</span></li></ol></section>
    <section class="privacy-section" aria-labelledby="limits-heading"><div><h2 id="limits-heading">A small daily game</h2><p>There is no chat, account, live lobby, or endless puzzle feed.</p></div><div><h3>Data saved in this browser</h3><p>The game saves progress in this browser. Shared links include only the board code, time, turns, and result.</p></div></section>
  `);
  bindShell();
}

function storageKey(seed: string, demo: boolean): string {
  return `${demo ? 'demo:' : 'daily:'}session:${seed}`;
}

function initialSession(board: Board, demo: boolean): Session {
  const rotations = board.tiles.map((tile) => tile.startRotation);
  if (demo) {
    let solved = 0;
    for (let index = 0; index < rotations.length && solved < 8; index += 1) {
      if (board.tiles[index].kind === 'route') {
        rotations[index] = 0;
        solved += 1;
      }
    }
  }
  return { rotations, elapsed: demo ? 42 : 0, turns: demo ? 11 : 0, status: demo ? 'playing' : 'idle', assist: false };
}

function loadSession(board: Board, demo: boolean): Session {
  try {
    const key = storageKey(board.seed, demo);
    const parsed: unknown = JSON.parse(localStorage.getItem(key) || 'null');
    if (isValidSession(parsed, board)) return parsed;
    if (parsed !== null) localStorage.removeItem(key);
  } catch {
    // A malformed local entry should not stop a game.
  }
  return initialSession(board, demo);
}

function isValidSession(value: unknown, board: Board): value is Session {
  if (!value || typeof value !== 'object') return false;
  const session = value as Record<string, unknown>;
  const rotations = session.rotations;
  const status = session.status;
  const elapsed = session.elapsed;
  const turns = session.turns;
  const assist = session.assist;
  if (!Array.isArray(rotations) || rotations.length !== board.tiles.length || !rotations.every((rotation) => Number.isInteger(rotation) && rotation >= 0 && rotation <= 3)) return false;
  if (!['idle', 'playing', 'paused', 'won', 'lost'].includes(String(status))) return false;
  if (typeof assist !== 'boolean' || typeof elapsed !== 'number' || !Number.isFinite(elapsed) || elapsed < 0) return false;
  if (typeof turns !== 'number' || !Number.isSafeInteger(turns) || turns < 0 || turns > MAX_SHARED_TURNS) return false;
  if (elapsed > (assist ? MAX_ASSIST_SECONDS : ROUND_SECONDS)) return false;
  if (status === 'idle' && (elapsed !== 0 || turns !== 0)) return false;
  if (status === 'lost' && (assist || elapsed !== ROUND_SECONDS)) return false;
  if (status === 'won' && !isSolved(board, rotations)) return false;
  if ((status === 'playing' || status === 'paused') && !assist && elapsed >= ROUND_SECONDS) return false;
  return true;
}

function saveSession(board: Board, session: Session, demo: boolean): void {
  try {
    localStorage.setItem(storageKey(board.seed, demo), JSON.stringify(session));
  } catch {
    announce('This browser could not save progress. Keep this tab open to finish the board.');
  }
}

function renderGamePage(demo: boolean): void {
  const params = new URLSearchParams(location.search);
  const seed = demo ? DEMO_SEED : params.get('seed') || utcSeed();
  const room = params.get('room');
  const board = generateBoard(seed);
  const session = loadSession(board, demo);
  setMetadata(
    `${demo ? 'Demo' : 'Play'} — Seed Sprint`,
    demo ? 'Try the partly solved Seed Sprint sample board. Demo play is separate from your daily game.' : 'Play a five-minute signal-routing board and share a result when you finish.',
    demo ? '/demo' : '/play'
  );
  app.innerHTML = shell(`
    <section class="play-page">
      <div class="play-heading"><div><p class="eyebrow">${demo ? 'Practice board · SPROUT-7' : room ? `Room ${escapeText(room)}` : seed === utcSeed() ? 'Today’s board' : 'Shared board'}</p><h1 tabindex="-1">Connect every seed to the sprout</h1></div><p>Rotate tiles. Each connected line turns green.</p></div>
      <div class="game-layout">
        <section class="game-panel" aria-label="Signal puzzle">
          <div class="game-toolbar"><div class="timer-block"><span>${session.assist ? 'Assist mode' : 'Time left'}</span><strong data-timer>${session.assist ? 'No limit' : formatTime(ROUND_SECONDS - session.elapsed)}</strong></div><div class="toolbar-actions"><button data-pause ${session.status !== 'playing' ? 'disabled' : ''}>Pause</button><button data-assist aria-pressed="${session.assist}">${session.assist ? 'Use timer' : 'Remove timer'}</button></div></div>
          <div class="board-shell" data-board-shell>${boardHtml(board, session.rotations, getPowered(board, session.rotations))}${statusOverlay(session, demo)}</div>
          <p class="board-status" data-status aria-live="polite">${statusText(board, session)}</p>
        </section>
        <div class="run-notes" role="region" aria-label="Board details"><div><span>Board code</span><strong>${escapeText(seed)}</strong></div><div><span>Turns</span><strong data-turns>${session.turns}</strong></div><button data-copy-room>Copy board link</button><p>Friends can play this exact board at any time.</p><section class="share-recovery room-share-recovery" data-room-share-fallback hidden aria-live="polite"><strong>Copy this board link</strong><label for="same-board-link">Your browser blocked copying. Select this fixed link and copy it yourself.</label><input id="same-board-link" data-same-board-link type="url" readonly></section></div>
      </div>
      ${demo ? '' : renderRecentResults()}
    </section>
  `, demo);
  bindShell();
  startGame(board, session, demo);
}

function boardHtml(board: Board, rotations: number[], powered: Set<number>): string {
  const tiles = board.tiles.map((tile, index) => {
    if (tile.kind === 'empty') return `<div class="tile empty" role="presentation"><span aria-hidden="true">·</span></div>`;
    const actualMask = rotateMask(tile.mask, rotations[index]);
    const row = Math.floor(index / BOARD_SIZE) + 1;
    const col = (index % BOARD_SIZE) + 1;
    const directions = directionWords(actualMask);
    const arms = [DIR.n, DIR.e, DIR.s, DIR.w].filter((bit) => tile.mask & bit).map((bit) => `<i class="arm arm-${bit}"></i>`).join('');
    return `<button class="tile route r${rotations[index]} ${powered.has(index) ? 'powered' : ''}" data-tile="${index}" aria-label="Row ${row}, column ${col}: ${tile.marker ? `${tile.marker} tile, ` : ''}lines point ${directions}. Rotate clockwise."><span class="pipe" aria-hidden="true">${arms}<i class="hub"></i></span>${tile.marker ? `<span class="marker ${tile.marker}" aria-hidden="true">${tile.marker === 'sprout' ? '♣' : '◆'}</span>` : ''}</button>`;
  }).join('');
  return `<div class="board" role="group" aria-label="Six by six signal board">${tiles}</div>`;
}

function directionWords(mask: number): string {
  const words: string[] = [];
  if (mask & DIR.n) words.push('up');
  if (mask & DIR.e) words.push('right');
  if (mask & DIR.s) words.push('down');
  if (mask & DIR.w) words.push('left');
  return words.join(' and ');
}

function statusText(board: Board, session: Session): string {
  if (session.status === 'won') return `Connected in ${formatTime(session.elapsed)} with ${session.turns} turns.`;
  if (session.status === 'lost') return 'Time ended. Restart this board to try again.';
  const connected = getPowered(board, session.rotations).size;
  const total = board.tiles.filter((tile) => tile.kind === 'route').length;
  return `${connected} of ${total} route tiles connected.`;
}

function statusOverlay(session: Session, demo: boolean): string {
  if (session.status === 'idle') return `<div class="game-overlay"><strong>Ready for today’s board?</strong><span>The clock starts when you press play.</span><button class="button primary" data-start>Start five-minute board</button></div>`;
  if (session.status === 'paused') return `<div class="game-overlay"><strong>Game paused</strong><span>Your time is stopped.</span><button class="button primary" data-resume>Resume board</button></div>`;
  if (session.status === 'won' || session.status === 'lost') {
    const won = session.status === 'won';
    return `<div class="game-overlay result-overlay"><div class="result-stamp ${won ? 'won' : 'lost'}"><span>${won ? 'Connected' : 'Time ended'}</span><strong>${won ? formatTime(session.elapsed) : '5:00'}</strong><small>${session.turns} turns · ${session.assist ? 'assist' : 'timed'}</small></div><div class="result-actions"><button class="button primary" data-share-result>Copy result</button><button data-restart>${demo ? 'Reset demo' : 'Play again'}</button></div><section class="share-recovery" data-share-fallback hidden aria-live="polite"><strong>Copy this result link</strong><label for="shared-result-link">Your browser blocked copying. Select this link and copy it yourself.</label><input id="shared-result-link" data-shared-result-link type="url" readonly></section></div>`;
  }
  return '';
}

function startGame(board: Board, session: Session, demo: boolean): void {
  cleanupGame?.();
  let selected = board.tiles.findIndex((tile) => tile.kind === 'route');
  let frame = 0;
  let lastTime = performance.now();
  let lastSavedSecond = Math.floor(session.elapsed);
  let lastTimerText = session.assist ? 'No limit' : formatTime(ROUND_SECONDS - session.elapsed);
  const shellElement = document.querySelector<HTMLElement>('[data-board-shell]')!;

  function refreshBoard(focusIndex?: number): void {
    shellElement.innerHTML = `${boardHtml(board, session.rotations, getPowered(board, session.rotations))}${statusOverlay(session, demo)}`;
    bindGameControls();
    if (focusIndex !== undefined) shellElement.querySelector<HTMLButtonElement>(`[data-tile="${focusIndex}"]`)?.focus();
    document.querySelector('[data-turns]')!.textContent = String(session.turns);
    document.querySelector('[data-status]')!.textContent = statusText(board, session);
    const timer = document.querySelector<HTMLElement>('[data-timer]');
    lastTimerText = session.assist ? 'No limit' : formatTime(ROUND_SECONDS - session.elapsed);
    if (timer) timer.textContent = lastTimerText;
    const pause = document.querySelector<HTMLButtonElement>('[data-pause]');
    if (pause) pause.disabled = session.status !== 'playing';
  }

  function rotate(index: number): void {
    if (session.status !== 'playing' || board.tiles[index].kind === 'empty') return;
    selected = index;
    session.rotations[index] = (session.rotations[index] + 1) % 4;
    session.turns += 1;
    if (isSolved(board, session.rotations)) {
      session.status = 'won';
      saveCompletion(board.seed, session, demo);
    }
    saveSession(board, session, demo);
    refreshBoard(index);
  }

  function bindGameControls(): void {
    shellElement.querySelectorAll<HTMLButtonElement>('[data-tile]').forEach((button) => {
      button.addEventListener('focus', () => { selected = Number(button.dataset.tile); });
      button.addEventListener('click', () => rotate(Number(button.dataset.tile)));
    });
    shellElement.querySelector<HTMLButtonElement>('[data-start]')?.addEventListener('click', () => { session.status = 'playing'; saveSession(board, session, demo); refreshBoard(selected); });
    shellElement.querySelector<HTMLButtonElement>('[data-resume]')?.addEventListener('click', () => { session.status = 'playing'; lastTime = performance.now(); saveSession(board, session, demo); refreshBoard(selected); });
    shellElement.querySelector<HTMLButtonElement>('[data-restart]')?.addEventListener('click', reset);
    shellElement.querySelector<HTMLButtonElement>('[data-share-result]')?.addEventListener('click', copyResult);
  }

  function reset(): void {
    try { localStorage.removeItem(storageKey(board.seed, demo)); } catch { /* Continue with an in-memory reset. */ }
    const fresh = initialSession(board, demo);
    Object.assign(session, fresh);
    lastTime = performance.now();
    lastSavedSecond = Math.floor(session.elapsed);
    refreshBoard(selected);
  }

  async function copyResult(): Promise<void> {
    const iconRow = session.status === 'won' ? '🟩🟩🟩🟩🟩🟩' : '🟧🟧🟧🟧🟧🟧';
    const url = new URL('/result', location.origin);
    url.searchParams.set('seed', board.seed);
    url.searchParams.set('status', session.status);
    url.searchParams.set('time', String(Math.floor(session.elapsed)));
    url.searchParams.set('turns', String(session.turns));
    const text = `Seed Sprint ${board.seed}\n${iconRow}\n${session.status === 'won' ? `${formatTime(session.elapsed)} · ${session.turns} turns` : 'Time ended'}\n${url}`;
    const copied = await copyText(text);
    if (copied) {
      announce('Result copied. It does not reveal the board layout.');
      return;
    }
    const fallback = shellElement.querySelector<HTMLElement>('[data-share-fallback]');
    const field = shellElement.querySelector<HTMLInputElement>('[data-shared-result-link]');
    if (fallback && field) {
      field.value = String(url);
      fallback.hidden = false;
      field.focus();
      field.select();
    }
    announce('Copying was blocked. The result link is ready to select and copy.');
  }

  document.querySelector<HTMLButtonElement>('[data-pause]')?.addEventListener('click', () => { if (session.status === 'playing') { session.status = 'paused'; saveSession(board, session, demo); refreshBoard(); } });
  document.querySelector<HTMLButtonElement>('[data-assist]')?.addEventListener('click', (event) => {
    session.assist = !session.assist;
    (event.currentTarget as HTMLButtonElement).setAttribute('aria-pressed', String(session.assist));
    saveSession(board, session, demo);
    renderGamePage(demo);
  });
  document.querySelector<HTMLButtonElement>('[data-copy-room]')?.addEventListener('click', async () => {
    const url = new URL('/play', location.origin);
    url.searchParams.set('seed', board.seed);
    url.searchParams.set('room', roomCode(board.seed));
    const copied = await copyText(String(url));
    if (copied) {
      announce('Board link copied.');
      return;
    }
    const fallback = document.querySelector<HTMLElement>('[data-room-share-fallback]');
    const field = document.querySelector<HTMLInputElement>('[data-same-board-link]');
    if (fallback && field) {
      field.value = String(url);
      fallback.hidden = false;
      field.focus();
      field.select();
    }
    announce('Copying was blocked. The fixed board link is ready to select and copy.');
  });
  document.querySelector<HTMLButtonElement>('[data-reset-demo]')?.addEventListener('click', reset);
  document.querySelector<HTMLButtonElement>('[data-clear-history]')?.addEventListener('click', () => {
    if (!confirm('Clear all saved recent results from this browser?')) return;
    try {
      localStorage.removeItem('daily:completions');
      renderGamePage(false);
      announce('Recent results cleared.');
    } catch {
      announce('This browser could not clear recent results. Try clearing site storage in your browser settings.');
    }
  });
  document.querySelector<HTMLAnchorElement>('[data-exit-demo]')?.addEventListener('click', () => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('demo:')) localStorage.removeItem(key);
  });

  function onKey(event: KeyboardEvent): void {
    if (event.key.toLowerCase() === 'p') {
      if (session.status === 'playing') { session.status = 'paused'; refreshBoard(); }
      else if (session.status === 'paused') { session.status = 'playing'; lastTime = performance.now(); refreshBoard(selected); }
      saveSession(board, session, demo);
      return;
    }
    if (session.status !== 'playing') return;
    if (event.key.toLowerCase() === 'r') { event.preventDefault(); rotate(selected); return; }
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -BOARD_SIZE, ArrowDown: BOARD_SIZE };
    const delta = moves[event.key];
    if (!delta) return;
    event.preventDefault();
    let next = selected;
    do {
      next += delta;
    } while (next >= 0 && next < board.tiles.length && board.tiles[next].kind === 'empty');
    const sameRow = Math.floor(next / BOARD_SIZE) === Math.floor(selected / BOARD_SIZE);
    if (next >= 0 && next < board.tiles.length && (Math.abs(delta) === BOARD_SIZE || sameRow)) {
      selected = next;
      shellElement.querySelector<HTMLButtonElement>(`[data-tile="${selected}"]`)?.focus();
    }
  }

  window.addEventListener('keydown', onKey);
  function visibility(): void {
    if (document.hidden && session.status === 'playing') {
      session.status = 'paused';
      saveSession(board, session, demo);
      refreshBoard();
    }
  }
  document.addEventListener('visibilitychange', visibility);

  function tick(now: number): void {
    const delta = Math.min((now - lastTime) / 1000, 0.25);
    lastTime = now;
    if (session.status === 'playing') {
      session.elapsed += delta;
      if (!session.assist && session.elapsed >= ROUND_SECONDS) {
        session.elapsed = ROUND_SECONDS;
        session.status = 'lost';
        saveCompletion(board.seed, session, demo);
        refreshBoard();
      }
      const timerText = session.assist ? 'No limit' : formatTime(ROUND_SECONDS - session.elapsed);
      if (timerText !== lastTimerText) {
        const timer = document.querySelector<HTMLElement>('[data-timer]');
        if (timer) timer.textContent = timerText;
        lastTimerText = timerText;
      }
      if (Math.floor(session.elapsed) !== lastSavedSecond) {
        lastSavedSecond = Math.floor(session.elapsed);
        saveSession(board, session, demo);
      }
    }
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  bindGameControls();
  cleanupGame = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', visibility);
  };
}

function saveCompletion(seed: string, session: Session, demo: boolean): void {
  if (demo) return;
  try {
    const history = JSON.parse(localStorage.getItem('daily:completions') || '[]') as Array<Record<string, unknown>>;
    const next = history.filter((entry) => entry.seed !== seed);
    next.push({ seed, status: session.status, time: Math.floor(session.elapsed), turns: session.turns });
    localStorage.setItem('daily:completions', JSON.stringify(next.slice(-14)));
  } catch {
    announce('The result is ready, but this browser could not save it.');
  }
}

interface Completion {
  seed: string;
  status: 'won' | 'lost';
  time: number;
  turns: number;
}

function readCompletions(): Completion[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem('daily:completions') || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is Completion => {
      if (!entry || typeof entry !== 'object') return false;
      const result = entry as Record<string, unknown>;
      return typeof result.seed === 'string' && /^[A-Za-z0-9][A-Za-z0-9-]{0,39}$/.test(result.seed)
        && (result.status === 'won' || result.status === 'lost')
        && Number.isInteger(result.time) && Number(result.time) >= 0 && Number(result.time) <= ROUND_SECONDS
        && Number.isSafeInteger(result.turns) && Number(result.turns) >= 0 && Number(result.turns) <= MAX_SHARED_TURNS;
    }).slice(-14).reverse();
  } catch {
    return [];
  }
}

function completionLabel(entry: Completion): string {
  return entry.status === 'won' ? `Connected in ${formatTime(entry.time)}` : 'Time ended';
}

function renderRecentResults(): string {
  const entries = readCompletions();
  const list = entries.length
    ? `<ol class="recent-list">${entries.map((entry) => `<li><div><strong>${escapeText(entry.seed)}</strong><span>${completionLabel(entry)} · ${entry.turns} turns</span></div><span class="recent-actions"><a data-route href="/play?seed=${encodeURIComponent(entry.seed)}">Replay</a><a data-route href="/result?seed=${encodeURIComponent(entry.seed)}&status=${entry.status}&time=${entry.time}&turns=${entry.turns}">View result</a></span></li>`).join('')}</ol>`
    : '<p class="recent-empty">Finished boards will appear here. Play today’s board to save one in this browser.</p>';
  return `<section class="recent-results" role="region" aria-labelledby="recent-results-heading"><div><h2 id="recent-results-heading">Recent results</h2><p>Your last 14 finished boards stay in this browser.</p></div>${list}${entries.length ? '<button data-clear-history>Clear recent results</button>' : ''}<p class="history-message" data-history-message aria-live="polite"></p></section>`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.append(area);
      area.select();
      const copied = document.execCommand('copy');
      area.remove();
      return copied;
    } catch {
      return false;
    }
  }
}

function announce(message: string): void {
  const live = document.querySelector<HTMLElement>('.route-announcer');
  if (live) live.textContent = message;
}

interface SharedResult {
  seed: string;
  status: 'won' | 'lost';
  seconds: number;
  turns: number;
}

function wholeNumberInRange(value: string | null, minimum: number, maximum: number): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= minimum && number <= maximum ? number : null;
}

function parseSharedResult(params: URLSearchParams): SharedResult | null {
  const seed = params.get('seed');
  const status = params.get('status');
  const seconds = wholeNumberInRange(params.get('time'), 0, ROUND_SECONDS);
  const turns = wholeNumberInRange(params.get('turns'), 0, MAX_SHARED_TURNS);
  if (!seed || !/^[A-Za-z0-9][A-Za-z0-9-]{0,39}$/.test(seed) || (status !== 'won' && status !== 'lost') || seconds === null || turns === null) return null;
  if (status === 'lost' && seconds !== ROUND_SECONDS) return null;
  return { seed, status, seconds, turns };
}

function renderResult(): void {
  const result = parseSharedResult(new URLSearchParams(location.search));
  setMetadata('Shared result — Seed Sprint', 'A Seed Sprint result card shows a time and turn count without showing the board layout.', '/result');
  if (!result) {
    app.innerHTML = shell(`<section class="simple-page result-page invalid-result"><p class="eyebrow">Shared result</p><h1 tabindex="-1">This result link is incomplete</h1><p>Ask your friend to resend the result link, or open a board to play your own round.</p><a class="button primary" data-route href="/play">Play today’s board</a></section>`);
    bindShell();
    return;
  }
  const won = result.status === 'won';
  app.innerHTML = shell(`<section class="simple-page result-page"><p class="eyebrow">Shared result · ${escapeText(result.seed)}</p><h1 tabindex="-1">${won ? 'This board was connected' : 'This board beat the clock'}</h1><div class="shared-card"><div aria-hidden="true">${won ? '🟩 🟩 🟩 🟩 🟩 🟩' : '🟧 🟧 🟧 🟧 🟧 🟧'}</div><strong>${won ? formatTime(result.seconds) : '5:00'}</strong><span>${result.turns} turns</span></div><p>The card hides the tile layout. Play the same board before comparing routes.</p><a class="button primary" data-route href="/play?seed=${encodeURIComponent(result.seed)}">Play this board</a></section>`);
  bindShell();
}

function renderLegal(kind: 'privacy' | 'terms'): void {
  const privacy = kind === 'privacy';
  setMetadata(`${privacy ? 'Privacy' : 'Terms'} — Seed Sprint`, privacy ? 'Learn what Seed Sprint saves in this browser and what a shared result link contains.' : 'Read the terms for playing Seed Sprint.', privacy ? '/privacy' : '/terms');
  app.innerHTML = shell(`<article class="simple-page"><p class="eyebrow">Seed Sprint</p><h1 tabindex="-1">${privacy ? 'Privacy in plain words' : 'Terms of play'}</h1>${privacy ? `<h2>Data saved on this device</h2><p>Seed Sprint saves your current board, settings, and recent results in local storage. Demo play uses separate keys that start with <code>demo:</code>.</p><h2>Data sent elsewhere</h2><p>The static game does not send gameplay or personal data to a server. A result link contains the board code, result, time, and turn count you choose to share.</p><h2>Removing data</h2><p>Clear this site’s storage in your browser to remove every saved board and setting.</p>` : `<h2>Use the game responsibly</h2><p>Seed Sprint is free for personal play. Do not disrupt the site or present the game as your own service.</p><h2>No warranty</h2><p>The game is provided as available, without a promise that access will never be interrupted.</p><h2>Your choices</h2><p>You choose whether to copy or send a result link. Shared links can be read by anyone who receives them.</p>`}<p>Last updated: 2 September 2026.</p></article>`);
  bindShell();
}

function renderNotFound(): void {
  setMetadata('Page not found — Seed Sprint', 'This Seed Sprint board link does not exist. Open today’s board to play.', '/404');
  app.innerHTML = shell(`<section class="simple-page not-found"><div class="lost-seed" aria-hidden="true">◆</div><p class="eyebrow">404</p><h1 tabindex="-1">This board link does not exist</h1><p>The address may be incomplete. Return to today’s puzzle.</p><a class="button primary" data-route href="/">Open today’s board</a></section>`);
  bindShell();
}

function escapeText(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}

function setMetadata(title: string, description: string, route: string): void {
  const url = `https://seed-sprint.sociobot.in${route}`;
  document.title = title;
  const values: Record<string, string> = {
    'meta[name="description"]': description,
    'link[rel="canonical"]': url,
    'meta[property="og:title"]': title,
    'meta[property="og:description"]': description,
    'meta[property="og:url"]': url,
    'meta[name="twitter:title"]': title,
    'meta[name="twitter:description"]': description
  };
  for (const [selector, value] of Object.entries(values)) {
    const element = document.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
    if (element instanceof HTMLLinkElement) element.href = value;
    else if (element) element.content = value;
  }
}

function renderRoute(): void {
  cleanupGame?.();
  cleanupGame = undefined;
  const route = path();
  if (route === '/') renderHome();
  else if (route === '/demo') renderGamePage(true);
  else if (route === '/play') renderGamePage(false);
  else if (route === '/result') renderResult();
  else if (route === '/privacy') renderLegal('privacy');
  else if (route === '/terms') renderLegal('terms');
  else renderNotFound();
  const heading = document.querySelector<HTMLElement>('h1');
  requestAnimationFrame(() => heading?.focus({ preventScroll: true }));
  announce(heading?.textContent || document.title);
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const replacingActiveWorker = Boolean(navigator.serviceWorker.controller);
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!replacingActiveWorker || reloading) return;
      reloading = true;
      location.reload();
    });
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch(() => undefined);
  });
}

renderRoute();
