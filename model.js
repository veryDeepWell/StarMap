(() => {
  'use strict';

  function normalizeRegion(region) {
    const floors = new Map(region.floors.map(floor => [floor.id, floor]));
    const points = new Map(region.points.map(point => [point.id, {...point}]));
    for (const point of points.values()) {
      const seen = new Set([point.id]);
      let ancestor = point;
      while (ancestor.parent != null) {
        const parent = points.get(ancestor.parent);
        if (!parent?.container || seen.has(parent.id)) {
          throw new Error('Invalid parent for point ' + point.id);
        }
        seen.add(parent.id);
        ancestor = parent;
        point.floor ??= parent.floor;
      }
      point.floor ??= region.floors[0].id;
      if (!floors.has(point.floor)) throw new Error('Unknown floor for point ' + point.id);
      const floor = floors.get(point.floor);
      if (floor.origin && Number.isFinite(point.x) && Number.isFinite(point.y)) {
        point.px = floor.origin[0] + point.x;
        point.py = floor.origin[1] + point.y;
      }
    }
    return {...region, floors, points};
  }

  function summarize(region, found) {
    const totals = {total: 0, done: 0, known: 0, unknown: 0};
    for (const point of region.points.values()) {
      if (!point.reference && !point.container) {
        totals.total++;
        if (found.has(point.id)) totals.done++;
        else if (point.jade == null) totals.unknown++;
        else totals.known += point.jade;
      }
    }
    return totals;
  }

  window.STARMAP_MODEL = {normalizeRegion, summarize};
})();
