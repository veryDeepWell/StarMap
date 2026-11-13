(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const {normalizeRegion, summarize} = window.STARMAP_MODEL;
  const catalog = window.STARMAP_CATALOG;
  const groups = new Map(catalog.groups.map(group => [group.id, group]));
  const regions = catalog.regions.map(normalizeRegion);
  const worlds = new Map();
  for (const entry of regions) {
    if (!worlds.has(entry.world)) worlds.set(entry.world, []);
    worlds.get(entry.world).push(entry);
  }
  const progress = new Map(regions.map(region => [region.id, readProgress(region)]));
  const map = $('map');
  const plan = $('plan');
  const activeGroups = new Set();
  const categoryInputs = new Map();
  let region;
  let floor;
  let found;
  let selected;
  let entries = [];
  let leftEdge, topEdge, rightEdge, bottomEdge;
  let scale = 1;
  let minScale = 1;
  let maxScale = 1;
  let left = 0;
  let top = 0;
  let fitted = true;

  function storageKey(region) {
    return 'starmap:found:' + region.id;
  }

  function readProgress(region) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(region)));
      if (Array.isArray(saved)) return new Set(saved.filter(id => region.points.has(id)));
      const legacy = {212: 'clock-studios', 681: 'pearluxe'}[region.id];
      if (!legacy) return new Set();
      const previous = JSON.parse(localStorage.getItem('starmap:found:' + legacy));
      return new Set(Array.isArray(previous)
        ? previous.map(id => id === 'trotter' ? 2022 : id).filter(id => region.points.has(id))
        : []);
    } catch {
      return new Set();
    }
  }

  function symbol(group) {
    const icon = document.createElement('span');
    icon.className = 'symbol';
    icon.style.setProperty('--pin', group.color);
    icon.textContent = group.symbol;
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  function selectRegion(next) {
    region = next;
    found = progress.get(region.id);
    $('world-picker').value = region.world;
    $('region').replaceChildren(...worlds.get(region.world).map(entry => new Option(entry.name, entry.id)));
    $('region').value = String(region.id);
    const floorOptions = [false, true].map(room => {
      const group = document.createElement('optgroup');
      group.label = room ? 'Комнаты и платформеры' : 'Основные планы';
      for (const floor of region.floors.values()) {
        if (Boolean(floor.room) === room) group.append(new Option(floor.name, floor.id));
      }
      return group;
    });
    $('floor').replaceChildren(...floorOptions.filter(group => group.childElementCount));
    $('world').textContent = region.world;
    $('location').textContent = region.name;
    $('search').value = '';
    const source = document.querySelector('[data-source]');
    source.href = region.source;
    source.textContent = 'Карта HoYoLAB ↗';
    selectFloor(region.floors.values().next().value.id);
  }

  function selectFloor(id) {
    floor = region.floors.get(id);
    $('floor').value = id;
    selected = null;
    const onFloor = point => point.floor === id;
    const points = Array.from(region.points.values()).filter(point => $('all-floors').checked || onFloor(point));
    const mapped = points.filter(point => onFloor(point) && Number.isFinite(point.px));
    if (floor.image) {
      plan.src = floor.image;
      plan.style.width = floor.size[0] + 'px';
      plan.style.height = floor.size[1] + 'px';
      leftEdge = Math.min(floor.bounds[0], ...mapped.map(point => point.px));
      topEdge = Math.min(floor.bounds[1], ...mapped.map(point => point.py));
      rightEdge = Math.max(floor.bounds[2], ...mapped.map(point => point.px));
      bottomEdge = Math.max(floor.bounds[3], ...mapped.map(point => point.py));
    } else {
      plan.removeAttribute('src');
    }
    plan.hidden = !floor.image;
    $('no-plan').hidden = Boolean(floor.image);
    document.querySelector('.map-tools').hidden = !floor.image;
    document.querySelector('.map-foot').hidden = !floor.image;
    document.querySelector('[data-source]').href = floor.source || region.source;
    const comparison = $('comparison-map');
    const mapKeys = window.STARMAP_AUDIT.mapKeys;
    const mapKey = mapKeys[floor.id] || Array.from(region.floors.keys(), id => mapKeys[id]).find(Boolean);
    const comparisonUrl = mapKey ? 'https://star-rail-map.appsample.com/?map=' + mapKey : region.secondarySource;
    comparison.hidden = !comparisonUrl;
    if (comparisonUrl) comparison.href = comparisonUrl;
    const sourceNote = $('source-note');
    sourceNote.hidden = !window.STARMAP_AUDIT.floors[floor.id];
    sourceNote.textContent = sourceNote.hidden ? '' : 'На этом этаже AppSample показывает больше меток хотя бы одного типа. Расхождение требует сверки.';
    $('map').setAttribute('aria-label', region.name + ' · ' + floor.name);
    $('map-caption').textContent = region.name === floor.name ? region.name : region.name + ' · ' + floor.name;
    $('categories').replaceChildren();
    $('point-list').replaceChildren();
    $('markers').replaceChildren();
    activeGroups.clear();
    categoryInputs.clear();

    for (const group of groups.values()) {
      const total = points.filter(point => point.group === group.id).length;
      if (!total) continue;
      activeGroups.add(group.id);
      const label = document.createElement('label');
      label.className = 'category';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = true;
      input.addEventListener('change', () => {
        if (input.checked) activeGroups.add(group.id);
        else activeGroups.delete(group.id);
        render();
      });
      categoryInputs.set(group.id, input);
      const count = document.createElement('span');
      count.className = 'count';
      count.textContent = total;
      label.append(input, symbol(group), document.createTextNode(group.name), count);
      $('categories').append(label);
    }

    entries = points.map(point => {
      const group = groups.get(point.group);
      let pin;
      if (floor.image && onFloor(point) && Number.isFinite(point.px)) {
        pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'pin';
        pin.style.setProperty('--pin', group.color);
        pin.title = point.name + ' №' + point.number;
        pin.setAttribute('aria-label', pin.title);
        pin.addEventListener('click', () => openPoint(point, false));
        $('markers').append(pin);
      }
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'point-item';
      const index = document.createElement('span');
      index.className = 'index';
      const title = document.createElement('span');
      title.textContent = point.name;
      if ($('all-floors').checked) {
        const level = document.createElement('small');
        level.textContent = region.floors.get(point.floor).name;
        title.append(level);
      }
      button.append(symbol(group), title, index);
      button.addEventListener('click', () => {
        if (!onFloor(point)) selectFloor(point.floor);
        openPoint(point, true);
      });
      item.append(button);
      $('point-list').append(item);
      return {point, group, pin, item, button, index};
    });
    if (floor.image) fit();
    render();
  }

  function jadeText({known, unknown}) {
    return 'Осталось по каталогу: ' + known.toLocaleString('ru') + ' нефрита' +
      (unknown ? ' · награды без суммы: ' + unknown : '');
  }

  function render() {
    const query = $('search').value.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
    const hideFound = $('hide-found').checked;
    let visible = 0;
    for (const {point, group, pin, item, button, index} of entries) {
      const isFound = found.has(point.id);
      const matches = activeGroups.has(group.id) && (!hideFound || !isFound) &&
        (point.name + ' ' + group.name).toLocaleLowerCase('ru').replaceAll('ё', 'е').includes(query);
      const isSelected = selected?.id === point.id;
      if (matches) visible++;
      item.hidden = !matches;
      if (pin) {
        pin.hidden = !matches;
        pin.classList.toggle('found', isFound);
        pin.textContent = isFound ? '✓' : group.symbol;
        pin.setAttribute('aria-pressed', String(isSelected));
      }
      button.setAttribute('aria-current', String(isSelected));
      index.textContent = (isFound ? '✓ ' : '') + '№' + point.number;
    }
    $('visible-count').textContent = visible + ' / ' + entries.length;
    $('empty').hidden = visible !== 0;
    const stats = summarize(region, found);
    $('progress').max = stats.total || 1;
    $('progress').value = stats.done;
    $('progress-text').textContent = stats.done + ' / ' + stats.total +
      (stats.total && stats.done === stats.total ? ' · закрыто по каталогу' : '');
    $('region-jade').textContent = jadeText(stats);
    $('toggle-filters').textContent = activeGroups.size ? 'Снять все' : 'Выбрать все';
    $('detail').hidden = !selected;
    if (selected) renderDetail();
  }

  function renderDetail() {
    const point = selected;
    $('detail-group').textContent = groups.get(point.group).name;
    $('detail-name').textContent = point.name;
    $('detail-number').textContent = region.floors.get(point.floor).name + ' · №' + point.number;
    $('mark').hidden = Boolean(point.container || point.reference);
    $('mark').textContent = found.has(point.id) ? 'Снять отметку' : 'Отметить полученным';
    const source = $('detail-source');
    source.href = point.guide?.url || region.floors.get(point.floor).source || region.source;
    source.textContent = point.guide?.label || (point.label != null ? 'На карте HoYoLAB ↗' : 'Источник ↗');
    if (point.label != null && !point.guide?.url) {
      source.href += '?zoom=0&center=' + point.y.toFixed(2) + ',' + point.x.toFixed(2) + '&shown_types=' + point.label;
    }
    const content = $('detail-content');
    content.replaceChildren();
    const add = (tag, text) => {
      const element = document.createElement(tag);
      element.textContent = text;
      content.append(element);
      return element;
    };
    if (!point.reference && !point.container) {
      add('p', point.jade == null ? 'Количество нефрита уточняется' : point.jade + ' звёздного нефрита');
    }
    if (point.reference && point.group === 'treasure' && point.guide) {
      add('p', 'Гайд Game8. Отметь сундук на плане HoYoLAB, чтобы учесть его в прогрессе.');
    }
    if (!point.reference && !point.container) {
      if (point.rewardSource && point.rewardSource !== point.guide?.url) {
        const link = add('a', 'Источник награды ↗');
        link.href = point.rewardSource;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    }
    for (const targetId of [point.targetFloor, ...(point.alternateFloors || [])]) {
      if (!targetId || targetId === floor.id) continue;
      const target = region.floors.get(targetId);
      const button = add('button', 'Открыть план · ' + target.name);
      button.className = 'related-point';
      button.type = 'button';
      button.addEventListener('click', () => {
        selectFloor(target.id);
        $('floor').focus();
      });
    }
    if (point.guide?.requirement) add('p', point.guide.requirement);
    if (point.guide?.steps?.length) {
      add('h3', 'Как получить');
      const steps = add('ol', '');
      for (const instruction of point.guide.steps) {
        const step = document.createElement('li');
        step.textContent = instruction;
        steps.append(step);
      }
    }
    const parent = region.points.get(point.parent);
    const children = Array.from(region.points.values()).filter(child => child.parent === point.id);
    const addRelated = related => {
      const title = (found.has(related.id) && !related.container ? '✓ ' : '') + related.name;
      const button = add('button', title);
      button.className = 'related-point';
      button.type = 'button';
      button.addEventListener('click', () => {
        if (related.floor !== floor.id) selectFloor(related.floor);
        openPoint(related, true);
        $('close-detail').focus({preventScroll: true});
      });
    };
    if (parent) {
      add('h3', 'Внутри');
      addRelated(parent);
    }
    if (children.length) {
      add('h3', 'Находки внутри');
      children.forEach(addRelated);
    }
  }

  function renderAccount() {
    const totals = {known: 0, unknown: 0};
    const list = $('account-regions');
    list.replaceChildren();
    for (const entry of regions) {
      const stats = summarize(entry, progress.get(entry.id));
      totals.known += stats.known;
      totals.unknown += stats.unknown;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'account-region';
      button.textContent = entry.name + ' · ' + stats.done + ' / ' + stats.total +
        ' · ' + stats.known + ' нефрита' + (stats.unknown ? ' + ?' : '');
      button.addEventListener('click', () => {
        $('account-dialog').close();
        selectRegion(entry);
      });
      list.append(button);
    }
    $('account-jade').textContent = jadeText(totals);
  }

  $('world-picker').append(...Array.from(worlds.keys(), world => new Option(world, world)));
  $('world-picker').addEventListener('change', event => selectRegion(worlds.get(event.target.value)[0]));
  $('all-floors').addEventListener('change', () => selectFloor(floor.id));
  $('region').addEventListener('change', event => {
    selectRegion(regions.find(region => String(region.id) === event.target.value));
  });
  $('floor').addEventListener('change', event => selectFloor(event.target.value));
  $('account').addEventListener('click', () => {
    renderAccount();
    $('account-dialog').showModal();
  });
  $('toggle-filters').addEventListener('click', () => {
    const showAll = activeGroups.size === 0;
    activeGroups.clear();
    for (const [id, input] of categoryInputs) {
      input.checked = showAll;
      if (showAll) activeGroups.add(id);
    }
    render();
  });
  $('search').addEventListener('input', render);
  $('hide-found').addEventListener('change', render);
  $('close-detail').addEventListener('click', () => {
    const previous = entries.find(entry => entry.point.id === selected?.id);
    selected = null;
    render();
    if (previous && !previous.item.hidden) previous.button.focus({preventScroll: true});
    else $('search').focus({preventScroll: true});
  });
  $('mark').addEventListener('click', () => {
    if (!selected || selected.reference || selected.container) return;
    if (found.has(selected.id)) found.delete(selected.id);
    else found.add(selected.id);
    try {
      localStorage.setItem(storageKey(region), JSON.stringify([...found]));
    } catch {
      // Progress remains in memory when browser storage is unavailable.
    }
    render();
  });


  function updateView() {
    if (!floor?.image) return;
    const w = map.clientWidth;
    const h = map.clientHeight;
    left = Math.max(w * .2 - rightEdge * scale, Math.min(w * .8 - leftEdge * scale, left));
    top = Math.max(h * .2 - bottomEdge * scale, Math.min(h * .8 - topEdge * scale, top));
    plan.style.transform = 'translate(' + left + 'px,' + top + 'px) scale(' + scale + ')';
    for (const {point, pin} of entries) {
      if (!pin) continue;
      pin.style.transform = 'translate(' + (left + point.px * scale) + 'px,' +
        (top + point.py * scale) + 'px)';
    }
    $('zoom-in').disabled = scale >= maxScale;
    $('zoom-out').disabled = scale <= minScale;
  }

  function fitScale() {
    return Math.min(
      map.clientWidth * .87 / (rightEdge - leftEdge),
      map.clientHeight * .85 / (bottomEdge - topEdge),
    );
  }

  function fit() {
    if (!floor?.image) return;
    scale = fitScale();
    minScale = scale * .65;
    maxScale = Math.max(1.5, scale * 6);
    left = (map.clientWidth - (leftEdge + rightEdge) * scale) / 2;
    top = (map.clientHeight - (topEdge + bottomEdge) * scale) / 2;
    fitted = true;
    updateView();
  }

  function zoom(factor, x = map.clientWidth / 2, y = map.clientHeight / 2) {
    if (!floor?.image) return;
    const next = Math.max(minScale, Math.min(maxScale, scale * factor));
    if (next === scale) return;
    left = x - (x - left) * next / scale;
    top = y - (y - top) * next / scale;
    scale = next;
    fitted = false;
    updateView();
  }

  function openPoint(point, center) {
    selected = point;
    if (center && floor.image && Number.isFinite(point.px)) {
      scale = Math.min(maxScale, Math.max(scale, fitScale() * 1.5));
      left = map.clientWidth / 2 - point.px * scale;
      top = map.clientHeight * .44 - point.py * scale;
      fitted = false;
      updateView();
    }
    render();
  }

  $('zoom-in').addEventListener('click', () => zoom(1.35));
  $('zoom-out').addEventListener('click', () => zoom(1 / 1.35));
  $('fit').addEventListener('click', fit);

  map.addEventListener('wheel', event => {
    if (!floor.image || event.ctrlKey || event.metaKey || event.target.closest('.detail')) return;
    event.preventDefault();
    const bounds = map.getBoundingClientRect();
    zoom(event.deltaY < 0 ? 1.18 : 1 / 1.18, event.clientX - bounds.left, event.clientY - bounds.top);
  }, {passive:false});

  map.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selected) {
      $('close-detail').click();
      return;
    }
    if (!floor.image || event.target !== map) return;
    const movement = {ArrowLeft:[55,0], ArrowRight:[-55,0], ArrowUp:[0,55], ArrowDown:[0,-55]}[event.key];
    if (movement) {
      event.preventDefault();
      left += movement[0];
      top += movement[1];
      fitted = false;
      updateView();
    } else if (event.key === '+' || event.key === '=') {
      zoom(1.35);
    } else if (event.key === '-') {
      zoom(1 / 1.35);
    } else if (event.key === '0') {
      fit();
    }
  });

  const pointers = new Map();
  map.addEventListener('pointerdown', event => {
    if (!floor.image || event.button !== 0 || event.target.closest('button, .detail')) return;
    pointers.set(event.pointerId, {x:event.clientX, y:event.clientY});
    map.setPointerCapture(event.pointerId);
    map.classList.add('dragging');
  });
  map.addEventListener('pointermove', event => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const current = {x:event.clientX, y:event.clientY};
    const partner = [...pointers].find(([id]) => id !== event.pointerId)?.[1];
    pointers.set(event.pointerId, current);
    fitted = false;
    if (partner) {
      const bounds = map.getBoundingClientRect();
      const distance = Math.hypot(previous.x - partner.x, previous.y - partner.y);
      const nextDistance = Math.hypot(current.x - partner.x, current.y - partner.y);
      if (distance > 0 && nextDistance > 0) {
        zoom(nextDistance / distance, (previous.x + partner.x) / 2 - bounds.left,
          (previous.y + partner.y) / 2 - bounds.top);
      }
    }
    const divisor = partner ? 2 : 1;
    left += (current.x - previous.x) / divisor;
    top += (current.y - previous.y) / divisor;
    updateView();
  });
  for (const name of ['pointerup','pointercancel','lostpointercapture']) {
    map.addEventListener(name, event => {
      pointers.delete(event.pointerId);
      if (!pointers.size) map.classList.remove('dragging');
    });
  }
  new ResizeObserver(() => {
    if (fitted) fit();
    else updateView();
  }).observe(map);

  selectRegion(regions.find(region => region.id === 842) || regions[0]);
})();
