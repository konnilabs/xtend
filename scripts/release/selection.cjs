'use strict';
const { check } = require('./inventory.cjs');
function parseSelection(values) {
  const present = value => value !== undefined && value !== '';
  if (!present(values.groups) && !present(values.packages)) return undefined;
  return { groups: present(values.groups) ? values.groups.split(',') : [], packages: present(values.packages) ? values.packages.split(',') : [] };
}
// Inventory membership and version groups remain global. Selection chooses uploads;
// hard transitive dependencies outside it must already exist in the registry.
function selectRelease(inventory, selection) {
  const names = new Set(inventory.packages.map(entry => entry.name));
  const groups = new Set(inventory.packages.map(entry => entry.group));
  const selected = new Set();
  if (selection === undefined) inventory.packages.forEach(entry => selected.add(entry.name));
  else {
    check(selection && typeof selection === 'object' && !Array.isArray(selection) &&
      Object.keys(selection).every(key => ['groups', 'packages'].includes(key)), 'Invalid release selection');
    for (const [key, known] of [['groups', groups], ['packages', names]]) {
      const values = Object.hasOwn(selection, key) ? selection[key] : [];
      check(Array.isArray(values) && new Set(values).size === values.length && values.every(value => known.has(value)),
        `Unknown/duplicate release selection ${key}`);
      for (const value of values) {
        if (key === 'packages') selected.add(value);
        else inventory.packages.filter(entry => entry.group === value).forEach(entry => selected.add(entry.name));
      }
    }
  }
  check(selected.size > 0, 'Empty release selection');
  const closure = new Set(selected);
  let changed;
  do {
    changed = false;
    for (const edge of inventory.edges) if (edge.hard && closure.has(edge.from) && !closure.has(edge.to)) {
      closure.add(edge.to); changed = true;
    }
  } while (changed);
  const order = inventory.order.filter(name => selected.has(name));
  return { selection: { packages: order }, order, closureOrder: inventory.order.filter(name => closure.has(name)),
    registryDependencyNames: inventory.order.filter(name => closure.has(name) && !selected.has(name)) };
}
module.exports = { selectRelease, parseSelection };
