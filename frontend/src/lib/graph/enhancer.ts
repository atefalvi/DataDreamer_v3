/**
 * Lightweight selection enhancer for the Dream Team data commons.
 *
 * Layout stays entirely server-rendered. This module only synchronizes focus between
 * the SVG, the capability controls, the mobile relationship explorer, and the
 * pre-rendered detail panels.
 */
export function initTeamGraph(): void {
  const stage = document.querySelector<HTMLElement>('[data-team-network]');
  if (!stage || stage.dataset.enhanced === 'true') return;
  stage.dataset.enhanced = 'true';

  const nodes = Array.from(stage.querySelectorAll<HTMLElement>('[data-network-node]'));
  const controls = Array.from(stage.querySelectorAll<HTMLButtonElement>('[data-network-filter]'));
  const details = Array.from(stage.querySelectorAll<HTMLElement>('[data-network-detail]'));
  const mobilePanels = Array.from(stage.querySelectorAll<HTMLElement>('[data-mobile-network-panel]'));
  const links = Array.from(stage.querySelectorAll<SVGElement>('[data-network-link]'));
  const status = stage.querySelector<HTMLOutputElement>('[data-network-status]');
  const defaultTitle = stage.dataset.defaultTitle ?? 'All connections';

  const connectedIds = new Map<string, Set<string>>();
  const connect = (source: string, target: string) => {
    if (!connectedIds.has(source)) connectedIds.set(source, new Set());
    connectedIds.get(source)?.add(target);
  };

  for (const link of links) {
    const source = link.dataset.source ?? '';
    const target = link.dataset.target ?? '';
    connect(source, target);
    connect(target, source);
  }

  let selectedId = '';
  let returnFocus: HTMLElement | null = null;

  const render = () => {
    const neighborhood = connectedIds.get(selectedId) ?? new Set<string>();

    for (const node of nodes) {
      const id = node.dataset.id ?? '';
      const selected = Boolean(selectedId && id === selectedId);
      const connected = Boolean(selectedId && neighborhood.has(id));
      node.classList.toggle('is-selected', selected);
      node.classList.toggle('is-connected', connected);
      node.classList.toggle('is-dimmed', Boolean(selectedId && !selected && !connected));
      if (node.matches('[role="button"]')) node.setAttribute('aria-pressed', String(selected));
    }

    for (const link of links) {
      const active = Boolean(
        selectedId &&
        (link.dataset.source === selectedId || link.dataset.target === selectedId),
      );
      link.classList.toggle('is-active', active);
      link.classList.toggle('is-dimmed', Boolean(selectedId && !active));
    }

    for (const control of controls) {
      const active = (control.dataset.networkFilter ?? '') === selectedId;
      control.classList.toggle('is-active', active);
      control.setAttribute('aria-pressed', String(active));
    }

    for (const detail of details) {
      detail.hidden = (detail.dataset.networkDetail ?? '') !== selectedId;
    }

    for (const panel of mobilePanels) {
      panel.hidden = (panel.dataset.mobileNetworkPanel ?? '') !== selectedId;
    }

    const selectedNode = nodes.find((node) => node.dataset.id === selectedId);
    if (status) {
      status.value = selectedNode?.dataset.label
        ? `${selectedNode.dataset.label} selected`
        : defaultTitle;
    }
  };

  const select = (id: string, origin?: HTMLElement) => {
    const clearing = id === '' || (selectedId === id && id !== '');
    if (!clearing && origin) returnFocus = origin;
    selectedId = selectedId === id && id !== '' ? '' : id;
    render();

    if (window.matchMedia('(max-width: 47.999rem)').matches) {
      if (selectedId) {
        const title = stage.querySelector<HTMLElement>(
          `[data-mobile-network-panel="${CSS.escape(selectedId)}"] [data-mobile-panel-title]`,
        );
        title?.focus({ preventScroll: true });
      } else if (returnFocus?.isConnected) {
        returnFocus.focus({ preventScroll: true });
        returnFocus = null;
      }
    }
  };

  for (const control of controls) {
    control.addEventListener('click', () => select(control.dataset.networkFilter ?? '', control));
  }

  for (const node of nodes) {
    node.addEventListener('click', () => select(node.dataset.id ?? '', node));
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select(node.dataset.id ?? '');
      } else if (event.key === 'Escape') {
        select('');
      }
    });
  }

  render();
}
