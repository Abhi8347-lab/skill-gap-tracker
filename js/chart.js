/**
 * Hand-made inline SVG charts (zero external libraries):
 * - Skill Gap Radar Chart & Bar Chart (Current/Verified % vs Target %)
 * - Dashboard Level Distribution Bar Chart
 * - Dashboard Completion by Employee Bar Chart
 * - Employee Score Trend Line Chart
 */
window.SkillPathChart = (function () {
  const { escapeHtml } = window.SkillPathNav;

  function renderRadarChart(container, roadmap) {
    const count = roadmap.length;
    if (count < 3) {
      renderBarChart(container, roadmap);
      return;
    }

    const width = 580;
    const height = 430;
    const cx = width / 2;
    const cy = height / 2 + 8;
    const radius = 134;
    const maxVal = 100;

    function polarToCartesian(index, value) {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
      const r = (value / maxVal) * radius;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        angle,
      };
    }

    const ringsHtml = [20, 40, 60, 80, 100]
      .map((pct) => {
        const pts = roadmap
          .map((_, idx) => {
            const p = polarToCartesian(idx, pct);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          })
          .join(" ");
        return `
          <polygon points="${pts}" class="radar-grid-ring" />
          <text x="${cx + 4}" y="${(cy - (pct / maxVal) * radius + 3).toFixed(1)}" class="radar-ring-label">${pct}%</text>
        `;
      })
      .join("");

    const axesHtml = roadmap
      .map((item, idx) => {
        const end = polarToCartesian(idx, maxVal);
        const labelPos = polarToCartesian(idx, maxVal + 23);
        const cos = Math.cos(end.angle);
        let anchor = "middle";
        if (cos > 0.25) anchor = "start";
        else if (cos < -0.25) anchor = "end";

        const labelText = item.completedViaCourses
          ? `${item.skillName} ✓`
          : item.isVerified
            ? `${item.skillName} ★`
            : item.skillName;

        return `
          <line x1="${cx}" y1="${cy}" x2="${end.x.toFixed(1)}" y2="${end.y.toFixed(1)}" class="radar-axis" />
          <text
            x="${labelPos.x.toFixed(1)}"
            y="${(labelPos.y + 4).toFixed(1)}"
            text-anchor="${anchor}"
            class="radar-axis-label ${item.status === "strong" ? "is-strong" : item.status === "missing" ? "is-missing" : ""}"
          >${escapeHtml(labelText)}</text>
        `;
      })
      .join("");

    const requiredPoints = roadmap
      .map((item, idx) => {
        const p = polarToCartesian(idx, item.requiredPct);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");

    const currentPoints = roadmap
      .map((item, idx) => {
        const p = polarToCartesian(idx, item.effectivePct);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");

    const nodesHtml = roadmap
      .map((item, idx) => {
        const reqP = polarToCartesian(idx, item.requiredPct);
        const curP = polarToCartesian(idx, item.effectivePct);
        const srcTag = item.isVerified
          ? `Verified ${item.verifiedLevel} (${item.effectivePct}%)`
          : `${item.effectivePct}% (Unverified)`;
        return `
          <circle
            cx="${reqP.x.toFixed(1)}"
            cy="${reqP.y.toFixed(1)}"
            r="4.2"
            class="radar-dot radar-dot-required"
          >
            <title>${escapeHtml(item.skillName)} — Target: ${item.requiredPct}%</title>
          </circle>
          <circle
            cx="${curP.x.toFixed(1)}"
            cy="${curP.y.toFixed(1)}"
            r="5.5"
            class="radar-dot radar-dot-current"
            data-skill-idx="${idx}"
          >
            <title>${escapeHtml(item.skillName)} — ${escapeHtml(srcTag)} vs Target: ${item.requiredPct}%</title>
          </circle>
        `;
      })
      .join("");

    container.innerHTML = `
      <div class="radar-wrapper">
        <svg viewBox="0 0 ${width} ${height}" class="radar-svg" role="img" aria-label="Skill comparison radar chart showing current versus target percentages">
          ${ringsHtml}
          ${axesHtml}
          <polygon points="${requiredPoints}" class="radar-area-required" />
          <polygon points="${currentPoints}" class="radar-area-current" />
          ${nodesHtml}
        </svg>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-swatch swatch-current"></span>
            Verified / Current Score (%)
          </span>
          <span class="legend-item">
            <span class="legend-swatch swatch-required"></span>
            Target Score (%)
          </span>
        </div>
        <div id="radar-hover-readout" class="radar-readout" aria-live="polite">
          Hover or tap any skill point to inspect verified vs. target score.
        </div>
      </div>
    `;

    const readout = container.querySelector("#radar-hover-readout");
    container.querySelectorAll(".radar-dot-current").forEach((dot) => {
      const idx = Number(dot.getAttribute("data-skill-idx"));
      const item = roadmap[idx];
      if (!item || !readout) return;
      const showDetails = () => {
        const gapText =
          item.gapPct === 0 ? "Target met ✓" : `Gap: ${item.gapPct}%`;
        const verTag = item.isVerified
          ? `Verified ${item.verifiedLevel}`
          : "Unverified";
        readout.textContent = `${item.skillName} (${verTag}): ${item.effectivePct}% vs Target ${item.requiredPct}% · ${gapText}`;
      };
      dot.addEventListener("mouseenter", showDetails);
      dot.addEventListener("click", showDetails);
    });
  }

  function renderBarChart(container, roadmap) {
    const rowsHtml = roadmap
      .map((item) => {
        const curPct = Math.min(100, item.effectivePct);
        const reqPct = Math.min(100, item.requiredPct);
        const nameLabel = item.completedViaCourses
          ? `${item.skillName} ✓`
          : item.skillName;

        const gapNote =
          item.gapPct > 0
            ? `<span class="bar-gap-tag">-${item.gapPct}% gap</span>`
            : `<span class="bar-ok-tag">Target met ✓</span>`;

        const verPill = item.isVerified
          ? `<span class="ver-mini-pill level-${item.verifiedLevel.toLowerCase()}">${escapeHtml(item.verifiedLevel)}</span>`
          : `<span class="ver-mini-pill level-unverified">Unverified</span>`;

        return `
          <div class="bar-row">
            <div class="bar-row-meta">
              <span class="bar-skill-name">${escapeHtml(nameLabel)} ${verPill}</span>
              <span class="bar-skill-nums">
                <strong>${item.effectivePct}%</strong>
                <span class="muted">vs</span>
                ${item.requiredPct}% target
                ${gapNote}
              </span>
            </div>
            <div class="bar-track" aria-label="${escapeHtml(item.skillName)}: ${item.effectivePct}% versus ${item.requiredPct}% target">
              <div class="bar-required-marker" style="left: ${reqPct}%" title="Target: ${item.requiredPct}%"></div>
              <div class="bar-required-fill" style="width: ${reqPct}%"></div>
              <div class="bar-current-fill status-${item.status}" style="width: ${curPct}%"></div>
            </div>
          </div>
        `;
      })
      .join("");

    container.innerHTML = `
      <div class="barchart-wrapper">
        ${rowsHtml}
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-swatch swatch-current"></span>
            Verified / Current Score (%)
          </span>
          <span class="legend-item">
            <span class="legend-swatch swatch-required"></span>
            Target Score (%)
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Inline SVG Bar Chart of verified skill level counts (Beginner / Intermediate / Expert / Unverified).
   */
  function renderLevelDistributionBarChart(container, counts) {
    const items = [
      { label: "Expert", value: Number(counts.Expert || 0), color: "#10b981" },
      {
        label: "Intermediate",
        value: Number(counts.Intermediate || 0),
        color: "#4f46e5",
      },
      {
        label: "Beginner",
        value: Number(counts.Beginner || 0),
        color: "#f59e0b",
      },
      {
        label: "Unverified",
        value: Number(counts.Unverified || 0),
        color: "#94a3b8",
      },
    ];

    const width = 460;
    const height = 220;
    const maxVal = Math.max(1, ...items.map((i) => i.value));
    const chartTop = 24;
    const chartBottom = 175;
    const chartHeight = chartBottom - chartTop;
    const barWidth = 64;
    const gap = 36;
    const startX = 48;

    const gridHtml = [0, 0.5, 1]
      .map((ratio) => {
        const y = chartBottom - ratio * chartHeight;
        const val = Math.round(ratio * maxVal);
        return `
          <line x1="34" y1="${y.toFixed(1)}" x2="${width - 16}" y2="${y.toFixed(1)}" class="svg-grid-line" />
          <text x="28" y="${(y + 4).toFixed(1)}" text-anchor="end" class="svg-axis-text">${val}</text>
        `;
      })
      .join("");

    const barsHtml = items
      .map((item, idx) => {
        const h = (item.value / maxVal) * chartHeight;
        const x = startX + idx * (barWidth + gap);
        const y = chartBottom - h;
        return `
          <g>
            <rect
              x="${x}"
              y="${y.toFixed(1)}"
              width="${barWidth}"
              height="${Math.max(2, h).toFixed(1)}"
              rx="8"
              fill="${item.color}"
            >
              <title>${item.label}: ${item.value} skills</title>
            </rect>
            <text x="${x + barWidth / 2}" y="${(y - 7).toFixed(1)}" text-anchor="middle" class="svg-value-text">${item.value}</text>
            <text x="${x + barWidth / 2}" y="${chartBottom + 18}" text-anchor="middle" class="svg-label-text">${item.label}</text>
          </g>
        `;
      })
      .join("");

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="dash-svg-chart" role="img" aria-label="Verified skill level distribution bar chart">
        ${gridHtml}
        ${barsHtml}
      </svg>
    `;
  }

  /**
   * Inline SVG Horizontal Bar Chart showing course completion % per employee.
   */
  function renderEmployeeCompletionBarChart(container, employees) {
    const rows = employees.slice(0, 10);
    const rowHeight = 28;
    const width = 500;
    const height = Math.max(120, rows.length * rowHeight + 28);
    const labelWidth = 148;
    const barMaxWidth = 280;

    const barsHtml = rows
      .map((emp, idx) => {
        const y = 16 + idx * rowHeight;
        const barW = Math.max(4, (emp.completionPct / 100) * barMaxWidth);
        const fill =
          emp.status === "On track"
            ? "#10b981"
            : emp.status === "Behind"
              ? "#f59e0b"
              : "#f43f5e";
        const shortName =
          emp.displayName.length > 18
            ? `${emp.displayName.slice(0, 17)}…`
            : emp.displayName;

        return `
          <g>
            <text x="${labelWidth - 10}" y="${y + 13}" text-anchor="end" class="svg-label-text">${escapeHtml(shortName)}</text>
            <rect x="${labelWidth}" y="${y + 2}" width="${barMaxWidth}" height="14" rx="7" class="svg-bar-track" />
            <rect x="${labelWidth}" y="${y + 2}" width="${barW.toFixed(1)}" height="14" rx="7" fill="${fill}">
              <title>${escapeHtml(emp.displayName)}: ${emp.completionPct}% (${emp.status})</title>
            </rect>
            <text x="${labelWidth + barMaxWidth + 10}" y="${y + 13}" class="svg-value-text">${emp.completionPct}%</text>
          </g>
        `;
      })
      .join("");

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="dash-svg-chart" role="img" aria-label="Course completion percentage by employee">
        ${barsHtml}
      </svg>
    `;
  }

  /**
   * Inline SVG Line Chart plotting diagnostic test score trend across attempts.
   */
  function renderScoreTrendLineChart(container, flatAttempts) {
    if (!flatAttempts || flatAttempts.length === 0) {
      container.innerHTML = `<div class="chart-empty-note">No diagnostic test attempts recorded yet for this employee.</div>`;
      return;
    }

    const sorted = flatAttempts
      .slice()
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));

    const width = 460;
    const height = 190;
    const padLeft = 42;
    const padRight = 24;
    const padTop = 22;
    const padBottom = 34;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const points = sorted.map((att, idx) => {
      const pct = Math.round((Number(att.score || 0) / 5) * 100);
      const x =
        sorted.length === 1
          ? padLeft + plotW / 2
          : padLeft + (idx / (sorted.length - 1)) * plotW;
      const y = padTop + (1 - pct / 100) * plotH;
      return { x, y, pct, att };
    });

    const gridHtml = [0, 50, 100]
      .map((val) => {
        const y = padTop + (1 - val / 100) * plotH;
        return `
          <line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}" class="svg-grid-line" />
          <text x="${padLeft - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="svg-axis-text">${val}%</text>
        `;
      })
      .join("");

    const polyPoints = points
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");

    const dotsHtml = points
      .map((p) => {
        const shortDate = String(p.att.date || "").slice(5, 10);
        return `
          <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="#4f46e5" stroke="#ffffff" stroke-width="2">
            <title>${escapeHtml(p.att.skillName || p.att.skillId)}: ${p.att.score}/5 (${p.att.level}) on ${escapeHtml(String(p.att.date || "").slice(0, 10))}</title>
          </circle>
          <text x="${p.x.toFixed(1)}" y="${(p.y - 9).toFixed(1)}" text-anchor="middle" class="svg-value-text">${p.pct}%</text>
          <text x="${p.x.toFixed(1)}" y="${height - 10}" text-anchor="middle" class="svg-axis-text">${escapeHtml(shortDate)}</text>
        `;
      })
      .join("");

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="dash-svg-chart" role="img" aria-label="Diagnostic score trend line chart">
        ${gridHtml}
        ${points.length > 1 ? `<polyline points="${polyPoints}" fill="none" stroke="#4f46e5" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />` : ""}
        ${dotsHtml}
      </svg>
    `;
  }

  return {
    renderRadarChart,
    renderBarChart,
    renderLevelDistributionBarChart,
    renderEmployeeCompletionBarChart,
    renderScoreTrendLineChart,
  };
})();
