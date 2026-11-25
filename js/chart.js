/**
 * Custom responsive SVG Radar Chart and Horizontal Comparison Bar Chart
 * comparing Current Skill Level vs Target Role Required Level (0-5).
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
    const cy = height / 2 + 6;
    const radius = 136;
    const maxVal = 5;

    function polarToCartesian(index, value) {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
      const r = (value / maxVal) * radius;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        angle,
      };
    }

    // Grid rings for levels 1..5
    const ringsHtml = [1, 2, 3, 4, 5]
      .map((lvl) => {
        const pts = roadmap
          .map((_, idx) => {
            const p = polarToCartesian(idx, lvl);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          })
          .join(" ");
        return `
          <polygon points="${pts}" class="radar-grid-ring" />
          <text x="${cx + 4}" y="${(cy - (lvl / maxVal) * radius + 3).toFixed(1)}" class="radar-ring-label">${lvl}</text>
        `;
      })
      .join("");

    // Radial axes + skill labels
    const axesHtml = roadmap
      .map((item, idx) => {
        const end = polarToCartesian(idx, maxVal);
        const labelPos = polarToCartesian(idx, maxVal + 1.15);
        const cos = Math.cos(end.angle);
        let anchor = "middle";
        if (cos > 0.25) anchor = "start";
        else if (cos < -0.25) anchor = "end";

        const labelText = item.completedViaCourses
          ? `${item.skillName} ✓`
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
        const p = polarToCartesian(idx, item.requiredLevel);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");

    const currentPoints = roadmap
      .map((item, idx) => {
        const p = polarToCartesian(idx, item.effectiveLevel);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");

    const nodesHtml = roadmap
      .map((item, idx) => {
        const reqP = polarToCartesian(idx, item.requiredLevel);
        const curP = polarToCartesian(idx, item.effectiveLevel);
        return `
          <circle
            cx="${reqP.x.toFixed(1)}"
            cy="${reqP.y.toFixed(1)}"
            r="4.2"
            class="radar-dot radar-dot-required"
          >
            <title>${escapeHtml(item.skillName)} — Required: ${item.requiredLevel}/5</title>
          </circle>
          <circle
            cx="${curP.x.toFixed(1)}"
            cy="${curP.y.toFixed(1)}"
            r="5.2"
            class="radar-dot radar-dot-current"
            data-skill-idx="${idx}"
          >
            <title>${escapeHtml(item.skillName)} — Current: ${item.effectiveLevel}/5 vs Required: ${item.requiredLevel}/5</title>
          </circle>
        `;
      })
      .join("");

    container.innerHTML = `
      <div class="radar-wrapper">
        <svg viewBox="0 0 ${width} ${height}" class="radar-svg" role="img" aria-label="Skill comparison radar chart showing current versus required levels">
          ${ringsHtml}
          ${axesHtml}
          <polygon points="${requiredPoints}" class="radar-area-required" />
          <polygon points="${currentPoints}" class="radar-area-current" />
          ${nodesHtml}
        </svg>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-swatch swatch-current"></span>
            Your Current Level
          </span>
          <span class="legend-item">
            <span class="legend-swatch swatch-required"></span>
            Target Role Required
          </span>
        </div>
        <div id="radar-hover-readout" class="radar-readout" aria-live="polite">
          Hover or tap any skill point to inspect exact gap numbers.
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
          item.gap === 0
            ? "Target met ✓"
            : `Gap: ${item.gap} level${item.gap === 1 ? "" : "s"}`;
        readout.textContent = `${item.skillName}: Current ${item.effectiveLevel}/5 vs Required ${item.requiredLevel}/5 · ${gapText}`;
      };
      dot.addEventListener("mouseenter", showDetails);
      dot.addEventListener("click", showDetails);
    });
  }

  function renderBarChart(container, roadmap) {
    const rowsHtml = roadmap
      .map((item) => {
        const curPct = (item.effectiveLevel / 5) * 100;
        const reqPct = (item.requiredLevel / 5) * 100;
        const nameLabel = item.completedViaCourses
          ? `${item.skillName} ✓`
          : item.skillName;

        return `
          <div class="bar-row">
            <div class="bar-row-meta">
              <span class="bar-skill-name">${escapeHtml(nameLabel)}</span>
              <span class="bar-skill-nums">${item.effectiveLevel}/5 <span class="muted">vs</span> ${item.requiredLevel}/5</span>
            </div>
            <div class="bar-track" aria-label="${escapeHtml(item.skillName)}: ${item.effectiveLevel} out of ${item.requiredLevel} required">
              <div class="bar-required-marker" style="left: ${reqPct}%" title="Required: ${item.requiredLevel}/5"></div>
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
            Your Current Level (bar)
          </span>
          <span class="legend-item">
            <span class="legend-swatch swatch-required"></span>
            Target Role Required (marker & outline)
          </span>
        </div>
      </div>
    `;
  }

  return {
    renderRadarChart,
    renderBarChart,
  };
})();
