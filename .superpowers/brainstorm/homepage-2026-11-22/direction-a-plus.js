(() => {
  const names = {
    WA: "Western Australia",
    NT: "Northern Territory",
    SA: "South Australia",
    QLD: "Queensland",
    NSW: "New South Wales",
    VIC: "Victoria",
    TAS: "Tasmania",
    ACT: "Australian Capital Territory",
  };
  const order = Object.keys(names);
  const key = {
    "very-strong": "vs",
    strong: "st",
    competitive: "co",
    "long-wait": "lw",
    "not-invited": "ni",
    "not-eligible": "ne",
    "no-data": "nd",
  };
  const map = document.getElementById("state-map");
  let selected = "NSW",
    visa = "190",
    zoom = 1;
  const allMonths = [
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09",
    "2026-10",
  ];
  const monthName = (value) =>
    new Intl.DateTimeFormat("en-GB", {
      month: "short",
      timeZone: "UTC",
    }).format(new Date(value + "-01"));
  const picker = document.querySelector(".state-picker");
  order.forEach((state) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = state;
    button.dataset.atlasState = state;
    button.setAttribute("aria-label", names[state]);
    button.setAttribute("aria-pressed", String(state === selected));
    picker.append(button);
  });
  function animateStamp() {
    fitStamps(document.getElementById("tryStamp"));
    if (!reduceMotion)
      document.querySelector("#tryStamp svg")?.classList.add("thump");
  }
  function renderMonths(data) {
    const root = document.getElementById("state-months");
    root.replaceChildren();
    root.setAttribute("role", "list");
    const max = Math.max(1, ...data.monthly.map((m) => m.max));
    allMonths.forEach((month) => {
      const row = data.monthly.find((m) => m.month === month);
      const cell = document.createElement("div");
      cell.className = "month-cell";
      cell.setAttribute("role", "listitem");
      cell.setAttribute(
        "aria-label",
        monthName(month) + ": " + (row ? row.count : "not published"),
      );
      const count = document.createElement("span");
      count.className = "month-number";
      count.textContent = row
        ? row.count.replace(/^under\s+(\d+)$/i, "<$1")
        : "—";
      const bar = document.createElement("span");
      bar.className =
        "month-bar" +
        (!row ? " missing" : row.min !== row.max ? " masked" : "");
      bar.setAttribute("aria-hidden", "true");
      bar.style.height = row
        ? Math.max(3, (48 * row.max) / max) + "px"
        : "12px";
      const label = document.createElement("span");
      label.className = "month-name";
      label.textContent = monthName(month);
      cell.append(count, bar, label);
      root.append(cell);
    });
  }
  function render() {
    const code = document.getElementById("tryForm").elements.occ.value;
    const points = Number(
      document.getElementById("tryForm").elements.pts.value,
    );
    const total = points + (visa === "190" ? 5 : visa === "491" ? 15 : 0);
    document
      .querySelectorAll("[data-atlas-state]")
      .forEach((el) =>
        el.setAttribute(
          "aria-pressed",
          String(visa !== "189" && el.dataset.atlasState === selected),
        ),
      );
    document
      .querySelectorAll("[data-atlas-visa]")
      .forEach((el) =>
        el.setAttribute("aria-pressed", String(el.dataset.atlasVisa === visa)),
      );
    const stamp = document.getElementById("tryStamp");
    const why = document.getElementById("tryWhy"),
      count = document.getElementById("tryCount");
    count.hidden = false;
    const data =
      window.STATE_EVIDENCE[code][points][visa === "189" ? "190" : visa][
        selected
      ];
    const caveat = document.getElementById("atlas-caveat");
    document.getElementById("atlas-total").innerHTML =
      total +
      ` <small>${points}${visa === "189" ? " base" : " + " + (visa === "190" ? 5 : 15)}</small>`;
    document.querySelector(".monthly-evidence").hidden = visa === "189";
    if (visa === "189") {
      const r = outlook(code, points);
      document.getElementById("atlas-state-name").textContent =
        "Australia-wide";
      document.getElementById("atlas-visa-name").textContent =
        "189 · Independent";
      document.getElementById("atlas-state-code").textContent = "AU";
      document.getElementById("latest-heading").textContent =
        "Your score in the national 189 pool";
      document.getElementById("atlas-count").textContent = window.DEMO_DATA[
        code
      ].points[points].higher.replace(" (so may be zero)", "");
      document.getElementById("atlas-month").textContent =
        "EOIs with a higher score";
      stamp.innerHTML = bigStamp(
        r.k,
        "SUBCLASS 189",
        `OCT 2026 • ${points} POINTS`,
      );
      why.textContent = r.why;
      count.textContent =
        window.DEMO_DATA[code].points[points].same + " EOIs are at this score.";
      caveat.textContent =
        "189 is a national pathway. Select a state on the map to explore its 190 nomination evidence. Meeting a cut-off does not guarantee an invitation.";
    } else {
      document.getElementById("atlas-state-name").textContent = names[selected];
      document.getElementById("atlas-visa-name").textContent =
        visa === "190" ? "190 · State nominated" : "491 · Provisional regional";
      document.getElementById("atlas-state-code").textContent = selected;
      const k = key[data.label] || "nd";
      stamp.innerHTML = visaStamp(
        visa === "190" ? "hex" : "oval",
        k,
        visa + " " + selected,
        V[k].label,
        total + " PTS",
        -4,
      );
      document.getElementById("latest-heading").textContent =
        "Latest published count at or below " + total + " points";
      document.getElementById("atlas-count").textContent = data.latest
        ? data.latest.count
        : "No confirmed count";
      document.getElementById("atlas-month").textContent = data.latest
        ? monthName(data.latest.month) + " 2026"
        : "May–Oct 2026";
      renderMonths(data);
      why.textContent =
        data.missing.length === 6
          ? "No monthly state evidence is published in this snapshot window."
          : "The stamp summarises published invitation evidence at your points. Patterned bars show ranges; their height marks the upper bound.";
      count.textContent = "";
      count.hidden = true;
      caveat.textContent =
        "Historical evidence, not eligibility. Your full report checks state rules and your answers separately." +
        (visa === "491"
          ? " The 491 is provisional; regional location requirements also apply."
          : "");
    }
    animateStamp();
  }
  function choose(state) {
    selected = state;
    if (visa === "189") visa = "190";
    render();
  }
  document.querySelectorAll("[data-atlas-state]").forEach((el) => {
    el.addEventListener("click", () => choose(el.dataset.atlasState));
    if (el.tagName.toLowerCase() === "g")
      el.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          choose(el.dataset.atlasState);
        }
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          const at = order.indexOf(el.dataset.atlasState),
            next = order[(at + (event.key === "ArrowRight" ? 1 : 7)) % 8];
          map.querySelector('[data-atlas-state="' + next + '"]').focus();
        }
      });
  });
  document.querySelectorAll("[data-atlas-visa]").forEach((el) =>
    el.addEventListener("click", () => {
      visa = el.dataset.atlasVisa;
      render();
    }),
  );
  function applyZoom() {
    const width = 760 / zoom,
      height = 600 / zoom;
    map.setAttribute(
      "viewBox",
      `${(760 - width) / 2} ${(600 - height) / 2} ${width} ${height}`,
    );
    document.getElementById("zoomOut").disabled = zoom <= 1;
    document.getElementById("zoomIn").disabled = zoom >= 2;
    document.getElementById("zoomReset").disabled = zoom === 1;
  }
  document.getElementById("zoomIn").addEventListener("click", () => {
    zoom = Math.min(2, zoom + 0.25);
    applyZoom();
  });
  document.getElementById("zoomOut").addEventListener("click", () => {
    zoom = Math.max(1, zoom - 0.25);
    applyZoom();
  });
  document.getElementById("zoomReset").addEventListener("click", () => {
    zoom = 1;
    applyZoom();
  });
  document.getElementById("tryForm").addEventListener("change", render);
  document.querySelector(".atlas-passport").setAttribute("aria-live", "polite");
  applyZoom();
  render();
  document.fonts.ready.then(() => fitStamps());
})();
