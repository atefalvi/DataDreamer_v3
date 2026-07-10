/**
 * Orby chat widget — self-contained, dependency-free, Shadow DOM isolated.
 *
 * Embed:  <script src="https://chat.data-dreamer.net/widget.js" data-site="datadreamer" defer></script>
 *
 * Fail-closed by design: if the API is down, /api/boot fails, or Directus has
 * `enabled=false`, nothing renders and the host page is untouched. No globals are
 * exported; all styles live inside a shadow root. Sprite animation reads
 * /orby/manifest.json — frame counts are data, never hardcoded here.
 */
(() => {
  'use strict';

  const script = document.currentScript;
  if (!script || !script.src) return;
  const API = new URL(script.src).origin;

  /* ── tokens (DataDreamer dark observatory) ── */
  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; margin: 0; font-family: -apple-system, 'Inter', 'Segoe UI', system-ui, sans-serif; }
    button { cursor: pointer; border: 0; background: none; color: inherit; font: inherit; }

    .sprite {
      display: block;
      background-repeat: no-repeat;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }

    .launcher {
      position: fixed;
      right: max(16px, env(safe-area-inset-right));
      bottom: max(16px, env(safe-area-inset-bottom));
      width: 64px; height: 64px;
      padding: 0;
      border-radius: 18px;
      z-index: 2147483000;
      transition: transform .15s ease;
      filter: drop-shadow(0 6px 18px rgba(0,0,0,.45));
    }
    .launcher:hover { transform: translateY(-2px) scale(1.04); }
    .launcher:focus-visible { outline: 3px solid #FF5C38; outline-offset: 3px; }
    .launcher .sprite { width: 64px; height: 64px; }

    .panel {
      position: fixed;
      right: max(16px, env(safe-area-inset-right));
      bottom: calc(max(16px, env(safe-area-inset-bottom)) + 76px);
      /* desktop: ~38vw within sane bounds; host page stays visible */
      width: clamp(360px, 38vw, 520px);
      height: min(78dvh, 760px);
      display: none; flex-direction: column;
      background: #0A0C10;
      color: #EDEFF3;
      border: 1px solid #2E3744;
      border-radius: 16px;
      overflow: hidden;
      z-index: 2147483001;
      box-shadow: 0 24px 64px rgba(0,0,0,.55);
    }
    .panel.open { display: flex; }

    /* tablet: a roomier panel, still floating */
    @media (min-width: 641px) and (max-width: 1024px) {
      .panel { width: clamp(400px, 52vw, 560px); height: min(74dvh, 700px); }
    }

    /* mobile: full-screen sheet on the dynamic viewport, safe areas respected */
    @media (max-width: 640px) {
      .panel {
        inset: 0; width: auto; height: 100dvh; border-radius: 0; border: 0;
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
      }
    }

    .head {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px;
      background: #0F1318;
      border-bottom: 1px solid #1F262F;
      flex-shrink: 0;
    }
    .head .sprite { width: 36px; height: 36px; }
    .head-name { font-weight: 700; font-size: 15px; letter-spacing: .3px; }
    .head-status { font-size: 11px; color: #858E99; font-family: ui-monospace, monospace; }
    .close {
      margin-left: auto;
      width: 44px; height: 44px;
      display: grid; place-items: center;
      border-radius: 12px;
      color: #A8B1BD;
      font-size: 22px; line-height: 1;
    }
    .close:hover { background: #161B22; color: #EDEFF3; }
    .close:focus-visible { outline: 2px solid #FF5C38; outline-offset: 2px; }

    .log {
      flex: 1; overflow-y: auto;
      padding: 16px 14px;
      display: flex; flex-direction: column; gap: 10px;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }
    .msg { max-width: 86%; padding: 10px 13px; border-radius: 14px; font-size: 14px; line-height: 1.55; white-space: pre-wrap; word-wrap: break-word; }
    .msg.user { align-self: flex-end; background: #FF5C38; color: #1A0E09; border-bottom-right-radius: 4px; font-weight: 500; }
    .msg.orby { align-self: flex-start; background: #161B22; border: 1px solid #1F262F; border-bottom-left-radius: 4px; }
    .msg.orby a { color: #FF8A66; }
    .msg.notice { align-self: center; background: none; color: #858E99; font-size: 12px; text-align: center; }

    .sources { align-self: flex-start; display: flex; flex-wrap: wrap; gap: 6px; max-width: 86%; }
    .sources a {
      font-size: 11px; font-family: ui-monospace, monospace;
      color: #A8B1BD; text-decoration: none;
      padding: 3px 10px; border: 1px solid #2E3744; border-radius: 999px;
    }
    .sources a:hover { color: #FF5C38; border-color: #FF5C38; }

    .handoff {
      align-self: flex-start;
      display: inline-block; margin-top: 2px;
      padding: 9px 16px; border-radius: 999px;
      background: #FF5C38; color: #1A0E09;
      font-size: 13px; font-weight: 700; text-decoration: none;
    }

    .composer {
      display: flex; gap: 8px; align-items: flex-end;
      padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
      background: #0F1318; border-top: 1px solid #1F262F;
      flex-shrink: 0;
    }
    .composer textarea {
      flex: 1; resize: none;
      max-height: 110px;
      padding: 10px 12px;
      background: #0A0C10; color: #EDEFF3;
      border: 1px solid #2E3744; border-radius: 12px;
      font-size: 14px; line-height: 1.45;
    }
    .composer textarea:focus { outline: none; border-color: #FF5C38; }
    .send {
      width: 42px; height: 42px; flex-shrink: 0;
      display: grid; place-items: center;
      background: #FF5C38; border-radius: 12px; color: #1A0E09;
    }
    .send:disabled { opacity: .4; cursor: default; }
    .send:focus-visible { outline: 2px solid #EDEFF3; outline-offset: 2px; }

    .typing { align-self: flex-start; color: #858E99; font-size: 12px; padding-left: 4px; display: none; }
    .typing.on { display: block; }

    .status {
      align-self: flex-end;
      margin: -6px 4px 0 0;
      font-size: 10.5px;
      font-family: ui-monospace, monospace;
      color: #858E99;
    }
    .status.sent { color: #6BCF8E; }
    .status button {
      color: #FF8A66; font-size: 10.5px; font-family: inherit;
      text-decoration: underline; padding: 4px; margin: -4px;
    }

    @media (prefers-reduced-motion: reduce) {
      .launcher { transition: none; }
      .launcher:hover { transform: none; }
    }
  `;

  /* ── sprite engine: manifest-driven, priority state machine ── */
  const PRIORITY = { error: 3, warning: 3, offline: 3, worried: 2, confused: 2, no: 2 };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  class Sprite {
    constructor(el, manifest) {
      this.el = el;
      this.manifest = manifest;
      this.timer = null;
      this.state = null;
      this.pendingRevert = null;
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.pause(); else this.resume();
      });
    }
    idleName() {
      const idles = ['idle1', 'idle2', 'idle3'].filter((n) => this.manifest.states[n]);
      return idles.length ? idles[Math.floor(Math.random() * idles.length)] : this.manifest.defaultState;
    }
    set(name, { force = false } = {}) {
      const states = this.manifest.states;
      let def = states[name] || states[(states[name] || {}).fallback] || states[this.manifest.defaultState];
      if (!states[name]) name = this.manifest.defaultState;
      if (!def) return;
      if (!force && this.state && (PRIORITY[this.state] || 0) > (PRIORITY[name] || 0) && this.pendingRevert) return;
      this.state = name;
      clearTimeout(this.pendingRevert); this.pendingRevert = null;
      clearInterval(this.timer); this.timer = null;

      const { frames } = def;
      this.el.style.backgroundImage = `url(${API}${def.src})`;
      this.el.style.backgroundSize = `${frames * 100}% 100%`;
      const setFrame = (i) => {
        this.el.style.backgroundPositionX = frames > 1 ? `${(i / (frames - 1)) * 100}%` : '0%';
      };
      setFrame(def.reducedMotionFrame || 0);
      if (reducedMotion.matches || frames < 2) return;

      let frame = 0;
      const interval = 1000 / (def.fps || 8);
      this.timer = setInterval(() => {
        frame += 1;
        if (frame >= frames) {
          if (def.loop) { frame = 0; }
          else {
            clearInterval(this.timer); this.timer = null;
            this.pendingRevert = setTimeout(() => {
              this.pendingRevert = null;
              this.set(this.idleName(), { force: true });
            }, def.holdLastFrameMs || 400);
            return;
          }
        }
        setFrame(frame);
      }, interval);
      this._current = { def, setFrame };
    }
    pause() { clearInterval(this.timer); this.timer = null; }
    resume() { if (this.state) this.set(this.state, { force: true }); }
    destroy() { clearInterval(this.timer); clearTimeout(this.pendingRevert); }
  }

  /* ── identity ── */
  const visitorId = (() => {
    try {
      let id = localStorage.getItem('orby_visitor');
      if (!id) {
        id = crypto.randomUUID() + '-' + Date.now().toString(36);
        localStorage.setItem('orby_visitor', id);
      }
      return id;
    } catch { return crypto.randomUUID(); }
  })();
  let sessionId = null;
  try { sessionId = sessionStorage.getItem('orby_session'); } catch { /* private mode */ }

  /* ── boot (fail closed) ── */
  async function boot() {
    let config, manifest;
    try {
      const [bootRes, manifestRes] = await Promise.all([
        fetch(`${API}/api/boot`, { mode: 'cors' }),
        fetch(`${API}/orby/manifest.json`, { mode: 'cors' }),
      ]);
      if (!bootRes.ok || !manifestRes.ok) return;
      config = await bootRes.json();
      manifest = await manifestRes.json();
    } catch { return; }
    if (!config.enabled || !manifest || !manifest.states) return;
    mount(config, manifest);
  }

  function el(tag, className, attrs = {}) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }

  function mount(config, manifest) {
    const host = el('div', '', { 'data-orby': '' });
    // 'open' keeps CSS isolation identical to 'closed' while allowing our own QA
    // tooling and tests to reach the widget; 'closed' would add only obscurity.
    const root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;
    root.appendChild(style);

    /* launcher */
    const launcher = el('button', 'launcher', { 'aria-label': 'Open Orby chat', 'aria-expanded': 'false', type: 'button' });
    const launcherSprite = el('span', 'sprite', { 'aria-hidden': 'true' });
    launcher.appendChild(launcherSprite);
    root.appendChild(launcher);

    /* panel */
    const panel = el('section', 'panel', { role: 'dialog', 'aria-label': 'Orby — DataDreamer assistant', 'aria-modal': 'false' });
    panel.innerHTML = '';
    const head = el('div', 'head');
    const headSprite = el('span', 'sprite', { 'aria-hidden': 'true' });
    const nameWrap = el('div', '');
    const headName = el('div', 'head-name'); headName.textContent = 'Orby';
    const headStatus = el('div', 'head-status', { 'aria-live': 'polite' }); headStatus.textContent = 'DataDreamer assistant';
    nameWrap.append(headName, headStatus);
    const closeBtn = el('button', 'close', { 'aria-label': 'Close chat', type: 'button' });
    closeBtn.textContent = '×';
    head.append(headSprite, nameWrap, closeBtn);

    const log = el('div', 'log', { role: 'log', 'aria-live': 'polite' });
    const typing = el('div', 'typing'); typing.textContent = 'Orby is thinking…';

    const composer = el('form', 'composer');
    const input = el('textarea', '', {
      rows: '1', placeholder: 'Ask about DataDreamer…',
      'aria-label': 'Message Orby', maxlength: String(config.maxMessageLength || 1000), enterkeyhint: 'send',
    });
    const send = el('button', 'send', { 'aria-label': 'Send message', type: 'submit' });
    send.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z"/></svg>';
    composer.append(input, send);

    panel.append(head, log, typing, composer);
    root.appendChild(panel);
    document.body.appendChild(host);

    const bigSprite = new Sprite(launcherSprite, manifest);
    const miniSprite = new Sprite(headSprite, manifest);
    launcherSprite.style.width = '64px'; launcherSprite.style.height = '64px';
    headSprite.style.width = '36px'; headSprite.style.height = '36px';
    bigSprite.set(bigSprite.idleName());
    miniSprite.set('listening');
    setInterval(() => { if (!bigSprite.timer && !bigSprite.pendingRevert) bigSprite.set(bigSprite.idleName(), { force: true }); }, 12000);

    const setStatus = (text) => { headStatus.textContent = text; };
    const spriteState = (name) => { miniSprite.set(name); };

    /* messages */
    const addMessage = (role, text) => {
      const bubble = el('div', `msg ${role}`);
      bubble.textContent = text;
      log.appendChild(bubble);
      log.scrollTop = log.scrollHeight;
      return bubble;
    };
    const addSources = (sources) => {
      if (!sources || !sources.length) return;
      const wrap = el('div', 'sources', { 'aria-label': 'Sources' });
      for (const source of sources.slice(0, 4)) {
        const label = source.title.length > 42 ? source.title.slice(0, 41) + '…' : source.title;
        const chip = source.url
          ? el('a', '', { href: source.url, target: '_blank', rel: 'noopener' })
          : el('a', '', { role: 'note' }); // file-based knowledge: cite without a link
        chip.textContent = label;
        wrap.appendChild(chip);
      }
      log.appendChild(wrap);
      log.scrollTop = log.scrollHeight;
    };
    const addHandoff = (payload) => {
      const link = el('a', 'handoff', { href: payload.url, target: '_blank', rel: 'noopener' });
      link.textContent = payload.cta || 'Book a conversation';
      log.appendChild(link);
      log.scrollTop = log.scrollHeight;
    };

    /* open/close */
    let open = false;
    let welcomed = false;
    const setOpen = (next) => {
      open = next;
      panel.classList.toggle('open', open);
      launcher.setAttribute('aria-expanded', String(open));
      launcher.style.display = open && matchMedia('(max-width: 640px)').matches ? 'none' : '';
      if (open) {
        if (!welcomed) { welcomed = true; addMessage('orby', config.welcome); miniSprite.set('excited'); }
        input.focus();
      } else {
        launcher.focus();
      }
    };
    launcher.addEventListener('click', () => setOpen(!open));
    closeBtn.addEventListener('click', () => setOpen(false));
    root.addEventListener('keydown', (event) => { if (event.key === 'Escape' && open) setOpen(false); });

    /* autosize composer */
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 110) + 'px';
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); composer.requestSubmit(); }
    });

    /* send + SSE — with per-message status (queued → sending → sent/failed+retry)
       and type-ahead queueing: you can keep sending while Orby is still answering. */
    const queue = [];
    let busy = false;

    const STATUS_TEXT = { queued: 'queued…', sending: 'sending…', sent: '✓ sent', failed: 'failed —' };
    const makeEntry = (text) => {
      const bubble = addMessage('user', text);
      const status = el('div', 'status', { 'aria-live': 'polite' });
      log.appendChild(status);
      log.scrollTop = log.scrollHeight;
      const entry = { text, clientId: crypto.randomUUID(), bubble, status, set(state) {
        status.textContent = STATUS_TEXT[state] || '';
        status.classList.toggle('sent', state === 'sent');
        if (state === 'failed') {
          const retry = el('button', '', { type: 'button' });
          retry.textContent = 'tap to retry';
          retry.addEventListener('click', () => { status.textContent = ''; enqueue(entry); }, { once: true });
          status.appendChild(retry);
        }
        if (state === 'sent') setTimeout(() => { if (status.classList.contains('sent')) status.textContent = ''; }, 2500);
      } };
      return entry;
    };

    const enqueue = (entry) => {
      if (busy) {
        if (queue.length >= (config.maxQueuedMessages || 3)) {
          entry.set('failed');
          addMessage('notice', 'Your message queue is full — wait for Orby to finish answering.');
          return;
        }
        entry.set('queued');
        queue.push(entry);
      } else {
        transmit(entry);
      }
    };

    composer.addEventListener('submit', (event) => {
      event.preventDefault();
      const message = input.value.trim();
      if (!message) return;
      input.value = ''; input.style.height = 'auto';
      enqueue(makeEntry(message));
    });

    async function transmit(entry) {
      busy = true; send.disabled = queue.length >= (config.maxQueuedMessages || 3);
      entry.set('sending');
      typing.classList.add('on');
      spriteState('thinking'); bigSprite.set('thinking'); setStatus('thinking…');

      let orbyBubble = null;
      let acknowledged = false;
      try {
        const response = await fetch(`${API}/api/chat`, {
          method: 'POST', mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: entry.text, visitor: visitorId, session: sessionId, client_id: entry.clientId }),
        });
        if (response.status === 429) throw new Error('rate');
        if (!response.ok || !response.body) throw new Error('http');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let eventName = 'message';
        const handle = (name, data) => {
          if (!acknowledged) { acknowledged = true; entry.set('sent'); }
          if (name === 'meta' && data.session) {
            sessionId = data.session;
            try { sessionStorage.setItem('orby_session', sessionId); } catch { /* ignore */ }
          } else if (name === 'state') {
            // backend states without a matching strip map to the closest art
            const spriteName = { waiting: 'loading' }[data.state] || data.state;
            spriteState(spriteName); bigSprite.set(spriteName);
            setStatus({ thinking: 'thinking…', searching: 'searching DataDreamer…', talking: 'answering…', waiting: 'in line — Orby is helping others…', offline: 'connection trouble' }[data.state] || 'DataDreamer assistant');
          } else if (name === 'token') {
            typing.classList.remove('on');
            if (!orbyBubble) orbyBubble = addMessage('orby', '');
            orbyBubble.textContent += data.t;
            log.scrollTop = log.scrollHeight;
          } else if (name === 'sources') {
            addSources(data.sources);
          } else if (name === 'handoff') {
            addHandoff(data);
          } else if (name === 'done') {
            spriteState(data.classification === 'datadreamer' ? 'success' : 'listening');
            bigSprite.set(bigSprite.idleName(), { force: true });
            setStatus('DataDreamer assistant');
          } else if (name === 'rejected') {
            typing.classList.remove('on');
            entry.set('failed');
            addMessage('notice', data.message || 'Orby is at capacity — please retry shortly.');
            spriteState(data.reason === 'session_busy' ? 'listening' : 'worried');
            setStatus('DataDreamer assistant');
          } else if (name === 'error') {
            typing.classList.remove('on');
            addMessage('notice', data.message || 'Something went wrong.');
            spriteState('error');
          }
        };
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let boundary;
          while ((boundary = buffer.indexOf('\n\n')) >= 0) {
            const raw = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
            let data = '';
            eventName = 'message';
            for (const line of raw.split('\n')) {
              if (line.startsWith('event: ')) eventName = line.slice(7).trim();
              else if (line.startsWith('data: ')) data += line.slice(6);
            }
            if (data) { try { handle(eventName, JSON.parse(data)); } catch { /* skip bad frame */ } }
          }
        }
        if (!acknowledged) throw new Error('http'); // stream ended without any event
      } catch (error) {
        typing.classList.remove('on');
        entry.set('failed');
        if (error.message === 'rate') {
          addMessage('notice', 'Easy there! You’re sending messages a little fast — give it a few seconds.');
        }
        spriteState('offline'); bigSprite.set('offline');
        setStatus('connection trouble');
      } finally {
        typing.classList.remove('on');
        busy = false; send.disabled = false;
        if (open) input.focus();
        const next = queue.shift();
        if (next) transmit(next);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
