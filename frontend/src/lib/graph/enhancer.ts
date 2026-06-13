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
  const edges = Array.from(svg.querySelectorAll<SVGPathElement>('.tg-edge'));
  if (!nodes.length) return;

  let activeSpecialty: string | null = null;
  let hideTimer = 0;

  const specialtiesOf = (node: SVGAElement) => (node.dataset.specialties ?? '').split(',').filter(Boolean);

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
  });

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
