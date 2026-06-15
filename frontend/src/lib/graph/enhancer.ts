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
  if (!nodes.length) return;

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

  const updateEdges = (author: string, x: number, y: number) => {
    edges
      .filter((edge) => edge.dataset.author === author)
      .forEach((edge) => {
        const anchor = svg.querySelector<SVGGElement>(`.tg-anchor[data-specialty="${edge.dataset.specialty}"]`);
        const x2 = Number(anchor?.dataset.anchorX);
        const y2 = Number(anchor?.dataset.anchorY);
        if (!Number.isFinite(x2) || !Number.isFinite(y2)) return;
        const d = curveD(x, y, x2, y2);
        edge.querySelector<SVGPathElement>('.tg-edge')?.setAttribute('d', d);
        edge.querySelector<SVGPathElement>('.tg-edge-flow')?.setAttribute('d', d);
      });
  };

  const setNodePosition = (node: SVGAElement, x: number, y: number) => {
    const author = node.dataset.author;
    const r = numberData(node, 'r', 26);
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
    if (author) updateEdges(author, x, y);
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
    setNodePosition(dragged, next.x, next.y);
    showFor(dragged);
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
}
