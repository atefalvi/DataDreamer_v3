import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import type { CalloutType } from "./types";

const require = createRequire(import.meta.url);
const lucidePackageJson = require.resolve("lucide-static/package.json");
const lucideIconsDir = join(dirname(lucidePackageJson), "icons");

const calloutIcons: Record<CalloutType, string> = {
  note: "sticky-note",
  info: "info",
  tip: "lightbulb",
  warning: "triangle-alert",
  caution: "octagon-alert",
  important: "message-square-warning",
  example: "flask-conical",
  technical: "cpu",
};

export function getCalloutIcon(type: CalloutType): string {
  const iconPath = join(lucideIconsDir, `${calloutIcons[type]}.svg`);
  const fallbackPath = join(lucideIconsDir, "circle-help.svg");
  const rawSvg = readFileSync(existsSync(iconPath) ? iconPath : fallbackPath, "utf8");

  return rawSvg
    .replace("<svg", '<svg class="callout__icon" aria-hidden="true" focusable="false"')
    .replaceAll('stroke="black"', 'stroke="currentColor"')
    .replaceAll(`stroke="${"#"}000"`, 'stroke="currentColor"')
    .replaceAll('stroke-width="2"', 'stroke-width="1.75"');
}
