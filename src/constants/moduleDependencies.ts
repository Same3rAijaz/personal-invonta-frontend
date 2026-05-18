import { SYSTEM_MODULE_OPTIONS } from "./hr";

/**
 * Module prerequisite DAG (must stay in sync with backend `tenant-module-dependencies.ts`).
 * If module M is enabled, every key listed here must also be enabled.
 *
 * Intentionally acyclic: warehouses → inventory → products; purchasing needs warehouses
 * (receiving) without warehouses depending on purchasing.
 */
export const TENANT_MODULE_REQUIRES: Record<string, readonly string[]> = {
  inventory: ["products"],
  warehouses: ["inventory"],
  purchasing: ["vendors", "inventory", "warehouses"],
  sales: ["customers", "inventory", "warehouses"],
  borrows: ["sales", "inventory"]
};

export const TENANT_MODULE_IDS = SYSTEM_MODULE_OPTIONS;

export function normModuleId(s: string): string {
  return String(s || "").toLowerCase().trim();
}

/** Any module that lists `requiredId` as a direct prerequisite depends on it (reverse edges). */
export function buildReverseRequires(): Map<string, string[]> {
  const rev = new Map<string, string[]>();
  for (const mod of Object.keys(TENANT_MODULE_REQUIRES)) {
    const key = normModuleId(mod);
    const reqs = TENANT_MODULE_REQUIRES[key];
    if (!reqs?.length) continue;
    for (const r of reqs) {
      const rn = normModuleId(r);
      const list = rev.get(rn) || [];
      list.push(key);
      rev.set(rn, list);
    }
  }
  return rev;
}

const REVERSE_REQUIRES = buildReverseRequires();

/** Adds every transitive prerequisite until stable. */
export function expandEnabledModules(ids: Iterable<string>): Set<string> {
  const set = new Set(Array.from(ids, normModuleId).filter(Boolean));
  let changed = true;
  while (changed) {
    changed = false;
    for (const mod of [...set]) {
      const reqs = TENANT_MODULE_REQUIRES[mod];
      if (!reqs) continue;
      for (const r of reqs) {
        const rn = normModuleId(r);
        if (!set.has(rn)) {
          set.add(rn);
          changed = true;
        }
      }
    }
  }
  return set;
}

/**
 * Turn `mod` on or off; when on, expand prerequisites; when off, remove dependents
 * (transitive via reverse graph).
 */
export function applyModuleToggle(current: Set<string>, mod: string, checked: boolean): Set<string> {
  const m = normModuleId(mod);
  let next = new Set(current);

  if (checked) {
    next.add(m);
    return expandEnabledModules(next);
  }

  next.delete(m);
  const stack = [...(REVERSE_REQUIRES.get(m) || [])];
  while (stack.length) {
    const dep = stack.pop()!;
    if (!next.has(dep)) continue;
    next.delete(dep);
    for (const d2 of REVERSE_REQUIRES.get(dep) || []) stack.push(d2);
  }
  return next;
}

export function prerequisitesSentence(mod: string): string | null {
  const key = normModuleId(mod);
  const reqs = TENANT_MODULE_REQUIRES[key];
  if (!reqs?.length) return null;
  return `Requires ${reqs.join(", ")}`;
}
