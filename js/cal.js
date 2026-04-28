// ===========================
// cal.js - カレンダー設定ページ
// ===========================

// 年度の上下限
const YEAR_MIN = 2026;
const YEAR_MAX = 2100;

// 現在選択中の年度
let currentFiscalYear = getCurrentFiscalYear();

// 手動で休日設定した日付（土日以外）
// 【仮データ】バックエンド実装後はAPIから取得
const HOLIDAY_DATA = {
  // 例：2026年度の手動休日
  2026: { holidays: [], workdays: [] },
};

// ===========================
// 初期化
// ===========================
window.onload = function () {
  renderCalendar();
};

// ===========================
// 現在の年度を取得
// 4月〜3月で年度を判定
// ===========================
function getCurrentFiscalYear() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  return month >= 4 ? year : year - 1;
}

// ===========================
// 年度切り替え
// ===========================
function changeYear(delta) {
  const newYear = currentFiscalYear + delta;
  if (newYear < YEAR_MIN || newYear > YEAR_MAX) return;
  currentFiscalYear = newYear;
  renderCalendar();
}

// ===========================
// カレンダー全体を描画
// ===========================
function renderCalendar() {
  // 年度・対象期間を更新
  document.getElementById("currentYear").textContent = currentFiscalYear;
  document.getElementById("periodLabel").textContent =
    `${currentFiscalYear}年4月 ～ ${currentFiscalYear + 1}年3月`;

  // 年度のHOLIDAY_DATAがなければ初期化
  if (!HOLIDAY_DATA[currentFiscalYear]) {
    HOLIDAY_DATA[currentFiscalYear] = { holidays: [], workdays: [] };
  }

  // 4月〜翌3月の12ヶ月分を描画
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  let totalWorkDays = 0;

  for (let i = 0; i < 12; i++) {
    const month = i < 9 ? i + 4 : i - 8; // 4〜12月 → 1〜3月
    const year = i < 9 ? currentFiscalYear : currentFiscalYear + 1;
    const { el, workDays } = createMonthCalendar(year, month);
    grid.appendChild(el);
    totalWorkDays += workDays;
  }

  document.getElementById("totalWorkDays").textContent = totalWorkDays;
}

// ===========================
// 月カレンダーを生成
// ===========================
function createMonthCalendar(year, month) {
  const el = document.createElement("div");
  el.className = "month-calendar";

  // 月ヘッダー
  const header = document.createElement("div");
  header.className = "month-header";
  header.textContent = `${year}年${month}月`;
  el.appendChild(header);

  // 曜日ヘッダー
  const weekdays = document.createElement("div");
  weekdays.className = "cal-weekdays";
  ["日", "月", "火", "水", "木", "金", "土"].forEach((d) => {
    const span = document.createElement("span");
    span.textContent = d;
    weekdays.appendChild(span);
  });
  el.appendChild(weekdays);

  // 日付グリッド
  const daysGrid = document.createElement("div");
  daysGrid.className = "cal-days";

  const firstDay = new Date(year, month - 1, 1).getDay(); // 1日の曜日
  const lastDate = new Date(year, month, 0).getDate(); // 月の最終日

  let workDays = 0;

  // 空白セル（月の始まり前）
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-day empty";
    daysGrid.appendChild(empty);
  }

  // 日付セル
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const data = HOLIDAY_DATA[currentFiscalYear];
    const isManualHoliday = data.holidays.includes(dateStr);
    const isManualWorkday = data.workdays.includes(dateStr);

    // 土日でも手動で稼働日にした場合は稼働日扱い
    // 平日でも手動で休日にした場合は休日扱い
    const isHoliday = (isWeekend && !isManualWorkday) || isManualHoliday;

    const cell = document.createElement("div");
    cell.className = `cal-day ${isHoliday ? "holiday" : "workday"}`;
    cell.textContent = d;
    cell.dataset.date = dateStr;
    cell.dataset.dayofweek = dayOfWeek;

    // 日付クリックで稼働日↔休日切り替え
    cell.addEventListener("click", () =>
      toggleHoliday(cell, dateStr, dayOfWeek),
    );

    if (!isHoliday) workDays++;
    daysGrid.appendChild(cell);
  }

  el.appendChild(daysGrid);

  // 月の稼働日数
  const workDaysEl = document.createElement("div");
  workDaysEl.className = "month-workdays";
  workDaysEl.textContent = `(${workDays})`;
  el.appendChild(workDaysEl);

  return { el, workDays };
}

// ===========================
// 稼働日↔休日切り替え
// ===========================
function toggleHoliday(cell, dateStr, dayOfWeek) {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const data = HOLIDAY_DATA[currentFiscalYear];
  const isManualHoliday = data.holidays.includes(dateStr);
  const isManualWorkday = data.workdays.includes(dateStr);
  const isCurrentlyHoliday = cell.classList.contains("holiday");

  if (isCurrentlyHoliday) {
    // 休日 → 稼働日
    if (isWeekend) {
      // 土日を稼働日に → workdaysに追加
      data.workdays.push(dateStr);
    } else {
      // 手動休日を稼働日に → holidaysから削除
      const idx = data.holidays.indexOf(dateStr);
      if (idx !== -1) data.holidays.splice(idx, 1);
    }
  } else {
    // 稼働日 → 休日
    if (isWeekend) {
      // 土日稼働日を休日に戻す → workdaysから削除
      const idx = data.workdays.indexOf(dateStr);
      if (idx !== -1) data.workdays.splice(idx, 1);
    } else {
      // 平日を休日に → holidaysに追加
      data.holidays.push(dateStr);
    }
  }

  // カレンダー再描画
  renderCalendar();
}

// ===========================
// 保存
// ===========================
function saveCal() {
  if (!confirm("保存しますか？")) return;
  // バックエンド実装後はAPIでDBに保存
  console.log("カレンダーデータ:", HOLIDAY_DATA);
  alert("保存しました！（※今はまだ仮保存です）");
  window.location.href = "index.html";
}

// ===========================
// キャンセル・ログアウト
// ===========================
function goBack() {
  if (confirm("変更を破棄して一覧に戻りますか？")) {
    window.location.href = "index.html";
  }
}
