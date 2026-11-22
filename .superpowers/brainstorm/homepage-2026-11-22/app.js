(() => {
  const pathInfo = {
    189: {
      title: "189 Independent",
      points: "70 points",
      detail: "70 met the cut-off in 2 of the last 6 rounds.",
      explanation: "A permanent visa without state or employer sponsorship.",
    },
    190: {
      title: "190 State nominated",
      points: "75 with nomination",
      detail: "Competitive in Victoria. Its rules are still being checked.",
      explanation:
        "A permanent visa with nomination from a state or territory.",
    },
    491: {
      title: "491 Regional pathway",
      points: "85 with nomination",
      detail:
        "Competitive in the Northern Territory. Rules are still being checked.",
      explanation:
        "A provisional regional visa with a potential pathway to permanent residency.",
    },
  };
  document.querySelectorAll("[data-path]").forEach((button) => {
    button.addEventListener("click", () => {
      const data = pathInfo[button.dataset.path];
      document
        .querySelectorAll("[data-path]")
        .forEach((other) =>
          other.setAttribute("aria-pressed", String(other === button)),
        );
      document.getElementById("path-title").textContent = data.title;
      document.getElementById("path-points").textContent = data.points;
      document.getElementById("path-detail").textContent = data.detail;
      document.getElementById("path-explanation").textContent =
        data.explanation;
      document.querySelector(".map-stage").dataset.route = button.dataset.path;
    });
  });

  const occupation = document.getElementById("occupation");
  const points = document.getElementById("points");
  const labels = {
    "very-strong": "Very strong",
    strong: "Strong",
    competitive: "Competitive",
    "long-wait": "Long wait",
    "not-invited": "Not currently invited",
  };
  const colours = {
    "very-strong": ["#0f6b3c", "#e1f1e8"],
    strong: ["#226b49", "#e5f3ea"],
    competitive: ["#97620a", "#fbf0d8"],
    "long-wait": ["#a64d2a", "#f9eae2"],
    "not-invited": ["#ab3a38", "#fae9e7"],
  };
  const names = {
    254499: "registered-nurses-nec-254499",
    261313: "software-engineer-261313",
    241111: "early-childhood-pre-primary-school-teacher-241111",
  };
  const chart = document.getElementById("cutoff-chart");
  const ns = "http://www.w3.org/2000/svg";
  function svgNode(tag, attrs, text) {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) =>
      el.setAttribute(key, String(value)),
    );
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function drawChart(rounds, score, name) {
    chart.replaceChildren();
    chart.append(
      svgNode(
        "title",
        { id: "chart-description" },
        `${name}: six published 189 rounds compared with ${score} points. Missing cut-offs mean the occupation was not listed.`,
      ),
    );
    const bottom = 120,
      top = 9;
    const fontScale = Math.max(1, 520 / chart.clientWidth);
    const y = (n) => bottom - ((n - 55) / 50) * (bottom - top);
    chart.append(
      svgNode("line", {
        x1: 0,
        y1: bottom,
        x2: 520,
        y2: bottom,
        stroke: "#dce4ed",
        "stroke-width": 1,
      }),
    );
    rounds.forEach((round, i) => {
      const x = 17 + i * 76,
        width = 42;
      if (round.cutoff !== null) {
        const reached = score >= round.cutoff;
        chart.append(
          svgNode("rect", {
            x,
            y: y(round.cutoff),
            width,
            height: bottom - y(round.cutoff),
            rx: 4,
            fill: reached ? "#3159d9" : "#e8edf4",
          }),
        );
        chart.append(
          svgNode(
            "text",
            {
              x: x + width / 2,
              y: y(round.cutoff) - 8,
              "text-anchor": "middle",
              "font-size": 13 * fontScale,
              fill: "#536578",
            },
            round.cutoff,
          ),
        );
      } else {
        chart.append(
          svgNode("rect", {
            x,
            y: bottom - 28,
            width,
            height: 28,
            rx: 4,
            fill: "none",
            stroke: "#cbd5e1",
            "stroke-dasharray": "3 3",
          }),
        );
        chart.append(
          svgNode(
            "text",
            {
              x: x + width / 2,
              y: bottom - 39,
              "text-anchor": "middle",
              "font-size": 12 * fontScale,
              fill: "#536578",
            },
            "—",
          ),
        );
      }
      chart.append(
        svgNode(
          "text",
          {
            x: x + width / 2,
            y: 145,
            "text-anchor": "middle",
            "font-size": 12 * fontScale,
            fill: "#536578",
          },
          round.month,
        ),
      );
    });
    chart.append(
      svgNode("line", {
        x1: 0,
        y1: y(score),
        x2: 520,
        y2: y(score),
        stroke: "#97620a",
        "stroke-width": 1,
        "stroke-dasharray": "4 4",
      }),
    );
    chart.append(
      svgNode("rect", {
        x: 440,
        y: y(score) - 13 * fontScale,
        width: 80,
        height: 24 * fontScale,
        rx: 5,
        fill: "#fbf0d8",
      }),
    );
    chart.append(
      svgNode(
        "text",
        {
          x: 480,
          y: y(score) + 4 * fontScale,
          "text-anchor": "middle",
          "font-size": 12 * fontScale,
          fill: "#97620a",
        },
        `You, ${score}`,
      ),
    );
  }
  function update() {
    const data = window.DEMO_DATA[occupation.value];
    const score = Number(points.value);
    const result = data.points[score];
    const [ink, tint] = colours[result.label];
    document
      .getElementById("points-output")
      .replaceChildren(
        document.createTextNode(`${score} `),
        Object.assign(document.createElement("small"), {
          textContent: "points",
        }),
      );
    points.style.setProperty("--progress", `${((score - 65) / 25) * 100}%`);
    const panel = document.querySelector(".live-outlook");
    panel.style.setProperty("--result-ink", ink);
    panel.style.setProperty("--result-bg", tint);
    document.getElementById("live-label").textContent = labels[result.label];
    document.getElementById("live-explanation").textContent = result.why;
    document.getElementById("higher").textContent = result.higher.replace(
      " (so may be zero)",
      "",
    );
    document.getElementById("same").textContent = result.same.replace(
      " (so may be zero)",
      "",
    );
    document.getElementById("chart-name").textContent = data.shortName;
    document.getElementById("occupation-link").href =
      `http://127.0.0.1:3000/occupations/${names[occupation.value]}/`;
    drawChart(data.rounds, score, data.name);
    panel.classList.remove("is-changing");
    requestAnimationFrame(() => panel.classList.add("is-changing"));
  }
  occupation.addEventListener("change", update);
  points.addEventListener("input", update);
  update();
  window.addEventListener("resize", () => {
    const data = window.DEMO_DATA[occupation.value];
    drawChart(data.rounds, Number(points.value), data.name);
  });

  const paper = document.getElementById("paper-content");
  const firstPaper = paper.innerHTML;
  const paperViews = {
    outlook: firstPaper,
    improve: `<p class="paper-person">Priya’s points, explored</p><h3>A change you can<br /> see clearly.</h3><p class="paper-fact">The report calculates what each improvement would change in your outlook.</p><div class="paper-feature"><small>Superior English, in this example</small><strong>70 → 80 points</strong><small>189: Competitive → Very strong</small></div><div class="paper-gain"><span>Your dates matter, too.</span><strong>33 years old → −5 points</strong><small>March 2027, for this fictional profile</small></div>`,
    evidence: `<p class="paper-person">The story behind the outlook</p><h3>Not just a label.<br /> The reasons, too.</h3><p class="paper-fact">Open the evidence when you want to look closer.</p><div class="paper-source-list"><div><b>Invitation cut-offs</b>The occupation’s last six 189 rounds.</div><div><b>Where your points sit</b>Higher-scoring and same-score EOIs.</div><div><b>State nomination</b>Published evidence and verified requirements.</div></div><div class="paper-gain"><span>Source</span><small>SkillSelect, snapshot 31 October 2026.</small></div>`,
  };
  document.querySelectorAll("[data-report]").forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll("[data-report]")
        .forEach((other) =>
          other.setAttribute("aria-pressed", String(other === button)),
        );
      paper.innerHTML = paperViews[button.dataset.report];
      document.querySelector(".paper").classList.remove("is-changing");
      requestAnimationFrame(() =>
        document.querySelector(".paper").classList.add("is-changing"),
      );
    });
  });
})();
