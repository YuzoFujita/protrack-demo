// ===========================
// extract.js - データ抽出ページ
// ===========================

let extractData = [];

window.onload = function () {
  loadData();
  renderTable();
  renderCountChart();
};

// ===========================
// データ読み込み
// ===========================
function loadData() {
  const stored = localStorage.getItem("extractData");
  if (stored) {
    extractData = JSON.parse(stored);
  } else {
    extractData = [];
  }
}

// ===========================
// リスト描画
// ===========================
function renderTable() {
  const tbody = document.getElementById("extractTableBody");
  tbody.innerHTML = "";

  if (extractData.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="19" class="no-data">表示するデータがありません。案件一覧からデータを抽出してください。</td>`;
    tbody.appendChild(tr);
    return;
  }

  extractData.forEach((item) => {
    const tr = document.createElement("tr");
    const statusInfo = STATUS_COLOR[item.status] || {
      color: "#ccc",
      label: "",
    };
    tr.innerHTML = `
      <td>${item.managementNo || ""}</td>
      <td>${item.type || ""}</td>
      <td>${item.product || ""}</td>
      <td>${item.newRepeat || ""}</td>
      <td>${item.standard || ""}</td>
      <td>${item.partNo || ""}</td>
      <td>${item.qty || ""}</td>
      <td>${item.client || ""}</td>
      <td>${item.requester || ""}</td>
      <td>${item.designer || ""}</td>
      <td>${item.mfgContact || ""}</td>
      <td>${item.mfgAnswer || ""}</td>
      <td>
        ${item.status || ""}
        <span class="status-dot" style="background-color:${statusInfo.color}" title="${statusInfo.label}"></span>
      </td>
      <td>${item.dueDate || ""}</td>
      <td>${item.supplier || ""}</td>
      <td>${item.supplierDueDate || ""}</td>
      <td>${item.memo || ""}</td>
      <td>${item.updatedAt || ""}</td>
      <td>${item.updatedBy || ""}</td>
    `;
    // キャンセル行にクラスを付与
    if (item.status === "キャンセル") {
      tr.classList.add("cancelled");
    }
    tbody.appendChild(tr);
  });
}

// ===========================
// グラフ切替
// ===========================
let currentGraph = "count";
let countChartInstance = null;
let mfgtimeChartInstance = null;
let ganttChartInstance = null;

function switchGraph(type) {
  currentGraph = type;

  document
    .querySelectorAll(".graph-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById("btn-" + type).classList.add("active");

  document.getElementById("chart-count").style.display =
    type === "count" ? "block" : "none";
  document.getElementById("chart-mfgtime").style.display =
    type === "mfgtime" ? "block" : "none";
  document.getElementById("chart-gantt").style.display =
    type === "gantt" ? "block" : "none";

  if (type === "count" && !countChartInstance) renderCountChart();
  if (type === "mfgtime" && !mfgtimeChartInstance) renderMfgtimeChart();
  if (type === "gantt" && !ganttChartInstance) renderGanttChart();
}

// ===========================
// 月リスト生成（納期ベース）
// ===========================
function getMonthRange() {
  if (extractData.length === 0) return [];

  const dates = extractData
    .map((d) => new Date(d.dueDate))
    .filter((d) => !isNaN(d));

  if (dates.length === 0) return [];

  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  const months = [];
  const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  while (cur <= end) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() + 1 });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

function monthLabel(m, i, months) {
  const isFirst = i === 0;
  const isNewYear = m.month === 1;
  return isFirst || isNewYear ? `${m.year}/${m.month}月` : `${m.month}月`;
}

// ===========================
// グラフ1：個数
// ===========================
function renderCountChart() {
  const months = getMonthRange();

  if (months.length === 0) {
    document.getElementById("chart-count").innerHTML =
      `<div class="no-data">データがありません</div>`;
    return;
  }

  const labels = months.map((m, i) => monthLabel(m, i, months));
  const year = months[0].year;

  const countByMonth = (type) =>
    months.map((m) =>
      extractData
        .filter((d) => {
          const date = new Date(d.dueDate);
          return (
            date.getFullYear() === m.year &&
            date.getMonth() + 1 === m.month &&
            d.type === type
          );
        })
        .reduce((sum, d) => sum + (parseInt(d.qty) || 0), 0),
    );

  if (countChartInstance) countChartInstance.destroy();

  const ctx = document.getElementById("countChart").getContext("2d");
  Chart.register(ChartDataLabels);
  countChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "試作",
          data: countByMonth("試作"),
          backgroundColor: "#4472C4",
          maxBarThickness: 80,
        },
        {
          label: "量産",
          data: countByMonth("量産"),
          backgroundColor: "#70AD47",
          maxBarThickness: 80,
        },
        {
          label: "トライ",
          data: countByMonth("トライ"),
          backgroundColor: "#FFC000",
          maxBarThickness: 80,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        datalabels: {
          display: (ctx) => {
            // 一番上のデータセット（トライ）のみ合計値を表示
            return ctx.datasetIndex === 2;
          },
          anchor: "end",
          align: "end",
          formatter: (value, ctx) => {
            // 3つのデータセットの合計を計算
            const datasets = ctx.chart.data.datasets;
            const total = datasets.reduce((sum, ds) => {
              return sum + (ds.data[ctx.dataIndex] || 0);
            }, 0);
            return total > 0 ? total : "";
          },
          font: { size: 12, weight: "bold" },
          color: "#333",
        },
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          title: { display: true, text: "個数, 個" },
          beginAtZero: true,
          grace: "10%",
        },
      },
    },
  });
}

// ===========================
// グラフ2：製造時間と必要人員
// ===========================
function calcMfgTime(item) {
  const master = PROCESS_MASTER[item.product];
  if (!master) return { production: 0, setup: 0 };

  const usedProcessNames = master.mfgTypes[item.mfgType] || [];
  const qty = parseInt(item.qty) || 0;

  let totalProduction = 0;
  let totalSetup = 0;

  usedProcessNames.forEach((pName) => {
    const process = master.processes.find((p) => p.name === pName);
    if (!process) return;
    const productionQty = qty / (1 - process.defectRate / 100);
    totalProduction += (productionQty * process.mct) / 3600;
    totalSetup += process.setupTime;
  });

  return { production: totalProduction, setup: totalSetup };
}

function calcNetWorkHours(product) {
  const master = PROCESS_MASTER[product];
  if (!master) return 6.5;
  const w = master.workHours;
  const excludeTotal =
    w.excludeMorning +
    w.exclude2s +
    w.excludeSafety +
    w.excludeQC +
    w.excludeVacation;
  return w.dailyHours - excludeTotal / 60;
}

function getWorkdaysInMonth(year, month) {
  const holidayData = typeof HOLIDAY_DATA !== "undefined" ? HOLIDAY_DATA : {};
  const yearData = holidayData[year] || { holidays: [], workdays: [] };

  let count = 0;
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = yearData.holidays.includes(dateStr);
    const isExtraWorkday = yearData.workdays.includes(dateStr);

    if (isExtraWorkday) count++;
    else if (!isWeekend && !isHoliday) count++;
  }
  return count;
}

function renderMfgtimeChart() {
  const months = getMonthRange();

  if (months.length === 0) {
    document.getElementById("chart-mfgtime").innerHTML =
      `<div class="no-data">データがありません</div>`;
    return;
  }

  const labels = months.map((m, i) => monthLabel(m, i, months));
  const year = months[0].year;

  const productionByMonth = months.map((m) =>
    extractData
      .filter((d) => {
        const date = new Date(d.dueDate);
        return date.getFullYear() === m.year && date.getMonth() + 1 === m.month;
      })
      .reduce((sum, d) => sum + calcMfgTime(d).production, 0),
  );

  const setupByMonth = months.map((m) =>
    extractData
      .filter((d) => {
        const date = new Date(d.dueDate);
        return date.getFullYear() === m.year && date.getMonth() + 1 === m.month;
      })
      .reduce((sum, d) => sum + calcMfgTime(d).setup, 0),
  );

  const requiredPeople = months.map((m, i) => {
    const totalTime = productionByMonth[i] + setupByMonth[i];
    const workdays = getWorkdaysInMonth(m.year, m.month);
    const netHours = calcNetWorkHours("ブシュ");
    if (workdays === 0 || netHours === 0) return 0;
    return Math.round((totalTime / (netHours * workdays)) * 10) / 10;
  });

  if (mfgtimeChartInstance) mfgtimeChartInstance.destroy();

  const ctx = document.getElementById("mfgtimeChart").getContext("2d");
  mfgtimeChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "生産時間",
          data: productionByMonth.map((v) => Math.round(v * 10) / 10),
          backgroundColor: "#4472C4",
          yAxisID: "y",
          order: 1,
          pointStyle: "rect",
          maxBarThickness: 80,
        },
        {
          label: "段替時間",
          data: setupByMonth.map((v) => Math.round(v * 10) / 10),
          backgroundColor: "#A9A9A9",
          yAxisID: "y",
          order: 1,
          pointStyle: "rect",
          maxBarThickness: 80,
        },
        {
          label: "必要人員",
          data: requiredPeople,
          type: "line",
          borderColor: "#FF0000",
          backgroundColor: "#FF0000",
          pointBackgroundColor: "#FF0000",
          pointRadius: 6,
          yAxisID: "y2",
          tension: 0,
          order: 0,
          pointStyle: "circle",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            sort: (a, b) => {
              const order = ["生産時間", "段替時間", "必要人員"];
              return order.indexOf(a.text) - order.indexOf(b.text);
            },
          },
        },
        datalabels: {
          display: false,
        },
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          title: { display: true, text: "時間, h" },
          beginAtZero: true,
          position: "left",
          grace: "10%",
        },
        y2: {
          title: { display: true, text: "人員, 人" },
          beginAtZero: true,
          position: "right",
          grid: { drawOnChartArea: false },
          grace: "10%",
        },
      },
    },
  });
}

// ===========================
// グラフ3：仮)製造期間（ガントチャート）
// ===========================
function renderGanttChart() {
  const validData = extractData.filter(
    (d) => d.mfgPeriod && d.mfgPeriod.includes("〜"),
  );

  if (validData.length === 0) {
    document.getElementById("chart-gantt").innerHTML =
      `<div class="no-data">データがありません</div>`;
    return;
  }

  const parsePeriod = (str) => {
    const parts = str.split("〜").map((s) => s.trim());
    return {
      start: new Date(parts[0]),
      end: new Date(parts[1]),
    };
  };

  const allDates = [];
  validData.forEach((d) => {
    const p = parsePeriod(d.mfgPeriod);
    allDates.push(p.start.getTime(), p.end.getTime());
    if (d.dueDate) allDates.push(new Date(d.dueDate).getTime());
  });

  const minTime = Math.min(...allDates);
  const maxTime = Math.max(...allDates);
  const minMonth = new Date(minTime);
  minMonth.setDate(1);
  minMonth.setHours(0, 0, 0, 0);
  const chartMinTime = minMonth.getTime();

  const labels = validData.map((d) => d.partNo || d.managementNo);

  if (ganttChartInstance) ganttChartInstance.destroy();

  const ctx = document.getElementById("ganttChart").getContext("2d");
  ganttChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "製造期間",
          data: validData.map((d) => {
            const p = parsePeriod(d.mfgPeriod);
            return [p.start.getTime(), p.end.getTime()];
          }),
          backgroundColor: "#FFC000",
          barThickness: 12,
          pointStyle: "rect",
        },
        {
          label: "納期",
          data: validData.map((d) =>
            d.dueDate ? new Date(d.dueDate).getTime() : null,
          ),
          type: "scatter",
          pointStyle: "circle",
          pointRadius: 5,
          backgroundColor: "#FF0000",
          borderColor: "#FF0000",
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const item = validData[ctx.dataIndex];
              if (ctx.datasetIndex === 0) return `製造期間: ${item.mfgPeriod}`;
              return `納期: ${item.dueDate}`;
            },
          },
        },
        datalabels: {
          display: false,
        },
      },
      scales: {
        x: {
          type: "linear",
          min: chartMinTime,
          max: maxTime,
          afterBuildTicks: (axis) => {
            const ticks = [];
            const cur = new Date(minTime);
            cur.setDate(1);
            cur.setHours(0, 0, 0, 0);
            while (cur.getTime() <= maxTime) {
              ticks.push({ value: cur.getTime() });
              [10, 20].forEach((day) => {
                const d = new Date(cur.getFullYear(), cur.getMonth(), day);
                d.setHours(0, 0, 0, 0);
                if (d.getTime() <= maxTime) ticks.push({ value: d.getTime() });
              });
              cur.setMonth(cur.getMonth() + 1);
            }
            axis.ticks = ticks;
          },
          ticks: {
            callback: (val) => {
              const d = new Date(val);
              const day = d.getDate();
              if (day === 1) {
                const firstDate = new Date(minTime);
                firstDate.setDate(1);
                firstDate.setHours(0, 0, 0, 0);
                const isFirst = d.getTime() === firstDate.getTime();
                const isNewYear = d.getMonth() === 0;
                return isFirst || isNewYear
                  ? `${d.getFullYear()}/${d.getMonth() + 1}月`
                  : `${d.getMonth() + 1}月`;
              }
              return `${day}`;
            },
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          ticks: {
            autoSkip: false,
            font: {
              size: Math.max(8, Math.min(12, 200 / validData.length)),
            },
          },
        },
      },
    },
  });
}

// ===========================
// CSVダウンロード
// ===========================
function downloadCSV() {
  if (extractData.length === 0) {
    alert("ダウンロードするデータがありません。");
    return;
  }

  if (currentGraph === "count") {
    const months = getMonthRange();
    const headers = ["月", "試作", "量産", "トライ", "合計"];
    const rows = months.map((m) => {
      const label = `${m.year}/${m.month}月`;
      const sisaku = extractData
        .filter((d) => {
          const date = new Date(d.dueDate);
          return (
            date.getFullYear() === m.year &&
            date.getMonth() + 1 === m.month &&
            d.type === "試作"
          );
        })
        .reduce((sum, d) => sum + (parseInt(d.qty) || 0), 0);
      const ryosan = extractData
        .filter((d) => {
          const date = new Date(d.dueDate);
          return (
            date.getFullYear() === m.year &&
            date.getMonth() + 1 === m.month &&
            d.type === "量産"
          );
        })
        .reduce((sum, d) => sum + (parseInt(d.qty) || 0), 0);
      const torai = extractData
        .filter((d) => {
          const date = new Date(d.dueDate);
          return (
            date.getFullYear() === m.year &&
            date.getMonth() + 1 === m.month &&
            d.type === "トライ"
          );
        })
        .reduce((sum, d) => sum + (parseInt(d.qty) || 0), 0);
      return [label, sisaku, ryosan, torai, sisaku + ryosan + torai];
    });
    exportCSV(headers, rows, "protrack_count.csv");
  } else if (currentGraph === "mfgtime") {
    const months = getMonthRange();
    const headers = ["月", "生産時間(h)", "段替時間(h)", "必要人員(人)"];
    const rows = months.map((m, i) => {
      const label = `${m.year}/${m.month}月`;
      const production = extractData
        .filter((d) => {
          const date = new Date(d.dueDate);
          return (
            date.getFullYear() === m.year && date.getMonth() + 1 === m.month
          );
        })
        .reduce((sum, d) => sum + calcMfgTime(d).production, 0);
      const setup = extractData
        .filter((d) => {
          const date = new Date(d.dueDate);
          return (
            date.getFullYear() === m.year && date.getMonth() + 1 === m.month
          );
        })
        .reduce((sum, d) => sum + calcMfgTime(d).setup, 0);
      const workdays = getWorkdaysInMonth(m.year, m.month);
      const netHours = calcNetWorkHours("ブシュ");
      const totalTime = production + setup;
      const people =
        workdays === 0 || netHours === 0
          ? 0
          : Math.round((totalTime / (netHours * workdays)) * 10) / 10;
      return [
        label,
        Math.round(production * 10) / 10,
        Math.round(setup * 10) / 10,
        people,
      ];
    });
    exportCSV(headers, rows, "protrack_mfgtime.csv");
  } else if (currentGraph === "gantt") {
    const validData = extractData.filter(
      (d) => d.mfgPeriod && d.mfgPeriod.includes("〜"),
    );
    const headers = [
      "管理番号",
      "品番",
      "製造期間開始",
      "製造期間終了",
      "納期",
    ];
    const rows = validData.map((d) => {
      const parts = d.mfgPeriod.split("〜").map((s) => s.trim());
      return [d.managementNo, d.partNo, parts[0], parts[1], d.dueDate];
    });
    exportCSV(headers, rows, "protrack_gantt.csv");
  }
}

function exportCSV(headers, rows, filename) {
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${v ?? ""}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// ===========================
// ナビゲーション
// ===========================
function goBack() {
  window.location.href = "index.html";
}

function logout() {
  window.location.href = "login.html";
}
