/**
 * V4-DT-002 enhancer (07 §5.4). Progressive enhancement over the SSR team graph:
 * tooltips, edge-lighting + node-dimming on hover/focus, legend filtering, and a roving
 * tabindex with arrow-key navigation. The SVG is fully usable (real <a> nodes) without
 * any of this — failure here leaves a working static graph.
 */
export function initTeamGraph(): void {
  const svg = document.querySelector<SVGSVGElement>('[data-team-graph]');
  const tooltip = document.querySelector<HTMLElement>('[data-team-tooltip]');
  const legend = document.querySelector<HTMLElement>('[data-team-legend]');
  if (!svg || !tooltip) return;

  const nodes = Array.from(svg.querySelectorAll<SVGAElement>('.tg-node'));
  const edges = Array.from(svg.querySelectorAll<SVGGElement>('.tg-edge-group'));
  const anchors = Array.from(svg.querySelectorAll<SVGGElement>('.tg-anchor'));
  if (!nodes.length) return;

  type MotionState = {
    x: number;
    y: number;
    /** Home (the SSR layout position) the node springs back toward. */
    hx: number;
    hy: number;
    vx: number;
    vy: number;
    /** Seeded phase so each node wanders on its own organic rhythm. */
    phase: number;
    r: number;
  };

  type AnchorState = MotionState & {
    labelDx: number;
    labelDy: number;
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let activeSpecialty: string | null = null;
  let hideTimer = 0;
  let dragged: SVGAElement | null = null;
  let dragPointerId = 0;
  let dragOffset = { x: 0, y: 0 };
  let dragStart = { x: 0, y: 0 };
  let dragMoved = false;
  let suppressClick = false;

  const specialtiesOf = (node: SVGAElement) => (node.dataset.specialties ?? '').split(',').filter(Boolean);
  const numberData = (node: SVGAElement, key: string, fallback = 0) => {
    const value = Number(node.dataset[key]);
    return Number.isFinite(value) ? value : fallback;
  };

  const svgPoint = (event: PointerEvent) => {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(matrix.inverse());
  };

  const clampPoint = (x: number, y: number, r: number) => {
    const box = svg.viewBox.baseVal;
    const pad = Math.max(48, r + 18);
    return {
      x: Math.max(box.x + pad, Math.min(box.x + box.width - pad, x)),
      y: Math.max(box.y + pad, Math.min(box.y + box.height - pad, y)),
    };
  };

  const nodesByAuthor = new Map(nodes.map((node) => [node.dataset.author ?? '', node]));
  const nodeState = new Map<SVGAElement, MotionState>(
    nodes.map((node, i) => {
      const x = numberData(node, 'x');
      const y = numberData(node, 'y');
      return [node, { x, y, hx: x, hy: y, vx: 0, vy: 0, phase: i * 1.7 + 0.6, r: numberData(node, 'r', 26) }];
    }),
  );
  const anchorState = new Map<string, AnchorState>(
    anchors.map((anchor, i) => {
      const x = Number(anchor.dataset.anchorX);
      const y = Number(anchor.dataset.anchorY);
      const labelX = Number(anchor.dataset.labelX);
      const labelY = Number(anchor.dataset.labelY);
      const state: AnchorState = {
        x,
        y,
        hx: x,
        hy: y,
        vx: 0,
        vy: 0,
        phase: i * 2.3 + 1.1,
        r: 8,
        labelDx: Number.isFinite(labelX) ? labelX - x : 0,
        labelDy: Number.isFinite(labelY) ? labelY - y : 0,
      };
      return [anchor.dataset.specialty ?? '', state];
    }),
  );
  const anchorEntries = Array.from(anchorState.entries());

  const curveD = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const cx = mx + (-dy / len) * len * 0.08;
    const cy = my + (dx / len) * len * 0.08;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  };

  const updateEdge = (edge: SVGGElement) => {
    const authorNode = nodesByAuthor.get(edge.dataset.author ?? '');
    const anchor = anchorState.get(edge.dataset.specialty ?? '');
    if (!authorNode || !anchor) return;
    const x1 = numberData(authorNode, 'x');
    const y1 = numberData(authorNode, 'y');
    const d = curveD(x1, y1, anchor.x, anchor.y);
    edge.querySelector<SVGPathElement>('.tg-edge')?.setAttribute('d', d);
    edge.querySelector<SVGPathElement>('.tg-edge-flow')?.setAttribute('d', d);
  };

  const updateEdges = (author: string) => {
    edges.filter((edge) => edge.dataset.author === author).forEach(updateEdge);
  };

  const updateAnchorEdges = (specialty: string) => {
    edges.filter((edge) => edge.dataset.specialty === specialty).forEach(updateEdge);
  };

  const setNodePosition = (node: SVGAElement, x: number, y: number) => {
    const author = node.dataset.author;
    const state = nodeState.get(node);
    const r = state?.r ?? numberData(node, 'r', 26);
    if (state) {
      state.x = x;
      state.y = y;
    }
    node.dataset.x = String(x);
    node.dataset.y = String(y);
    node.querySelector<SVGCircleElement>('.tg-node-ring')?.setAttribute('cx', String(x));
    node.querySelector<SVGCircleElement>('.tg-node-ring')?.setAttribute('cy', String(y));
    const image = node.querySelector<SVGImageElement>('image');
    image?.setAttribute('x', String(x - (r - 2)));
    image?.setAttribute('y', String(y - (r - 2)));
    const initials = node.querySelector<SVGTextElement>('.tg-node-initials');
    initials?.setAttribute('x', String(x));
    initials?.setAttribute('y', String(y));
    const name = node.querySelector<SVGTextElement>('.tg-node-name');
    name?.setAttribute('x', String(x));
    name?.setAttribute('y', String(y + r + 15));
    svg.querySelector<SVGCircleElement>(`#clip-${author} circle`)?.setAttribute('cx', String(x));
    svg.querySelector<SVGCircleElement>(`#clip-${author} circle`)?.setAttribute('cy', String(y));
    if (author) updateEdges(author);
  };

  const setAnchorPosition = (specialty: string, x: number, y: number) => {
    const state = anchorState.get(specialty);
    const anchor = anchors.find((item) => item.dataset.specialty === specialty);
    if (!state || !anchor) return;
    state.x = x;
    state.y = y;
    anchor.dataset.anchorX = String(x);
    anchor.dataset.anchorY = String(y);
    anchor.querySelector<SVGCircleElement>('.tg-anchor-dot')?.setAttribute('cx', String(x));
    anchor.querySelector<SVGCircleElement>('.tg-anchor-dot')?.setAttribute('cy', String(y));
    const label = anchor.querySelector<SVGTextElement>('.tg-anchor-label');
    label?.setAttribute('x', String(x + state.labelDx));
    label?.setAttribute('y', String(y + state.labelDy));
    updateAnchorEdges(specialty);
  };

  // Continuous, organic force simulation — nodes wander around their home position,
  // repel each other, and bounce softly (a living neo4j / social-graph feel). Anchors
  // (the discipline pillars) gently bob in place. Paused off-screen and under
  // prefers-reduced-motion (then the SSR layout stays put).
  const nodeArr = nodes.map((node) => ({ node, s: nodeState.get(node)! }));
  let simRunning = false;
  let simFrame = 0;
  let lastTs = 0;

  const stepSim = (now: number) => {
    const dt = Math.min(2, lastTs ? (now - lastTs) / 16.67 : 1);
    lastTs = now;
    const t = now / 1000;

    for (const { node, s } of nodeArr) {
      if (node === dragged) continue;
      let fx = 0;
      let fy = 0;

      // Repulsion + soft collision from every other node.
      for (const other of nodeArr) {
        if (other.node === node) continue;
        const os = other.s;
        const dx = s.x - os.x;
        const dy = s.y - os.y;
        const d2 = dx * dx + dy * dy || 1;
        const d = Math.sqrt(d2);
        fx += (dx / d) * (9000 / d2);
        fy += (dy / d) * (9000 / d2);
        const minD = s.r + os.r + 18;
        if (d < minD) {
          const push = (minD - d) * 0.5;
          fx += (dx / d) * push;
          fy += (dy / d) * push;
        }
      }

      // Spring back toward a gently-wandering home (organic drift, never fully still).
      const wx = Math.sin(t * 0.5 + s.phase) * 7 + Math.sin(t * 0.21 + s.phase * 1.6) * 4;
      const wy = Math.cos(t * 0.44 + s.phase * 1.3) * 7 + Math.cos(t * 0.18 + s.phase) * 4;
      fx += (s.hx + wx - s.x) * 0.02;
      fy += (s.hy + wy - s.y) * 0.02;

      s.vx = (s.vx + fx * dt) * 0.84;
      s.vy = (s.vy + fy * dt) * 0.84;
      const speed = Math.hypot(s.vx, s.vy);
      const max = 2.4;
      if (speed > max) {
        s.vx *= max / speed;
        s.vy *= max / speed;
      }
      const next = clampPoint(s.x + s.vx * dt, s.y + s.vy * dt, s.r);
      setNodePosition(node, next.x, next.y);
    }

    // Anchors: subtle bob so the pillars feel alive without drifting away.
    for (const [specialty, st] of anchorEntries) {
      const bx = Math.sin(t * 0.32 + st.phase) * 4;
      const by = Math.cos(t * 0.28 + st.phase) * 4;
      setAnchorPosition(specialty, st.hx + bx, st.hy + by);
    }

    if (simRunning) simFrame = window.requestAnimationFrame(stepSim);
  };

  const startSim = () => {
    if (simRunning || prefersReducedMotion) return;
    simRunning = true;
    lastTs = 0;
    simFrame = window.requestAnimationFrame(stepSim);
  };
  const stopSim = () => {
    simRunning = false;
    window.cancelAnimationFrame(simFrame);
  };

  const showFor = (node: SVGAElement) => {
    window.clearTimeout(hideTimer);
    svg.classList.add('has-focus');
    nodes.forEach((n) => n.classList.toggle('is-active', n === node));
    const author = node.dataset.author;
    edges.forEach((e) => e.classList.toggle('is-lit', e.dataset.author === author));

    const posts = Number(node.dataset.posts ?? 0);
    const courses = Number(node.dataset.courses ?? 0);
    const meta = [
      `${posts} post${posts === 1 ? '' : 's'}`,
      ...(courses > 0 ? [`${courses} course${courses === 1 ? '' : 's'}`] : []),
    ].join(' · ');
    tooltip.innerHTML = `<strong></strong><em></em><span></span>`;
    tooltip.querySelector('strong')!.textContent = node.dataset.name ?? '';
    tooltip.querySelector('em')!.textContent = node.dataset.role ?? '';
    tooltip.querySelector('span')!.textContent = meta;
    tooltip.hidden = false;

    const rect = node.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    let top = rect.top - tipRect.height - 10;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
    if (top < 8) top = rect.bottom + 10; // flip below if near the top edge
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  const clear = () => {
    hideTimer = window.setTimeout(() => {
      svg.classList.remove('has-focus');
      nodes.forEach((n) => n.classList.remove('is-active'));
      edges.forEach((e) => e.classList.remove('is-lit'));
      tooltip.hidden = true;
    }, 80);
  };

  nodes.forEach((node) => {
    node.addEventListener('pointerenter', () => showFor(node));
    node.addEventListener('pointerleave', clear);
    node.addEventListener('focus', () => showFor(node));
    node.addEventListener('blur', clear);
    node.addEventListener('click', (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    });
    node.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const point = svgPoint(event);
      if (!point) return;
      dragged = node;
      dragPointerId = event.pointerId;
      dragStart = { x: point.x, y: point.y };
      dragMoved = false;
      dragOffset = {
        x: numberData(node, 'x') - point.x,
        y: numberData(node, 'y') - point.y,
      };
      node.classList.add('is-dragging');
      showFor(node);
      node.setPointerCapture?.(event.pointerId);
    });
  });

  svg.addEventListener('pointermove', (event) => {
    if (!dragged || event.pointerId !== dragPointerId) return;
    const point = svgPoint(event);
    if (!point) return;
    const distance = Math.hypot(point.x - dragStart.x, point.y - dragStart.y);
    if (distance > 3) dragMoved = true;
    if (!dragMoved) return;
    event.preventDefault();
    const r = numberData(dragged, 'r', 26);
    const next = clampPoint(point.x + dragOffset.x, point.y + dragOffset.y, r);
    const state = nodeState.get(dragged);
    if (state) {
      // Pin to the pointer; zero velocity so it doesn't fling on release. Neighbours
      // get pushed organically by the simulation's repulsion.
      state.vx = 0;
      state.vy = 0;
    }
    setNodePosition(dragged, next.x, next.y);
    showFor(dragged);
    startSim();
  });

  const finishDrag = (event: PointerEvent) => {
    if (!dragged || event.pointerId !== dragPointerId) return;
    dragged.classList.remove('is-dragging');
    dragged.releasePointerCapture?.(event.pointerId);
    suppressClick = dragMoved;
    dragged = null;
  };

  svg.addEventListener('pointerup', finishDrag);
  svg.addEventListener('pointercancel', finishDrag);

  // Roving tabindex: arrows move between focusable (non-dimmed) nodes.
  const focusable = () => nodes.filter((n) => !n.classList.contains('is-dimmed'));
  const moveFocus = (dir: 1 | -1 | 'home' | 'end') => {
    const list = focusable();
    if (!list.length) return;
    const current = document.activeElement as Element | null;
    const idx = list.findIndex((n) => n === current);
    let next: SVGAElement;
    if (dir === 'home') next = list[0];
    else if (dir === 'end') next = list[list.length - 1];
    else {
      const base = idx === -1 ? 0 : idx;
      next = list[(base + dir + list.length) % list.length];
    }
    nodes.forEach((n) => n.setAttribute('tabindex', n === next ? '0' : '-1'));
    next.focus();
  };

  svg.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(-1);
        break;
      case 'Home':
        event.preventDefault();
        moveFocus('home');
        break;
      case 'End':
        event.preventDefault();
        moveFocus('end');
        break;
      case 'Escape':
        applyFilter(null);
        break;
    }
  });

  // Legend filtering.
  function applyFilter(slug: string | null) {
    if (!svg) return;
    activeSpecialty = slug;
    svg.classList.toggle('is-filtered', slug !== null);
    nodes.forEach((node) => {
      const matches = slug === null || specialtiesOf(node).includes(slug);
      node.classList.toggle('is-dimmed', !matches);
      node.setAttribute('tabindex', '-1');
    });
    // Make the first visible node focusable again for roving order.
    const first = focusable()[0];
    if (first) first.setAttribute('tabindex', '0');
    if (legend) {
      legend.querySelectorAll<HTMLButtonElement>('[data-specialty]').forEach((chip) => {
        chip.setAttribute('aria-pressed', String(chip.dataset.specialty === slug));
      });
    }
  }

  legend?.querySelectorAll<HTMLButtonElement>('[data-specialty]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const slug = chip.dataset.specialty ?? null;
      applyFilter(activeSpecialty === slug ? null : slug);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeSpecialty) applyFilter(null);
  });

  // Run the living simulation only while the graph is on-screen and the tab is visible.
  if (!prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible && !document.hidden) startSim();
        else stopSim();
      },
      { threshold: 0.05 },
    );
    io.observe(svg);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopSim();
      else startSim();
    });
  }
}
