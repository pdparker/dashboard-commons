/*
 * dashboard-commons — shared runtime for Phil's dashboard suite.
 * https://pdparker.github.io/dashboard-commons/
 *
 * Usage (one line in each dashboard's <head> or end of <body>):
 *   <script src="https://pdparker.github.io/dashboard-commons/commons.js"
 *           data-dash="edu-numbers" defer></script>
 *
 * data-dash identifies the current dashboard (see DASHBOARDS below) and
 * triggers automatic injection of the suite nav strip. Omit data-dash to
 * load the API only (DashCommons.state / DashCommons.registry) with no UI.
 */
(function () {
  'use strict';

  var HUB_URL = 'https://pdparker.github.io/Phil-s-Dashboard/';

  var DASHBOARDS = [
    { id: 'cricos',           title: 'CRICOS Course Changes',   url: 'https://pdparker.github.io/cricos-dashboard-2025-2026/' },
    { id: 'intl-demand',      title: 'International Student Demand', url: 'https://pdparker.github.io/intl-student-demand/' },
    { id: 'edu-numbers',      title: 'Edu Numbers Australia',   url: 'https://pdparker.github.io/edu_numbers_australia/' },
    { id: 'grants',           title: 'Grant Outcomes',          url: 'https://pdparker.github.io/grant-outcomes/' },
    { id: 'outcomes',         title: 'University Outcomes',     url: 'https://pdparker.github.io/university-outcomes-dashboard/' },
    { id: 'staff',            title: 'University Staff',        url: 'https://pdparker.github.io/uni-staff-dashboard/' },
    { id: 'rankings',         title: 'University Rankings',     url: 'https://pdparker.github.io/uni_rankings/' },
    { id: 'student-signals',  title: 'Student Interest Signals', url: 'https://pdparker.github.io/student-interest-signals/' }
  ];

  // Resolve the commons base URL from this script's own src, so everything
  // (registry fetch, links) also works when served from localhost.
  var script = document.currentScript;
  var BASE = script && script.src ? script.src.replace(/\/commons\.js.*$/, '') : 'https://pdparker.github.io/dashboard-commons';

  /* ---------------- URL state ---------------- */
  // Filter state lives in the query string so any view is shareable.
  var state = {
    get: function (key, fallback) {
      var v = new URLSearchParams(window.location.search).get(key);
      return v === null ? (fallback === undefined ? null : fallback) : v;
    },
    getAll: function () {
      var out = {};
      new URLSearchParams(window.location.search).forEach(function (v, k) { out[k] = v; });
      return out;
    },
    set: function (key, value) {
      var params = new URLSearchParams(window.location.search);
      if (value === null || value === undefined || value === '') params.delete(key);
      else params.set(key, value);
      var qs = params.toString();
      history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
    }
  };

  /* ---------------- Institution registry ---------------- */
  var registryPromise = null;
  function registry() {
    if (!registryPromise) {
      registryPromise = fetch(BASE + '/institutions.json')
        .then(function (r) {
          if (!r.ok) throw new Error('registry fetch failed: ' + r.status);
          return r.json();
        })
        .then(function (data) {
          var byId = {};
          var byName = {}; // lowercased name + aliases -> institution
          data.institutions.forEach(function (inst) {
            byId[inst.id] = inst;
            byName[inst.name.toLowerCase()] = inst;
            byName[inst.id.toLowerCase()] = inst;
            (inst.aliases || []).forEach(function (a) { byName[a.toLowerCase()] = inst; });
          });
          return {
            version: data.version,
            groups: data.groups,
            institutions: data.institutions,
            byId: byId,
            lookup: function (name) {
              return name ? (byName[String(name).trim().toLowerCase()] || null) : null;
            },
            inGroup: function (groupId) {
              return data.institutions.filter(function (i) {
                return (i.groups || []).indexOf(groupId) !== -1;
              });
            }
          };
        });
    }
    return registryPromise;
  }

  /* ---------------- Suite nav strip ---------------- */
  function injectNav(currentId) {
    if (document.getElementById('dashcommons-nav')) return;

    var css = [
      '#dashcommons-nav{background:#3C1053;font-family:Arial,Helvetica,sans-serif;',
      'padding:0 16px;display:flex;align-items:center;gap:18px;overflow-x:auto;',
      'white-space:nowrap;-webkit-font-smoothing:antialiased;position:relative;z-index:9999}',
      '#dashcommons-nav a{color:#fff;text-decoration:none;font-size:12px;',
      'padding:8px 0;display:inline-block;opacity:.85;border-bottom:2px solid transparent}',
      '#dashcommons-nav a:hover{opacity:1}',
      '#dashcommons-nav a.dc-hub{font-weight:700;letter-spacing:.08em;',
      'text-transform:uppercase;opacity:1}',
      '#dashcommons-nav a.dc-current{opacity:1;font-weight:700;border-bottom-color:#F2120C}'
    ].join('');

    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var nav = document.createElement('nav');
    nav.id = 'dashcommons-nav';
    nav.setAttribute('aria-label', "Phil's dashboard suite");

    var html = '<a class="dc-hub" href="' + HUB_URL + '">Phil&#8217;s Dashboards</a>';
    DASHBOARDS.forEach(function (d) {
      var cls = d.id === currentId ? ' class="dc-current" aria-current="page"' : '';
      html += '<a' + cls + ' href="' + d.url + '">' + d.title + '</a>';
    });
    nav.innerHTML = html;

    document.body.insertBefore(nav, document.body.firstChild);
  }

  /* ---------------- Public API ---------------- */
  window.DashCommons = {
    BASE: BASE,
    HUB_URL: HUB_URL,
    DASHBOARDS: DASHBOARDS,
    state: state,
    registry: registry,
    injectNav: injectNav
  };

  var current = script ? script.getAttribute('data-dash') : null;
  if (current) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { injectNav(current); });
    } else {
      injectNav(current);
    }
  }
})();
