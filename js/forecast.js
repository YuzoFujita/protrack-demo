// ===========================
// forecast.js - 生産予測ページ
// ===========================

let forecastData = [];
const TARGET_STATUSES = [
  "発注済(出図あり)",
  "発注済(出図なし)",
  "試作図出図済",
  "発送済",
];

window.onload = function () {
  loadData();
  renderCountChart();
};

// ===========================
// データ読み込み
// ===========================
function loadData() {
  const stored = localStorage.getItem("extractData");
  if (stored) {
    forecastData = JSON.parse(stored).filter((d) =>
      TARGET_STATUSES.includes(d.status),
    );
  } else {
    forecastData = [];
  }
}

// ===========================
// グラフ切替
// ===========================
let currentGraph = "count";
let countChartInstance = null;
let mfgtimeChartInstance = null;

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

  if (type === "count" && !countChartInstance) renderCountChart();
  if (type === "mfgtime" && !mfgtimeChartInstance) renderMfgtimeChart();
}

// ===========================
// 月ユーティリティ
// ===========================
function getYearMonth(date) {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function addMonths(ym, n) {
  const d = new Date(ym.year, ym.month - 1 + n, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function ymEqual(a, b) {
  return a.year === b.year && a.month === b.month;
}

function ymLabel(ym) {
  return `${ym.year}/${ym.month}月`;
}

function ymKey(ym) {
  return `${ym.year}-${String(ym.month).padStart(2, "0")}`;
}

// ===========================
// 実値取得（納期ベース・対象ステータスのみ）
// ===========================
function getActualQty(ym, type) {
  return forecastData
    .filter((d) => {
      const date = new Date(d.dueDate);
      return (
        date.getFullYear() === ym.year &&
        date.getMonth() + 1 === ym.month &&
        d.type === type
      );
    })
    .reduce((sum, d) => sum + (parseInt(d.qty) || 0), 0);
}

function getActualMfgTime(ym) {
  const items = forecastData.filter((d) => {
    const date = new Date(d.dueDate);
    return date.getFullYear() === ym.year && date.getMonth() + 1 === ym.month;
  });
  return {
    production: items.reduce((sum, d) => sum + calcMfgTime(d).production, 0),
    setup: items.reduce((sum, d) => sum + calcMfgTime(d).setup, 0),
  };
}

// ===========================
// ローリング予測計算
// ===========================
// forecastMonths: 予測する月の配列（当月から3ヶ月）
// getActualFn: (ym) => 実値を返す関数
// 予測値キャッシュ
function calcForecast(forecastMonths, getActualFn) {
  const cache = {}; // ymKey => 予測値

  const getValue = (ym) => {
    const today = getYearMonth(new Date());
    // 今月より前なら実値
    if (
      ym.year < today.year ||
      (ym.year === today.year && ym.month < today.month)
    ) {
      return { value: getActualFn(ym), isActual: true };
    }
    // キャッシュにあれば返す
    const key = ymKey(ym);
    if (cache[key] !== undefined) return { value: cache[key], isActual: false };

    // 直近3ヶ月の値を取得して平均
    const prev3 = [addMonths(ym, -3), addMonths(ym, -2), addMonths(ym, -1)];
    const vals = prev3.map((m) => getValue(m).value);
    const avg = vals.reduce((s, v) => s + v, 0) / 3;
    cache[key] = avg;
    return { value: avg, isActual: false };
  };

  return forecastMonths.map((ym) => getValue(ym));
}

// ===========================
// グラフ1：個数
// ===========================
function renderCountChart() {
  const today = getYearMonth(new Date());
  const months = [today, addMonths(today, 1), addMonths(today, 2)];
  const labels = months.map((m) => `${m.month}月予測`);
  const year = months[0].year;

  const types = ["試作", "量産", "トライ"];
  const colors = {
    試作: { solid: "#4472C4", transparent: "rgba(68,114,196,0.4)" },
    量産: { solid: "#70AD47", transparent: "rgba(112,173,71,0.4)" },
    トライ: { solid: "#FFC000", transparent: "rgba(255,192,0,0.4)" },
  };

  const datasets = types.map((type) => {
    const results = calcForecast(months, (ym) => getActualQty(ym, type));
    return {
      label: type,
      data: results.map((r) => Math.round(r.value)),
      backgroundColor: results.map((r) =>
        r.isActual ? colors[type].solid : colors[type].transparent,
      ),
      maxBarThickness: 80,
      pointStyle: "rect",
    };
  });

  Chart.register(ChartDataLabels);
  if (countChartInstance) countChartInstance.destroy();

  const ctx = document.getElementById("countChart").getContext("2d");
  countChartInstance = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top", labels: { usePointStyle: true } },
        datalabels: {
          display: (ctx) => ctx.datasetIndex === 2,
          anchor: "end",
          align: "end",
          formatter: (value, ctx) => {
            const total = ctx.chart.data.datasets.reduce(
              (sum, ds) => sum + (ds.data[ctx.dataIndex] || 0),
              0,
            );
            return total > 0 ? total : "";
          },
          font: { size: 12, weight: "bold" },
          color: "#333",
        },
      },
      scales: {
        x: {
          stacked: true,
          title: { display: true, text: String(year) },
        },
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
  const today = getYearMonth(new Date());
  const months = [today, addMonths(today, 1), addMonths(today, 2)];
  const labels = months.map((m) => `${m.month}月予測`);
  const year = months[0].year;

  const productionResults = calcForecast(
    months,
    (ym) => getActualMfgTime(ym).production,
  );
  const setupResults = calcForecast(months, (ym) => getActualMfgTime(ym).setup);

  const requiredPeople = months.map((m, i) => {
    const totalTime = productionResults[i].value + setupResults[i].value;
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
          data: productionResults.map((r) => Math.round(r.value * 10) / 10),
          backgroundColor: productionResults.map((r) =>
            r.isActual ? "#4472C4" : "rgba(68,114,196,0.4)",
          ),
          yAxisID: "y",
          order: 1,
          pointStyle: "rect",
          maxBarThickness: 80,
        },
        {
          label: "段替時間",
          data: setupResults.map((r) => Math.round(r.value * 10) / 10),
          backgroundColor: setupResults.map((r) =>
            r.isActual ? "#A9A9A9" : "rgba(169,169,169,0.4)",
          ),
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
          pointBackgroundColor: months.map((m, i) =>
            productionResults[i].isActual ? "#FF0000" : "rgba(255,0,0,0.4)",
          ),
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
          labels: { usePointStyle: true },
          sort: (a, b) => {
            const order = ["生産時間", "段替時間", "必要人員"];
            return order.indexOf(a.text) - order.indexOf(b.text);
          },
        },
        datalabels: { display: false },
      },
      scales: {
        x: { stacked: true, title: { display: true, text: String(year) } },
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
// CSVダウンロード
// ===========================
function downloadCSV() {
  const today = getYearMonth(new Date());
  const months = [today, addMonths(today, 1), addMonths(today, 2)];

  if (currentGraph === "count") {
    const headers = ["月", "試作", "量産", "トライ", "合計"];
    const rows = months.map((m) => {
      const label = `${m.month}月予測`;
      const sisaku = Math.round(
        calcForecast([m], (ym) => getActualQty(ym, "試作"))[0].value,
      );
      const ryosan = Math.round(
        calcForecast([m], (ym) => getActualQty(ym, "量産"))[0].value,
      );
      const torai = Math.round(
        calcForecast([m], (ym) => getActualQty(ym, "トライ"))[0].value,
      );
      return [label, sisaku, ryosan, torai, sisaku + ryosan + torai];
    });
    exportCSV(headers, rows, "protrack_forecast_count.csv");
  } else if (currentGraph === "mfgtime") {
    const headers = ["月", "生産時間(h)", "段替時間(h)", "必要人員(人)"];
    const rows = months.map((m) => {
      const label = `${m.month}月予測`;
      const production =
        Math.round(
          calcForecast([m], (ym) => getActualMfgTime(ym).production)[0].value *
            10,
        ) / 10;
      const setup =
        Math.round(
          calcForecast([m], (ym) => getActualMfgTime(ym).setup)[0].value * 10,
        ) / 10;
      const workdays = getWorkdaysInMonth(m.year, m.month);
      const netHours = calcNetWorkHours("ブシュ");
      const people =
        workdays === 0 || netHours === 0
          ? 0
          : Math.round(((production + setup) / (netHours * workdays)) * 10) /
            10;
      return [label, production, setup, people];
    });
    exportCSV(headers, rows, "protrack_forecast_mfgtime.csv");
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
