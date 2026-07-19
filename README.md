# dashboard-commons

Shared infrastructure for [Phil's dashboard suite](https://pdparker.github.io/Phil-s-Dashboard/).
Published at **https://pdparker.github.io/dashboard-commons/** — same GitHub Pages origin as every
dashboard, so all fetches are same-origin (no CORS).

| File | What it is |
|---|---|
| `institutions.json` | Canonical institution registry: names, aliases, state, Go8/ATN/IRU/RUN/SACRU membership. Edit **here**, never in individual dashboards. |
| `commons.js` | Suite nav strip + URL-state helpers + registry loader. Zero dependencies. |
| `assets/acu-tokens.css` | ACU brand design tokens (purple `#3C1053` carries, red `#F2120C` punctuates). |
| `schema/manifest.schema.json` | Schema for the `manifest.json` each dashboard publishes; the hub reads these for freshness badges. |
| `index.html` | Live demo + documentation page. |

## Retrofit checklist (sessions 1.3–1.8)

For each dashboard repo, in order:

1. **Nav strip** — add before `</body>`:
   ```html
   <script src="https://pdparker.github.io/dashboard-commons/commons.js"
           data-dash="<id>" defer></script>
   ```
   Ids: `cricos` · `edu-numbers` · `outcomes` · `staff` · `rankings` · `student-signals`.
   If the dashboard has a sticky/fixed header, check the strip doesn't collide (it inserts as the
   first child of `<body>`, `position: relative`, `z-index: 9999`).

2. **URL state** — wire every filter control through `DashCommons.state`:
   - on change: `DashCommons.state.set('inst', value)`
   - on load: initialise controls from `DashCommons.state.get('inst')` before first render.
   Convention for shared keys: `inst` (institution id from the registry), `level` (ug/pg),
   `metric`, `field`, `state` (AU state), `year`.

3. **ACU default** — when the dashboard has an institution selector and no `?inst=` param is
   present, default to `australian-catholic-university` (resolve display name via the registry).

4. **Registry names** — resolve institution display names through
   `DashCommons.registry()`/`lookup()` rather than hand-rolled lists where practical. At minimum,
   don't add new name variants; add missing aliases to `institutions.json` here instead.

5. **Manifest** — publish `manifest.json` at the repo root per
   [`schema/manifest.schema.json`](schema/manifest.schema.json)
   ([example](schema/manifest.example.json)). Update `lastBuild` on every content change.

6. **CSV export** — every data table gets an "Export CSV" affordance (plain JS, generate from the
   already-loaded data, `Blob` + `download` attribute).

## API sketch

```js
DashCommons.state.get('inst', 'australian-catholic-university');
DashCommons.state.set('metric', 'employment-rate');   // updates URL via replaceState

const reg = await DashCommons.registry();
reg.lookup('CQUniversity').name;        // "CQUniversity Australia"
reg.inGroup('go8');                     // [...9 institutions]
reg.byId['rmit-university'].aliases;    // ["Royal Melbourne Institute of Technology", "RMIT"]
```

## Notes

- Group memberships are **as at 2026** (ATN includes Newcastle & Deakin; IRU includes WSU;
  Adelaide University carries Go8 from the 2026 Adelaide/UniSA merger — both predecessors kept
  with `status: "merged"` + `successorId` because historical data still references them).
- SACRU is an international alliance; ACU is its Australian member.
- `commons.js` derives its base URL from its own `script.src`, so everything works from
  `localhost` during development too.
