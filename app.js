/* BABYMATCH — single-file SPA. State in localStorage, hash routing, plain-DOM views.
   Course project · יובל סבג ונועם אלוני · המכללה האקדמית רמת גן */

(function () {
  'use strict';

  const { DAYS, BLOCKS } = window.BABYMATCH_CONST;
  const BRAND = window.BABYMATCH;
  const blockById = (id) => BLOCKS.find((b) => b.id === id);
  const dayById   = (id) => DAYS.find((d) => d.id === id);
  const dayIdFromDate = (iso) => DAYS[new Date(iso + 'T00:00:00').getDay()].id;

  /* ===== Storage ===== */
  const K = {
    babysitters: 'babymatch:babysitters',
    parents:     'babymatch:parents',
    requests:    'babymatch:requests',
    user:        'babymatch:user',
  };
  const read  = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
  const write = (k, v)  => localStorage.setItem(k, JSON.stringify(v));

  function seedIfEmpty() {
    if (!localStorage.getItem(K.babysitters)) write(K.babysitters, window.SEED.babysitters);
    if (!localStorage.getItem(K.parents))     write(K.parents,     window.SEED.parents);
    if (!localStorage.getItem(K.requests))    write(K.requests,    window.SEED.requestsBuilder());
    if (!localStorage.getItem(K.user))        write(K.user,        window.SEED.currentUser);
  }
  function resetAll() {
    [K.babysitters, K.parents, K.requests, K.user].forEach((k) => localStorage.removeItem(k));
    seedIfEmpty();
  }

  /* ===== State accessors ===== */
  const Store = {
    sitters:    () => read(K.babysitters, []),
    parents:    () => read(K.parents, []),
    requests:   () => read(K.requests, []),
    user:       () => read(K.user, window.SEED.currentUser),

    saveSitter(s) {
      const arr = Store.sitters();
      const i = arr.findIndex((x) => x.id === s.id);
      if (i >= 0) arr[i] = s; else arr.push(s);
      write(K.babysitters, arr);
    },
    saveParent(p) {
      const arr = Store.parents();
      const i = arr.findIndex((x) => x.id === p.id);
      if (i >= 0) arr[i] = p; else arr.push(p);
      write(K.parents, arr);
    },
    saveRequest(r) {
      const arr = Store.requests();
      const i = arr.findIndex((x) => x.id === r.id);
      if (i >= 0) arr[i] = r; else arr.unshift(r);
      write(K.requests, arr);
    },
    setRole(role) {
      const u = Store.user(); u.role = role; write(K.user, u);
    },
    me() {
      const u = Store.user();
      if (u.role === 'parent')
        return { ...u, profile: Store.parents().find((p) => p.id === u.parentId) };
      return { ...u, profile: Store.sitters().find((s) => s.id === u.sitterId) };
    },
  };

  /* ===== Helpers ===== */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const initials = (name) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('');
  const avgRating = (s) => {
    if (!s.reviews?.length) return 0;
    const sum = s.reviews.reduce((a, r) => a + r.rating, 0);
    return Math.round((sum / s.reviews.length) * 10) / 10;
  };
  const today = () => new Date().toISOString().slice(0, 10);
  const formatDateHe = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    const day = DAYS[d.getDay()];
    return `יום ${day.label} · ${d.getDate()}/${d.getMonth() + 1}`;
  };
  const isAvailable = (sitter, dayId, blockId) =>
    Array.isArray(sitter.availability?.[dayId]) && sitter.availability[dayId].includes(blockId);

  // Hour helpers — booking is hour-based; the sitter's availability is block-based.
  const fmtH = (h) => `${String(h).padStart(2, '0')}:00`;
  const fmtRange = (s, e) => `${fmtH(s)}–${fmtH(e)}`;

  // Merge a day's blocks into contiguous hour ranges (e.g., afternoon+evening → [15,22]).
  function availableHourRanges(sitter, dayId) {
    const ids = sitter.availability?.[dayId] || [];
    if (!ids.length) return [];
    const blocks = ids
      .map((id) => BLOCKS.find((b) => b.id === id))
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
    const merged = [];
    for (const b of blocks) {
      const last = merged[merged.length - 1];
      if (last && last[1] === b.start) last[1] = b.end;
      else merged.push([b.start, b.end]);
    }
    return merged;
  }
  // Booking range [s,e] is valid only if a single availability window contains it fully.
  const rangeFits = (s, e, ranges) => ranges.some(([rs, re]) => rs <= s && re >= e);

  function avatar(person, size) {
    const cls = size === 'lg' ? 'avatar lg' : 'avatar';
    return `<span class="${cls}" style="background:${esc(person.color || '#6C5CE7')}">${esc(initials(person.name))}</span>`;
  }
  function stars(rating, max = 5) {
    let out = '';
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    for (let i = 0; i < max; i++) {
      if (i < full) out += '★';
      else if (i === full && half) out += '☆';
      else out += '☆';
    }
    return `<span class="rating" style="color:#F59E0B" aria-label="דירוג ${rating}">${out} <span class="small muted">${rating || '—'}</span></span>`;
  }

  function toast(msg) {
    const root = $('#toastRoot');
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  /* ===== Modal ===== */
  function openModal(title, contentHTML, onMount) {
    const root = $('#modalRoot');
    root.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div class="modal-head">
          <h3 id="modalTitle">${esc(title)}</h3>
          <button class="modal-close" aria-label="סגירה">×</button>
        </div>
        <div class="modal-body">${contentHTML}</div>
      </div>`;
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    $('.modal-close', root).onclick = closeModal;
    root.onclick = (e) => { if (e.target === root) closeModal(); };
    onMount?.($('.modal-body', root));
  }
  function closeModal() {
    const root = $('#modalRoot');
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = '';
  }

  /* ===== Router ===== */
  const routes = {
    'parent/search':   ParentSearch,
    'parent/sitter':   ParentSitterProfile, // expects id param
    'parent/bookings': ParentBookings,
    'parent/profile':  ParentProfile,
    'sitter/calendar': SitterCalendar,
    'sitter/requests': SitterRequests,
    'sitter/profile':  SitterProfile,
  };

  function navigate(path) {
    if (location.hash !== '#/' + path) location.hash = '#/' + path;
    else render();
  }

  function parseHash() {
    const raw = (location.hash || '#/').slice(2);
    const parts = raw.split('/').filter(Boolean);
    if (parts.length === 0) return { key: defaultRoute(), params: {} };
    // sitter profile with id: parent/sitter/:id
    if (parts[0] === 'parent' && parts[1] === 'sitter' && parts[2]) {
      return { key: 'parent/sitter', params: { id: parts[2] } };
    }
    const key = parts.slice(0, 2).join('/');
    return { key: routes[key] ? key : defaultRoute(), params: {} };
  }

  function defaultRoute() {
    return Store.user().role === 'sitter' ? 'sitter/calendar' : 'parent/search';
  }

  function render() {
    const { key, params } = parseHash();
    const renderer = routes[key] || routes[defaultRoute()];
    const main = $('#app');
    main.innerHTML = renderer(params) || '';
    main.scrollTop = 0;
    renderChrome(key);
    // Hook up any view-specific listeners
    renderer.mount?.(main, params);
  }

  window.addEventListener('hashchange', render);

  /* ===== Chrome: top role switch + bottom nav ===== */
  function renderChrome(activeKey) {
    const role = Store.user().role;
    $$('.role-seg').forEach((b) => b.classList.toggle('active', b.dataset.role === role));
    const nav = $('#bottomNav');
    const items =
      role === 'parent'
        ? [
            { key: 'parent/search',   icon: '🔍', label: 'חיפוש' },
            { key: 'parent/bookings', icon: '📅', label: 'הבקשות שלי' },
            { key: 'parent/profile',  icon: '👤', label: 'פרופיל' },
          ]
        : [
            { key: 'sitter/calendar', icon: '🗓️', label: 'יומן זמינות' },
            { key: 'sitter/requests', icon: '📨', label: 'בקשות' },
            { key: 'sitter/profile',  icon: '👤', label: 'פרופיל' },
          ];
    nav.innerHTML = items
      .map(
        (it) => `
        <button class="nav-btn ${activeKey === it.key ? 'active' : ''}" data-go="${it.key}">
          <span class="icon" aria-hidden="true">${it.icon}</span>
          <span>${it.label}</span>
        </button>`,
      )
      .join('');
    $$('.nav-btn', nav).forEach((b) => (b.onclick = () => navigate(b.dataset.go)));
    // Highlight "search" tab when on sitter profile too
    if (activeKey === 'parent/sitter') {
      const btn = $('.nav-btn[data-go="parent/search"]', nav);
      btn?.classList.add('active');
    }
  }

  /* ============================== PARENT: SEARCH ============================== */

  const DEFAULT_FILTERS = {
    days: [],            // ['thu']
    blocks: [],          // ['evening']
    ageMin: 14, ageMax: 30,
    minExp: 0,
    maxRate: 100,
    open: false,
  };
  let filters = { ...DEFAULT_FILTERS };

  function filterSitters(all) {
    return all
      .filter((s) => {
        if (s.age < filters.ageMin || s.age > filters.ageMax) return false;
        if (s.experienceYears < filters.minExp) return false;
        if (s.hourlyRate > filters.maxRate) return false;
        if (filters.days.length && filters.blocks.length) {
          // Match if ANY selected day has ANY selected block available.
          const ok = filters.days.some((d) =>
            filters.blocks.some((b) => isAvailable(s, d, b)),
          );
          if (!ok) return false;
        } else if (filters.days.length) {
          if (!filters.days.some((d) => (s.availability?.[d] || []).length > 0)) return false;
        } else if (filters.blocks.length) {
          if (!filters.blocks.some((b) => DAYS.some((d) => isAvailable(s, d.id, b)))) return false;
        }
        return true;
      })
      .sort((a, b) => avgRating(b) - avgRating(a));
  }

  function activeFilterCount() {
    let n = 0;
    if (filters.days.length) n++;
    if (filters.blocks.length) n++;
    if (filters.ageMin !== DEFAULT_FILTERS.ageMin || filters.ageMax !== DEFAULT_FILTERS.ageMax) n++;
    if (filters.minExp !== DEFAULT_FILTERS.minExp) n++;
    if (filters.maxRate !== DEFAULT_FILTERS.maxRate) n++;
    return n;
  }

  function ParentSearch() {
    const me = Store.me();
    const sitters = filterSitters(Store.sitters());
    const fc = activeFilterCount();
    return `
      <section class="hero">
        <div class="hero-brand">BABYMATCH</div>
        <h1>שלום ${esc(me.profile?.name.split(' ')[0] || '')} 👋</h1>
        <p>${esc(BRAND.tagline)}</p>
        <span class="pill">📍 ${esc(me.profile?.neighborhood || 'אזורך')}</span>
      </section>

      <div class="pillars">
        ${BRAND.pillars
          .map(
            (p) => `
          <div class="pillar" title="${esc(p.text)}">
            <span class="pillar-icon">${p.icon}</span>
            <span class="pillar-label">${esc(p.label)}</span>
          </div>`,
          )
          .join('')}
      </div>

      <button class="filter-toggle" id="filterToggle">
        <span>סינון מתקדם ${fc ? `<span class="count">${fc}</span>` : ''}</span>
        <span aria-hidden="true">${filters.open ? '▲' : '▼'}</span>
      </button>
      ${filters.open ? renderFilterSheet() : ''}

      <h2 class="section-title">${sitters.length} בייביסיטר זמינות</h2>
      <div id="sitterList">
        ${
          sitters.length === 0
            ? `<div class="empty card"><div class="icon">🔍</div>לא נמצאו תוצאות. נסי לשנות את הסינון.</div>`
            : sitters.map(sitterCardHTML).join('')
        }
      </div>
    `;
  }

  function renderFilterSheet() {
    return `
      <div class="filter-sheet">
        <div class="filter-group">
          <div class="filter-label">ימים</div>
          <div class="chip-row" id="dayChips">
            ${DAYS.map(
              (d) => `<button class="chip ${filters.days.includes(d.id) ? 'active' : ''}" data-day="${d.id}">${d.label}</button>`,
            ).join('')}
          </div>
        </div>
        <div class="filter-group">
          <div class="filter-label">שעות</div>
          <div class="chip-row" id="blockChips">
            ${BLOCKS.map(
              (b) => `<button class="chip ${filters.blocks.includes(b.id) ? 'active' : ''}" data-block="${b.id}">${b.label}<br><span class="small muted">${b.range}</span></button>`,
            ).join('')}
          </div>
        </div>
        <div class="filter-group">
          <div class="filter-label">גיל הבייביסיטר</div>
          <div class="range-row">
            <input type="number" id="ageMin" value="${filters.ageMin}" min="14" max="60" />
            <span>עד</span>
            <input type="number" id="ageMax" value="${filters.ageMax}" min="14" max="60" />
          </div>
        </div>
        <div class="filter-group">
          <div class="filter-label">ניסיון מינימלי (שנים)</div>
          <div class="range-row">
            <input type="number" id="minExp" value="${filters.minExp}" min="0" max="20" />
          </div>
        </div>
        <div class="filter-group">
          <div class="filter-label">תעריף מקסימלי לשעה (₪)</div>
          <div class="range-row">
            <input type="number" id="maxRate" value="${filters.maxRate}" min="20" max="200" step="5" />
          </div>
        </div>
        <div class="filter-actions">
          <button class="btn btn-ghost" id="clearFilters">ניקוי</button>
          <button class="btn btn-primary" id="applyFilters">החלת סינון</button>
        </div>
      </div>`;
  }

  function sitterCardHTML(s) {
    const r = avgRating(s);
    const todayId = DAYS[new Date().getDay()].id;
    const freeToday = (s.availability?.[todayId] || []).length > 0;
    return `
      <button class="card sitter-card" data-go-sitter="${s.id}">
        ${avatar(s)}
        <div class="meta">
          <div class="name-row">
            <span class="name">${esc(s.name)}</span>
            <span class="age">בת ${s.age}</span>
            ${freeToday ? '<span class="badge success">פנוי/ה היום</span>' : ''}
          </div>
          <div class="sub">
            ${stars(r)}
            <span>·</span>
            <span>📍 ${esc(s.neighborhood)}</span>
            <span>·</span>
            <span>${s.experienceYears} שנות ניסיון</span>
          </div>
        </div>
        <span class="price">₪${s.hourlyRate}/ש׳</span>
      </button>`;
  }

  ParentSearch.mount = (root) => {
    $('#filterToggle', root).onclick = () => {
      filters.open = !filters.open;
      render();
    };
    $$('[data-go-sitter]', root).forEach((b) => {
      b.onclick = () => navigate('parent/sitter/' + b.dataset.goSitter);
    });
    if (!filters.open) return;
    $$('#dayChips .chip', root).forEach((c) => {
      c.onclick = () => {
        const d = c.dataset.day;
        filters.days = filters.days.includes(d) ? filters.days.filter((x) => x !== d) : [...filters.days, d];
        render();
      };
    });
    $$('#blockChips .chip', root).forEach((c) => {
      c.onclick = () => {
        const b = c.dataset.block;
        filters.blocks = filters.blocks.includes(b) ? filters.blocks.filter((x) => x !== b) : [...filters.blocks, b];
        render();
      };
    });
    $('#applyFilters', root).onclick = () => {
      filters.ageMin  = Number($('#ageMin', root).value)  || DEFAULT_FILTERS.ageMin;
      filters.ageMax  = Number($('#ageMax', root).value)  || DEFAULT_FILTERS.ageMax;
      filters.minExp  = Number($('#minExp', root).value)  || 0;
      filters.maxRate = Number($('#maxRate', root).value) || DEFAULT_FILTERS.maxRate;
      filters.open = false;
      render();
      toast('הסינון הוחל');
    };
    $('#clearFilters', root).onclick = () => {
      filters = { ...DEFAULT_FILTERS, open: true };
      render();
    };
  };

  /* ============================== PARENT: SITTER PROFILE ============================== */

  function ParentSitterProfile({ id }) {
    const s = Store.sitters().find((x) => x.id === id);
    if (!s) return `<div class="empty card">בייביסיטר לא נמצאה. <button class="link-btn" id="back">חזרה</button></div>`;
    const r = avgRating(s);
    return `
      <button class="link-btn" id="back">← חזרה לחיפוש</button>

      <div class="card">
        <div class="profile-header">
          ${avatar(s, 'lg')}
          <div class="info">
            <h1 class="name">${esc(s.name)}</h1>
            <p class="sub">בת ${s.age} · 📍 ${esc(s.neighborhood)}</p>
            <p class="sub">${stars(r)} <span class="muted">(${s.reviews.length} ביקורות)</span></p>
          </div>
        </div>
        <p class="small">${esc(s.bio)}</p>
        <div class="profile-stats">
          <div class="stat"><div class="value">₪${s.hourlyRate}</div><div class="label">לשעה</div></div>
          <div class="stat"><div class="value">${s.experienceYears}</div><div class="label">שנות ניסיון</div></div>
          <div class="stat"><div class="value">${r || '—'}</div><div class="label">דירוג ממוצע</div></div>
        </div>
      </div>

      <h2 class="section-title">זמינות שבועית</h2>
      ${renderCalendar(s, false)}

      <h2 class="section-title">ביקורות (${s.reviews.length})</h2>
      ${
        s.reviews
          .slice()
          .sort((a, b) => (a.date < b.date ? 1 : -1))
          .map(
            (rv) => `
        <div class="review">
          <div class="head">
            <span class="who">${esc(rv.parentName)}</span>
            <span class="date">${esc(rv.date)}</span>
          </div>
          <div class="stars">${'★'.repeat(rv.rating)}${'☆'.repeat(5 - rv.rating)}</div>
          <div class="text">${esc(rv.text)}</div>
        </div>`,
          )
          .join('')
      }

      <div class="sticky-cta">
        <button class="btn btn-primary btn-block" id="book">הזמנת בייביסיטר</button>
      </div>
    `;
  }

  ParentSitterProfile.mount = (root, { id }) => {
    $('#back', root)?.addEventListener('click', () => navigate('parent/search'));
    $('#book', root)?.addEventListener('click', () => openBookingModal(id));
  };

  /* ============================== CALENDAR ============================== */

  function renderCalendar(sitter, editable) {
    const cells = [];
    cells.push(`<div class="cell head"></div>`);
    DAYS.forEach((d) => cells.push(`<div class="cell head">${d.label}</div>`));
    BLOCKS.forEach((b) => {
      cells.push(`<div class="cell row-label">${b.label}</div>`);
      DAYS.forEach((d) => {
        const on = isAvailable(sitter, d.id, b.id);
        cells.push(
          `<div class="cell slot ${on ? 'on' : ''}" data-day="${d.id}" data-block="${b.id}" ${editable ? 'role="button" tabindex="0"' : ''}>•</div>`,
        );
      });
    });
    return `
      <div class="cal-wrap">
        <div class="cal ${editable ? 'editable' : ''}">${cells.join('')}</div>
        <div class="cal-legend">
          <span><span class="dot" style="background:var(--primary)"></span>פנויה</span>
          <span><span class="dot" style="background:#F3F1FB"></span>לא פנויה</span>
          ${editable ? '<span class="muted">· לחיצה על משבצת מסמנת זמינות</span>' : ''}
        </div>
      </div>`;
  }

  /* ============================== BOOKING MODAL ============================== */

  function openBookingModal(sitterId) {
    const sitter = Store.sitters().find((s) => s.id === sitterId);
    if (!sitter) return;

    // Build a list of next 14 days that have at least one available block.
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const dayId = DAYS[d.getDay()].id;
      const ranges = availableHourRanges(sitter, dayId);
      const blocks = sitter.availability?.[dayId] || [];
      if (ranges.length) days.push({ iso, dayId, ranges, blocks });
    }

    if (!days.length) {
      openModal(
        'הזמנת בייביסיטר',
        `<p>${esc(sitter.name)} אינו פנוי ב-14 הימים הקרובים. כדאי לבחור בייביסיטר אחר.</p>`,
      );
      return;
    }

    // Selectable hours: 7..24 (24 = midnight end-of-day).
    const HOURS = Array.from({ length: 18 }, (_, i) => 7 + i);

    let selDay = days[0];
    // Default to the first available window, capped at 3 hours or end-of-window.
    let startH = selDay.ranges[0][0];
    let endH = Math.min(selDay.ranges[0][1], startH + 3);

    const hourOpts = (selected, filter = () => true) =>
      HOURS.filter(filter)
        .map((h) => `<option value="${h}" ${h === selected ? 'selected' : ''}>${fmtH(h)}</option>`)
        .join('');

    const content = `
      <div class="field">
        <label>תאריך</label>
        <select id="dateSel">
          ${days.map((d) => `<option value="${d.iso}">${formatDateHe(d.iso)}</option>`).join('')}
        </select>
      </div>

      <div class="field">
        <label>שעות</label>
        <div class="row-2 hours-row">
          <div>
            <span class="muted small">מ-</span>
            <select id="startH">${hourOpts(startH, (h) => h < 24)}</select>
          </div>
          <div>
            <span class="muted small">עד</span>
            <select id="endH">${hourOpts(endH, (h) => h > startH)}</select>
          </div>
        </div>
        <div class="muted small mt-8">
          <strong>בחירה מהירה:</strong>
          <div class="chip-row mt-8" id="blockQuickPick"></div>
        </div>
        <div class="avail-hint" id="availHint"></div>
      </div>

      <div class="field">
        <label>הערה לבייביסיטר (לא חובה)</label>
        <textarea id="noteInput" placeholder="פרטים על הילדים, שעת השכבה, אלרגיות..."></textarea>
      </div>

      <div class="row-between">
        <span class="muted">סה״כ משוער:</span>
        <span id="totalCalc" class="price">—</span>
      </div>
      <div id="bookError" class="book-error" hidden></div>

      <div class="btn-row mt-12">
        <button class="btn btn-ghost" id="cancelBook">ביטול</button>
        <button class="btn btn-primary" id="confirmBook">שליחת בקשה</button>
      </div>`;

    openModal('הזמנה אצל ' + sitter.name, content, (body) => {
      const startSel = $('#startH', body);
      const endSel   = $('#endH', body);
      const dateSel  = $('#dateSel', body);
      const totalEl  = $('#totalCalc', body);
      const errEl    = $('#bookError', body);
      const hintEl   = $('#availHint', body);
      const confirmBtn = $('#confirmBook', body);
      const quickPick = $('#blockQuickPick', body);

      function refreshHourOptions() {
        // start: any hour 7..23
        startSel.innerHTML = hourOpts(startH, (h) => h < 24);
        // end: must be > start
        endSel.innerHTML = hourOpts(endH, (h) => h > startH);
        if (endH <= startH) {
          endH = startH + 1;
          endSel.value = String(endH);
        }
      }

      function refreshQuickPick() {
        quickPick.innerHTML = selDay.blocks
          .map((bId) => {
            const b = blockById(bId);
            const active = b.start === startH && b.end === endH ? 'active' : '';
            return `<button class="chip ${active}" data-s="${b.start}" data-e="${b.end}">${b.label}<br><span class="small">${b.range}</span></button>`;
          })
          .join('');
        $$('.chip', quickPick).forEach((c) => {
          c.onclick = () => {
            startH = Number(c.dataset.s);
            endH = Number(c.dataset.e);
            refreshHourOptions();
            refreshAll();
          };
        });
      }

      function refreshHint() {
        const windowsTxt = selDay.ranges.map(([s, e]) => fmtRange(s, e)).join(' · ');
        hintEl.innerHTML = `<span class="muted small">זמינות הבייביסיטר ב${formatDateHe(selDay.iso).replace('· ', '')}:</span> <strong>${windowsTxt}</strong>`;
      }

      function refreshTotal() {
        const hours = endH - startH;
        const valid = hours > 0 && rangeFits(startH, endH, selDay.ranges);
        if (hours <= 0) {
          totalEl.textContent = '—';
          showError('שעת הסיום חייבת להיות אחרי שעת ההתחלה.');
          return;
        }
        totalEl.textContent = `₪${hours * sitter.hourlyRate} (${hours} שעות)`;
        if (!valid) {
          const windows = selDay.ranges.map(([s, e]) => fmtRange(s, e)).join(' או ');
          showError(`הטווח ${fmtRange(startH, endH)} מחוץ לזמינות. ${sitter.name} פנוי/ה ב-${windows}.`);
        } else {
          hideError();
        }
      }

      function showError(msg) {
        errEl.textContent = msg;
        errEl.hidden = false;
        confirmBtn.disabled = true;
      }
      function hideError() {
        errEl.hidden = true;
        confirmBtn.disabled = false;
      }

      function refreshAll() {
        refreshHint();
        refreshQuickPick();
        refreshTotal();
      }

      dateSel.onchange = (e) => {
        selDay = days.find((d) => d.iso === e.target.value);
        // Snap start/end into the first available window of the new day if currently out of range.
        if (!rangeFits(startH, endH, selDay.ranges)) {
          const [rs, re] = selDay.ranges[0];
          startH = rs;
          endH = Math.min(re, rs + 3);
        }
        refreshHourOptions();
        refreshAll();
      };

      startSel.onchange = () => {
        startH = Number(startSel.value);
        if (endH <= startH) endH = Math.min(24, startH + 1);
        refreshHourOptions();
        refreshAll();
      };
      endSel.onchange = () => {
        endH = Number(endSel.value);
        refreshTotal();
        refreshQuickPick();
      };

      $('#cancelBook', body).onclick = closeModal;
      confirmBtn.onclick = () => {
        if (!rangeFits(startH, endH, selDay.ranges) || endH <= startH) return;
        const note = $('#noteInput', body).value.trim();
        const req = {
          id: 'r_' + Date.now(),
          parentId: Store.user().parentId,
          sitterId,
          dateISO: selDay.iso,
          startH,
          endH,
          status: 'pending',
          note,
          createdAt: today(),
        };
        Store.saveRequest(req);
        closeModal();
        toast('הבקשה נשלחה! 🎉');
        navigate('parent/bookings');
      };

      refreshAll();
    });
  }

  /* ============================== PARENT: BOOKINGS ============================== */

  let bookingsTab = 'pending';

  function ParentBookings() {
    const me = Store.me();
    const all = Store.requests().filter((r) => r.parentId === me.parentId);
    const groups = { pending: [], accepted: [], declined: [] };
    all.forEach((r) => groups[r.status]?.push(r));
    const list = groups[bookingsTab].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
    const sitters = Store.sitters();

    return `
      <h1 class="page-title">הבקשות שלי</h1>
      <p class="page-sub">מעקב אחר סטטוס הבקשות שיצרת</p>
      <div class="tabs">
        <button class="tab ${bookingsTab === 'pending' ? 'active' : ''}" data-tab="pending">ממתינות (${groups.pending.length})</button>
        <button class="tab ${bookingsTab === 'accepted' ? 'active' : ''}" data-tab="accepted">אושרו (${groups.accepted.length})</button>
        <button class="tab ${bookingsTab === 'declined' ? 'active' : ''}" data-tab="declined">נדחו (${groups.declined.length})</button>
      </div>
      <div id="bookingList">
        ${
          list.length === 0
            ? `<div class="empty card"><div class="icon">📭</div>אין הזמנות בקטגוריה זו.</div>`
            : list.map((r) => parentBookingCard(r, sitters)).join('')
        }
      </div>
    `;
  }

  function parentBookingCard(r, sitters) {
    const s = sitters.find((x) => x.id === r.sitterId) || { name: 'לא ידוע', color: '#999' };
    const statusBadge =
      r.status === 'pending' ? '<span class="badge warning">ממתין לאישור</span>'
      : r.status === 'accepted' ? '<span class="badge success">אושר</span>'
      : '<span class="badge danger">נדחה</span>';
    const hours = r.endH - r.startH;
    const total = hours * (s.hourlyRate || 0);
    return `
      <div class="card booking-card-wrap">
        <div class="booking-card">
          ${avatar(s)}
          <div style="flex:1;min-width:0;">
            <div class="when">${esc(s.name)}</div>
            <div class="sub">${formatDateHe(r.dateISO)} · ${fmtRange(r.startH, r.endH)}</div>
            <div class="sub">${statusBadge} · ₪${total} (${hours} שעות)</div>
          </div>
        </div>
        <div class="actions">
          ${r.status === 'pending' ? `<button class="btn btn-sm btn-ghost" data-cancel="${r.id}">ביטול בקשה</button>` : ''}
          ${r.status === 'accepted' ? `<button class="btn btn-sm btn-outline" data-review="${r.id}">כתיבת ביקורת</button>` : ''}
          <button class="btn btn-sm btn-ghost" data-view="${r.sitterId}">לפרופיל</button>
        </div>
      </div>`;
  }

  ParentBookings.mount = (root) => {
    $$('.tab', root).forEach((t) => (t.onclick = () => { bookingsTab = t.dataset.tab; render(); }));
    $$('[data-view]', root).forEach((b) => (b.onclick = () => navigate('parent/sitter/' + b.dataset.view)));
    $$('[data-cancel]', root).forEach((b) =>
      (b.onclick = () => {
        const reqs = Store.requests().filter((r) => r.id !== b.dataset.cancel);
        write(K.requests, reqs);
        toast('הבקשה בוטלה');
        render();
      }),
    );
    $$('[data-review]', root).forEach((b) =>
      (b.onclick = () => openReviewModal(b.dataset.review)),
    );
  };

  function openReviewModal(reqId) {
    const req = Store.requests().find((r) => r.id === reqId);
    if (!req) return;
    const sitter = Store.sitters().find((s) => s.id === req.sitterId);
    const me = Store.me();
    let rating = 5;
    const content = `
      <p class="muted">איך הייתה החוויה עם ${esc(sitter.name)}?</p>
      <div class="center">
        <div class="star-input" id="starInput">
          ${[1,2,3,4,5].map((n) => `<span class="s ${n <= rating ? 'on' : ''}" data-n="${n}">★</span>`).join('')}
        </div>
      </div>
      <div class="field mt-12">
        <label>תיאור (לא חובה)</label>
        <textarea id="reviewText" placeholder="מה הילדים אמרו? איך הייתה ההתנהלות?"></textarea>
      </div>
      <div class="btn-row">
        <button class="btn btn-ghost" id="cancelRev">ביטול</button>
        <button class="btn btn-primary" id="saveRev">פרסום ביקורת</button>
      </div>`;
    openModal('ביקורת על ' + sitter.name, content, (body) => {
      const stars = $$('#starInput .s', body);
      stars.forEach((el) => {
        el.onclick = () => {
          rating = Number(el.dataset.n);
          stars.forEach((s) => s.classList.toggle('on', Number(s.dataset.n) <= rating));
        };
      });
      $('#cancelRev', body).onclick = closeModal;
      $('#saveRev', body).onclick = () => {
        const text = $('#reviewText', body).value.trim() || 'ביקורת ללא טקסט.';
        sitter.reviews.unshift({ parentName: me.profile.name, rating, text, date: today() });
        Store.saveSitter(sitter);
        closeModal();
        toast('הביקורת פורסמה. תודה!');
        render();
      };
    });
  }

  /* ============================== PARENT: PROFILE ============================== */

  function ParentProfile() {
    const me = Store.me();
    const p = me.profile;
    return `
      <h1 class="page-title">הפרופיל שלי</h1>
      <p class="page-sub">המידע נשמר אוטומטית</p>
      <div class="card">
        <div class="profile-header">
          ${avatar(p, 'lg')}
          <div class="info">
            <h2 class="name">${esc(p.name)}</h2>
            <p class="sub">📍 ${esc(p.neighborhood)} · ${p.childrenAges.length} ילדים</p>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="field">
          <label>שם מלא</label>
          <input id="pName" value="${esc(p.name)}" />
        </div>
        <div class="field">
          <label>שכונה / יישוב</label>
          <input id="pHood" value="${esc(p.neighborhood)}" />
        </div>
        <div class="field">
          <label>גילאי הילדים (מופרדים בפסיק)</label>
          <input id="pAges" value="${p.childrenAges.join(', ')}" />
        </div>
        <div class="field">
          <label>הערות לבייביסיטר</label>
          <textarea id="pNotes" placeholder="אלרגיות, שעת שינה, חוקי בית...">${esc(p.notes || '')}</textarea>
        </div>
        <button class="btn btn-primary btn-block" id="saveProfile">שמירה</button>
      </div>
    `;
  }
  ParentProfile.mount = (root) => {
    $('#saveProfile', root).onclick = () => {
      const p = { ...Store.me().profile };
      p.name = $('#pName', root).value.trim() || p.name;
      p.neighborhood = $('#pHood', root).value.trim() || p.neighborhood;
      p.childrenAges = $('#pAges', root).value.split(',').map((x) => Number(x.trim())).filter(Boolean);
      p.notes = $('#pNotes', root).value.trim();
      Store.saveParent(p);
      toast('הפרופיל עודכן');
      render();
    };
  };

  /* ============================== SITTER: CALENDAR ============================== */

  function SitterCalendar() {
    const me = Store.me();
    const s = me.profile;
    return `
      <h1 class="page-title">היומן שלי</h1>
      <p class="page-sub">לחיצה על משבצת מסמנת זמינות</p>
      ${renderCalendar(s, true)}
      <div class="card mt-16">
        <div class="row-between">
          <div>
            <div style="font-weight:700">סיכום שבועי</div>
            <div class="sub muted small">סך הכל משבצות פנויות</div>
          </div>
          <div class="badge accent">${weeklySlotCount(s)} משבצות</div>
        </div>
      </div>
    `;
  }
  function weeklySlotCount(s) {
    return DAYS.reduce((n, d) => n + (s.availability?.[d.id]?.length || 0), 0);
  }
  SitterCalendar.mount = (root) => {
    $$('.cal.editable .slot', root).forEach((cell) => {
      const handler = () => {
        const s = { ...Store.me().profile };
        s.availability = { ...(s.availability || {}) };
        const dayId = cell.dataset.day;
        const blockId = cell.dataset.block;
        const cur = new Set(s.availability[dayId] || []);
        if (cur.has(blockId)) cur.delete(blockId); else cur.add(blockId);
        s.availability[dayId] = Array.from(cur);
        Store.saveSitter(s);
        render();
      };
      cell.onclick = handler;
      cell.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } };
    });
  };

  /* ============================== SITTER: REQUESTS ============================== */

  let sitterTab = 'pending';

  function SitterRequests() {
    const me = Store.me();
    const all = Store.requests().filter((r) => r.sitterId === me.sitterId);
    const groups = { pending: [], history: [] };
    all.forEach((r) => (r.status === 'pending' ? groups.pending : groups.history).push(r));
    const list = (sitterTab === 'pending' ? groups.pending : groups.history)
      .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
    const parents = Store.parents();
    return `
      <h1 class="page-title">בקשות הזמנה</h1>
      <div class="tabs">
        <button class="tab ${sitterTab === 'pending' ? 'active' : ''}" data-tab="pending">חדשות (${groups.pending.length})</button>
        <button class="tab ${sitterTab === 'history' ? 'active' : ''}" data-tab="history">היסטוריה (${groups.history.length})</button>
      </div>
      <div id="reqList">
        ${
          list.length === 0
            ? `<div class="empty card"><div class="icon">${sitterTab === 'pending' ? '✨' : '📂'}</div>${sitterTab === 'pending' ? 'אין בקשות חדשות. כשתתקבל בקשה — תופיעי כאן.' : 'אין היסטוריה עדיין.'}</div>`
            : list.map((r) => sitterReqCard(r, parents, Store.me().profile)).join('')
        }
      </div>
    `;
  }

  function sitterReqCard(r, parents, me) {
    const p = parents.find((x) => x.id === r.parentId) || { name: 'הורה', color: '#999', childrenAges: [], neighborhood: '' };
    const hours = r.endH - r.startH;
    const total = hours * me.hourlyRate;
    const statusBadge =
      r.status === 'pending' ? '<span class="badge warning">ממתין לתשובה</span>'
      : r.status === 'accepted' ? '<span class="badge success">אושרה</span>'
      : '<span class="badge danger">נדחתה</span>';
    return `
      <div class="card req-card">
        <div class="req-head">
          ${avatar(p)}
          <div class="req-info">
            <div style="font-weight:700">${esc(p.name)}</div>
            <div class="sub muted small">📍 ${esc(p.neighborhood)} · ילדים בגילאי ${p.childrenAges.join(', ') || '—'}</div>
          </div>
          ${statusBadge}
        </div>
        <div class="mt-12">
          <div><strong>${formatDateHe(r.dateISO)}</strong> · ${fmtRange(r.startH, r.endH)}</div>
          <div class="total">סה״כ ₪${total} (${hours} שעות)</div>
        </div>
        ${r.note ? `<div class="note">📝 ${esc(r.note)}</div>` : ''}
        ${
          r.status === 'pending'
            ? `<div class="btn-row mt-12">
                 <button class="btn btn-danger"  data-decline="${r.id}">דחייה</button>
                 <button class="btn btn-success" data-accept="${r.id}">אישור</button>
               </div>`
            : ''
        }
      </div>`;
  }

  SitterRequests.mount = (root) => {
    $$('.tab', root).forEach((t) => (t.onclick = () => { sitterTab = t.dataset.tab; render(); }));
    const setStatus = (id, status) => {
      const r = Store.requests().find((x) => x.id === id);
      if (!r) return;
      r.status = status;
      Store.saveRequest(r);
      toast(status === 'accepted' ? 'הבקשה אושרה ✓' : 'הבקשה נדחתה');
      render();
    };
    $$('[data-accept]', root).forEach((b) => (b.onclick = () => setStatus(b.dataset.accept, 'accepted')));
    $$('[data-decline]', root).forEach((b) => (b.onclick = () => setStatus(b.dataset.decline, 'declined')));
  };

  /* ============================== SITTER: PROFILE ============================== */

  function SitterProfile() {
    const me = Store.me();
    const s = me.profile;
    const r = avgRating(s);
    return `
      <h1 class="page-title">הפרופיל שלי</h1>
      <p class="page-sub">ככה ההורים יראו אותך:</p>
      ${sitterCardHTML(s)}

      <div class="card mt-12">
        <div class="field">
          <label>שם מלא</label>
          <input id="sName" value="${esc(s.name)}" />
        </div>
        <div class="row-2">
          <div class="field">
            <label>גיל</label>
            <input id="sAge" type="number" min="14" max="60" value="${s.age}" />
          </div>
          <div class="field">
            <label>שנות ניסיון</label>
            <input id="sExp" type="number" min="0" max="20" value="${s.experienceYears}" />
          </div>
        </div>
        <div class="row-2">
          <div class="field">
            <label>תעריף לשעה (₪)</label>
            <input id="sRate" type="number" min="20" max="200" value="${s.hourlyRate}" />
          </div>
          <div class="field">
            <label>שכונה</label>
            <input id="sHood" value="${esc(s.neighborhood)}" />
          </div>
        </div>
        <div class="field">
          <label>תיאור קצר</label>
          <textarea id="sBio" maxlength="200">${esc(s.bio || '')}</textarea>
        </div>
        <button class="btn btn-primary btn-block" id="saveSitter">שמירה</button>
      </div>

      <h2 class="section-title">ביקורות שקיבלת (${s.reviews.length})</h2>
      <p class="muted small">דירוג ממוצע: ${stars(r)}</p>
      ${
        s.reviews
          .slice()
          .sort((a, b) => (a.date < b.date ? 1 : -1))
          .slice(0, 5)
          .map(
            (rv) => `
        <div class="review">
          <div class="head">
            <span class="who">${esc(rv.parentName)}</span>
            <span class="date">${esc(rv.date)}</span>
          </div>
          <div class="stars">${'★'.repeat(rv.rating)}${'☆'.repeat(5 - rv.rating)}</div>
          <div class="text">${esc(rv.text)}</div>
        </div>`,
          )
          .join('')
      }
    `;
  }
  SitterProfile.mount = (root) => {
    $('#saveSitter', root).onclick = () => {
      const s = { ...Store.me().profile };
      s.name = $('#sName', root).value.trim() || s.name;
      s.age = Number($('#sAge', root).value) || s.age;
      s.experienceYears = Number($('#sExp', root).value) || s.experienceYears;
      s.hourlyRate = Number($('#sRate', root).value) || s.hourlyRate;
      s.neighborhood = $('#sHood', root).value.trim() || s.neighborhood;
      s.bio = $('#sBio', root).value.trim();
      Store.saveSitter(s);
      toast('הפרופיל עודכן');
      render();
    };
  };

  /* ============================== ABOUT MODAL ============================== */

  function openAboutModal() {
    const content = `
      <div class="about-hero">
        <div class="about-brand">${esc(BRAND.appName)}</div>
        <p class="about-tagline">${esc(BRAND.tagline)}</p>
      </div>
      <p class="muted small mt-12">
        BABYMATCH פותרת את הקושי של הורים למצוא בייביסיטר אמינה ופנויה בזמן קצר,
        ושל בייביסיטרים להציג זמינות ולהרגיש בטוחים מול משפחות חדשות.
      </p>

      <h4 class="section-title">עמודי הערך</h4>
      <div class="about-pillars">
        ${BRAND.pillars
          .map(
            (p) => `
          <div class="about-pillar">
            <span class="pillar-icon lg">${p.icon}</span>
            <div>
              <div class="about-pillar-label">${esc(p.label)}</div>
              <div class="muted small">${esc(p.text)}</div>
            </div>
          </div>`,
          )
          .join('')}
      </div>

      <h4 class="section-title">מה בנינו בגרסה הראשונה (MVP) ולמה</h4>
      <p class="muted small">${esc(BRAND.mvp.intro)}</p>
      <ul class="about-list">
        ${BRAND.mvp.features
          .map(
            (f) => `<li><strong>${esc(f.label)}</strong> — <span class="muted">${esc(f.text)}</span></li>`,
          )
          .join('')}
      </ul>
      <p class="muted small">${esc(BRAND.mvp.reason)}</p>

      <h4 class="section-title">סגנון העיצוב</h4>
      <p class="muted small">${esc(BRAND.designStyle.intro)}</p>
      <ul class="about-list">
        ${BRAND.designStyle.choices
          .map(
            (c) => `<li><strong>${esc(c.label)}</strong> — <span class="muted">${esc(c.text)}</span></li>`,
          )
          .join('')}
      </ul>

      <h4 class="section-title">מגישים</h4>
      <div class="about-authors">
        ${BRAND.authors.map((a) => `<span class="badge accent">${esc(a)}</span>`).join('')}
      </div>
      <p class="muted small center mt-12">
        פרויקט קורס · עקרונות חשיבה עיצובית בחדשנות<br>
        המכללה האקדמית רמת גן · Agile Management Institute
      </p>
    `;
    openModal('אודות', content);
  }

  /* ============================== BOOT ============================== */

  function init() {
    seedIfEmpty();

    // Role switch
    $$('.role-seg').forEach((b) => {
      b.onclick = () => {
        Store.setRole(b.dataset.role);
        navigate(defaultRoute());
      };
    });

    // About modal
    $('#aboutBtn').onclick = openAboutModal;

    // Reset demo
    $('#resetDemo').onclick = () => {
      if (confirm('לאפס את כל נתוני הדמו?')) {
        resetAll();
        filters = { ...DEFAULT_FILTERS };
        bookingsTab = 'pending';
        sitterTab = 'pending';
        navigate(defaultRoute());
        toast('הדמו אופס');
      }
    };

    // Initial route
    if (!location.hash || location.hash === '#/') {
      navigate(defaultRoute());
    } else {
      render();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
