/**
 * Dream Team graph enhancer.
 *
 * Progressive enhancement over server-rendered SVG nodes. It keeps the page usable
 * without JS, but adds the production interaction model: search, selection inspector,
 * drag-pinned nodes, and a small settling force simulation.
 */
export function initTeamGraph(): void {
  const stage = document.querySelector<HTMLElement>('[data-team-network]');
  const svg = document.querySelector<SVGSVGElement>('[data-team-graph]');
  if (!stage || !svg) return;

  const camera = svg.querySelector<SVGGElement>('[data-team-camera]');
  const zoomIn = stage.querySelector<HTMLButtonElement>('[data-team-zoom-in]');
  const zoomOut = stage.querySelector<HTMLButtonElement>('[data-team-zoom-out]');
  const fitButton = stage.querySelector<HTMLButtonElement>('[data-team-fit]');
  const zoomStatus = stage.querySelector<HTMLOutputElement>('[data-team-zoom-status]');
  const search = stage.querySelector<HTMLInputElement>('[data-team-search]');
  const resetButton = stage.querySelector<HTMLButtonElement>('[data-team-reset-layout]');
  const clearButton = stage.querySelector<HTMLButtonElement>('[data-team-clear-selection]');
  const inspector = stage.querySelector<HTMLElement>('[data-team-inspector]');
  const inspectorTitle = stage.querySelector<HTMLElement>('[data-team-inspector-title]');
  const inspectorSummary = stage.querySelector<HTMLElement>('[data-team-inspector-summary]');
  const inspectorMeta = stage.querySelector<HTMLElement>('[data-team-inspector-meta]');
  const nodeElements = Array.from(svg.querySelectorAll<SVGGraphicsElement>('.tg-node'));
  const linkElements = Array.from(svg.querySelectorAll<SVGGElement>('.tg-link-group'));
  if (!camera || !nodeElements.length || !inspector || !inspectorTitle || !inspectorSummary || !inspectorMeta) return;

  type NodeState = {
    element: SVGGraphicsElement;
    id: string;
    type: string;
    label: string;
    role: string;
    href: string;
    specialties: string[];
    posts: number;
    guides: number;
    search: string;
    x: number;
    y: number;
    homeX: number;
    homeY: number;
    initialX: number;
    initialY: number;
    vx: number;
    vy: number;
    r: number;
    fixed: boolean;
    pinned: boolean;
  };

  type LinkState = {
    element: SVGGElement;
    source: string;
    target: string;
    kind: string;
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dataNumber = (element: SVGGraphicsElement, key: string, fallback = 0) => {
    const value = Number(element.dataset[key]);
    return Number.isFinite(value) ? value : fallback;
  };

  const nodes = nodeElements.map<NodeState>((element) => {
    const x = dataNumber(element, 'x');
    const y = dataNumber(element, 'y');
    return {
      element,
      id: element.dataset.id ?? '',
      type: element.dataset.type ?? 'node',
      label: element.dataset.label ?? '',
      role: element.dataset.role ?? '',
      href: element.dataset.href ?? '',
      specialties: (element.dataset.specialties ?? '').split(',').map((item) => item.trim()).filter(Boolean),
      posts: Number(element.dataset.posts ?? 0),
      guides: Number(element.dataset.guides ?? 0),
      search: (element.dataset.search ?? element.dataset.label ?? '').toLowerCase(),
      x,
      y,
      homeX: dataNumber(element, 'homeX', x),
      homeY: dataNumber(element, 'homeY', y),
      initialX: dataNumber(element, 'homeX', x),
      initialY: dataNumber(element, 'homeY', y),
      vx: 0,
      vy: 0,
      r: dataNumber(element, 'r', 24),
      fixed: false,
      pinned: false,
    };
  });
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const links = linkElements.map<LinkState>((element) => ({
    element,
    source: element.dataset.source ?? '',
    target: element.dataset.target ?? '',
    kind: element.dataset.kind ?? 'has',
  }));

  const neighborsById = new Map<string, Set<string>>();
  for (const node of nodes) neighborsById.set(node.id, new Set());
  for (const link of links) {
    neighborsById.get(link.source)?.add(link.target);
    neighborsById.get(link.target)?.add(link.source);
  }

  let selectedId: string | null = null;
  let frame = 0;
  let alpha = 0;
  let running = false;
  let dragged: NodeState | null = null;
  let dragPointerId = 0;
  let dragOffset = { x: 0, y: 0 };
  let dragStart = { x: 0, y: 0 };
  let dragMoved = false;
  let suppressClick = false;
  const cameraState = { scale: 1, x: 0, y: 0 };
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 2.6;
  const pointers = new Map<number, { x: number; y: number }>();
  let panPointerId: number | null = null;
  let panOrigin = { x: 0, y: 0, cameraX: 0, cameraY: 0 };
  let pinchDistance = 0;
  let pinchScale = 1;

  const escapeHtml = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');

  const pointFor = (element: SVGGraphicsElement, clientX: number, clientY: number) => {
    const matrix = element.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(matrix.inverse());
  };

  const svgPoint = (event: PointerEvent) => pointFor(svg, event.clientX, event.clientY);
  const graphPoint = (event: PointerEvent) => pointFor(camera, event.clientX, event.clientY);

  const renderCamera = () => {
    camera.setAttribute('transform', `translate(${cameraState.x} ${cameraState.y}) scale(${cameraState.scale})`);
    if (zoomStatus) zoomStatus.value = `${Math.round(cameraState.scale * 100)}%`;
    zoomOut?.toggleAttribute('disabled', cameraState.scale <= MIN_SCALE + 0.001);
    zoomIn?.toggleAttribute('disabled', cameraState.scale >= MAX_SCALE - 0.001);
  };

  const zoomAt = (nextScale: number, point?: { x: number; y: number }) => {
    const box = svg.viewBox.baseVal;
    const anchor = point ?? { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, nextScale));
    const worldX = (anchor.x - cameraState.x) / cameraState.scale;
    const worldY = (anchor.y - cameraState.y) / cameraState.scale;
    cameraState.x = anchor.x - worldX * scale;
    cameraState.y = anchor.y - worldY * scale;
    cameraState.scale = scale;
    renderCamera();
  };

  const fitCamera = () => {
    const box = svg.viewBox.baseVal;
    const mobile = window.matchMedia('(max-width: 41.999rem)').matches;
    const tablet = !mobile && window.matchMedia('(max-width: 63.999rem)').matches;
    svg.setAttribute('preserveAspectRatio', mobile ? 'xMidYMid slice' : 'xMidYMid meet');
    cameraState.scale = tablet ? 1.12 : 1;
    const focal = mobile ? nodes.find((node) => node.type === 'person') : undefined;
    cameraState.x = focal
      ? box.x + box.width / 2 - focal.x * cameraState.scale
      : box.x + (box.width * (1 - cameraState.scale)) / 2;
    cameraState.y = focal
      ? box.y + box.height / 2 - focal.y * cameraState.scale
      : box.y + (box.height * (1 - cameraState.scale)) / 2;
    renderCamera();
  };

  const clamp = (node: NodeState, x: number, y: number) => {
    const box = svg.viewBox.baseVal;
    const pad = Math.max(36, node.r + 18);
    return {
      x: Math.max(box.x + pad, Math.min(box.x + box.width - pad, x)),
      y: Math.max(box.y + pad, Math.min(box.y + box.height - pad, y)),
    };
  };

  const curve = (source: NodeState, target: NodeState) => {
    const mx = (source.x + target.x) / 2;
    const my = (source.y + target.y) / 2;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const len = Math.hypot(dx, dy) || 1;
    const bend = Math.min(34, len * 0.09);
    const cx = mx + (-dy / len) * bend;
    const cy = my + (dx / len) * bend;
    return `M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`;
  };

  const renderNode = (node: NodeState) => {
    node.element.setAttribute('transform', `translate(${node.x} ${node.y})`);
    node.element.dataset.x = String(node.x);
    node.element.dataset.y = String(node.y);
  };

  const renderLink = (link: LinkState) => {
    const source = nodeById.get(link.source);
    const target = nodeById.get(link.target);
    if (!source || !target) return;
    const d = curve(source, target);
    link.element.querySelector<SVGPathElement>('.tg-link')?.setAttribute('d', d);
    link.element.querySelector<SVGPathElement>('.tg-link-flow')?.setAttribute('d', d);
  };

  const render = () => {
    for (const node of nodes) renderNode(node);
    for (const link of links) renderLink(link);
  };

  const connectedSet = (id: string | null) => {
    const set = new Set<string>();
    if (!id) return set;
    set.add(id);
    for (const neighbor of neighborsById.get(id) ?? []) set.add(neighbor);
    return set;
  };

  const setInspector = (node: NodeState | null) => {
    if (!node) {
      inspectorTitle.textContent = 'Select a node';
      inspectorSummary.textContent = 'Select a node for details.';
      inspectorMeta.innerHTML = `
        <span>${nodes.filter((item) => item.type === 'person').length} people</span>
        <span>${nodes.filter((item) => item.type.includes('skill')).length} skills</span>
        <span>${nodes.filter((item) => item.type === 'shared skill').length} shared</span>
        <span>${links.length} links</span>
      `;
      return;
    }

    const neighborIds = Array.from(neighborsById.get(node.id) ?? []);
    const neighbors = neighborIds.map((id) => nodeById.get(id)).filter((item): item is NodeState => Boolean(item));
    const personCount = neighbors.filter((item) => item.type === 'person').length;
    const skillCount = neighbors.filter((item) => item.type.includes('skill')).length;
    const meta = [
      `<span>${neighborIds.length} connection${neighborIds.length === 1 ? '' : 's'}</span>`,
      `<span>${personCount} people</span>`,
      `<span>${skillCount} skills</span>`,
      node.posts ? `<span>${node.posts} post${node.posts === 1 ? '' : 's'}</span>` : '',
      node.guides ? `<span>${node.guides} guide${node.guides === 1 ? '' : 's'}</span>` : '',
    ].filter(Boolean);
    const tags = [...node.specialties, ...neighbors.map((item) => item.label)].slice(0, 8);

    inspectorTitle.textContent = node.label;
    inspectorSummary.textContent = node.role || (node.type === 'person' ? 'Dream Team member' : 'Shared capability');
    inspectorMeta.innerHTML = `
      <div class="dt-inspector__meta">${meta.join('')}</div>
      ${tags.length ? `<div class="dt-inspector__tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
      ${node.href ? `<a class="dt-inspector__link" href="${escapeHtml(node.href)}">Open profile</a>` : ''}
    `;
  };

  const applyFocus = () => {
    const query = search?.value.trim().toLowerCase() ?? '';
    const selected = connectedSet(selectedId);
    const searchSet = new Set<string>();

    if (query) {
      for (const node of nodes) {
        if (node.search.includes(query)) {
          searchSet.add(node.id);
          for (const neighbor of neighborsById.get(node.id) ?? []) searchSet.add(neighbor);
        }
      }
    }

    svg.classList.toggle('is-focused', Boolean(selectedId));
    svg.classList.toggle('is-searching', Boolean(query));

    for (const node of nodes) {
      const inSelection = selectedId ? selected.has(node.id) : false;
      const inSearch = query ? searchSet.has(node.id) : true;
      node.element.classList.toggle('is-selected', node.id === selectedId);
      node.element.classList.toggle('is-neighbor', Boolean(selectedId && inSelection && node.id !== selectedId));
      node.element.classList.toggle('is-match', Boolean(query && node.search.includes(query)));
      node.element.classList.toggle('is-dimmed', Boolean((selectedId && !inSelection) || (query && !inSearch)));
    }

    for (const link of links) {
      const selectedLit = selectedId ? link.source === selectedId || link.target === selectedId : false;
      const searchLit = query ? searchSet.has(link.source) && searchSet.has(link.target) : false;
      link.element.classList.toggle('is-lit', selectedLit || searchLit);
    }
  };

  const select = (node: NodeState | null) => {
    selectedId = node?.id ?? null;
    setInspector(node);
    applyFocus();
  };

  const start = (nextAlpha = 0.75) => {
    if (prefersReducedMotion) {
      render();
      return;
    }
    alpha = Math.max(alpha, nextAlpha);
    if (running) return;
    running = true;
    frame = window.requestAnimationFrame(tick);
  };

  const stop = () => {
    running = false;
    window.cancelAnimationFrame(frame);
  };

  const tick = () => {
    alpha *= 0.93;
    if (alpha < 0.012) {
      alpha = 0;
      running = false;
      render();
      return;
    }

    for (const link of links) {
      const source = nodeById.get(link.source);
      const target = nodeById.get(link.target);
      if (!source || !target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const targetDist = link.kind === 'shared' ? 130 : 150;
      const force = (dist - targetDist) * 0.018 * alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      if (!source.fixed) {
        source.vx += fx;
        source.vy += fy;
      }
      if (!target.fixed) {
        target.vx -= fx;
        target.vy -= fy;
      }
    }

    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const min = a.r + b.r + (a.type === 'person' || b.type === 'person' ? 46 : 28);
        if (dist < min) {
          const push = (min - dist) * 0.08 * alpha;
          const fx = (dx / dist) * push;
          const fy = (dy / dist) * push;
          if (!a.fixed) {
            a.vx -= fx;
            a.vy -= fy;
          }
          if (!b.fixed) {
            b.vx += fx;
            b.vy += fy;
          }
        }
      }
    }

    for (const node of nodes) {
      if (node.fixed) continue;
      const anchor = node.pinned ? 0.012 : 0.026;
      node.vx += (node.homeX - node.x) * anchor * alpha;
      node.vy += (node.homeY - node.y) * anchor * alpha;
      node.vx *= 0.82;
      node.vy *= 0.82;
      const speed = Math.hypot(node.vx, node.vy);
      if (speed > 5) {
        node.vx *= 5 / speed;
        node.vy *= 5 / speed;
      }
      const next = clamp(node, node.x + node.vx, node.y + node.vy);
      node.x = next.x;
      node.y = next.y;
    }

    render();
    frame = window.requestAnimationFrame(tick);
  };

  for (const node of nodes) {
    node.element.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const point = graphPoint(event);
      if (!point) return;
      event.stopPropagation();
      dragged = node;
      dragPointerId = event.pointerId;
      dragMoved = false;
      dragStart = { x: point.x, y: point.y };
      dragOffset = { x: node.x - point.x, y: node.y - point.y };
      node.fixed = true;
      node.vx = 0;
      node.vy = 0;
      node.element.classList.add('is-dragging');
      node.element.setPointerCapture?.(event.pointerId);
      select(node);
    });

    node.element.addEventListener('click', (event) => {
      event.preventDefault();
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      select(node);
    });

    node.element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select(node);
      } else if (event.key === 'Escape') {
        select(null);
      }
    });
  }

  svg.addEventListener('pointermove', (event) => {
    if (!dragged || event.pointerId !== dragPointerId) return;
    const point = graphPoint(event);
    if (!point) return;
    const distance = Math.hypot(point.x - dragStart.x, point.y - dragStart.y);
    if (distance > 3) dragMoved = true;
    if (!dragMoved) return;
    event.preventDefault();
    const next = clamp(dragged, point.x + dragOffset.x, point.y + dragOffset.y);
    dragged.x = next.x;
    dragged.y = next.y;
    dragged.vx = 0;
    dragged.vy = 0;
    render();
    start(0.42);
  });

  const finishDrag = (event: PointerEvent) => {
    if (!dragged || event.pointerId !== dragPointerId) return;
    dragged.element.classList.remove('is-dragging');
    dragged.element.releasePointerCapture?.(event.pointerId);
    dragged.fixed = false;
    if (dragMoved) {
      dragged.pinned = true;
      dragged.homeX = dragged.x;
      dragged.homeY = dragged.y;
      suppressClick = true;
      start(0.46);
    }
    dragged = null;
  };

  svg.addEventListener('pointerup', finishDrag);
  svg.addEventListener('pointercancel', finishDrag);

  svg.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if ((event.target as Element).closest('.tg-node')) return;
    const point = svgPoint(event);
    if (!point) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    svg.setPointerCapture?.(event.pointerId);
    if (pointers.size === 1) {
      panPointerId = event.pointerId;
      panOrigin = { x: point.x, y: point.y, cameraX: cameraState.x, cameraY: cameraState.y };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDistance = Math.hypot(b.x - a.x, b.y - a.y);
      pinchScale = cameraState.scale;
      panPointerId = null;
    }
  });

  svg.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      event.preventDefault();
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const midpoint = pointFor(svg, (a.x + b.x) / 2, (a.y + b.y) / 2);
      if (pinchDistance > 0 && midpoint) zoomAt(pinchScale * (distance / pinchDistance), midpoint);
      return;
    }
    if (panPointerId !== event.pointerId) return;
    const point = svgPoint(event);
    if (!point) return;
    event.preventDefault();
    cameraState.x = panOrigin.cameraX + point.x - panOrigin.x;
    cameraState.y = panOrigin.cameraY + point.y - panOrigin.y;
    renderCamera();
  });

  const finishCameraPointer = (event: PointerEvent) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    svg.releasePointerCapture?.(event.pointerId);
    panPointerId = null;
    pinchDistance = 0;
    if (pointers.size === 1) {
      const [id, remaining] = [...pointers.entries()][0];
      const point = pointFor(svg, remaining.x, remaining.y);
      if (point) {
        panPointerId = id;
        panOrigin = { x: point.x, y: point.y, cameraX: cameraState.x, cameraY: cameraState.y };
      }
    }
  };
  svg.addEventListener('pointerup', finishCameraPointer);
  svg.addEventListener('pointercancel', finishCameraPointer);

  svg.addEventListener('wheel', (event) => {
    event.preventDefault();
    const point = pointFor(svg, event.clientX, event.clientY);
    if (!point) return;
    zoomAt(cameraState.scale * (event.deltaY > 0 ? 0.9 : 1.1), point);
  }, { passive: false });

  zoomIn?.addEventListener('click', () => zoomAt(cameraState.scale * 1.2));
  zoomOut?.addEventListener('click', () => zoomAt(cameraState.scale / 1.2));
  fitButton?.addEventListener('click', fitCamera);

  search?.addEventListener('input', applyFocus);
  clearButton?.addEventListener('click', () => select(null));
  resetButton?.addEventListener('click', () => {
    stop();
    alpha = 0;
    for (const node of nodes) {
      node.pinned = false;
      node.fixed = false;
      node.homeX = node.initialX;
      node.homeY = node.initialY;
      node.x = node.initialX;
      node.y = node.initialY;
      node.vx = 0;
      node.vy = 0;
    }
    render();
    applyFocus();
    fitCamera();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && selectedId) select(null);
  });

  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting) && !document.hidden) start(0.45);
      else stop();
    },
    { threshold: 0.08 },
  );
  io.observe(svg);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start(0.28);
  });

  render();
  fitCamera();
  setInspector(null);
}
