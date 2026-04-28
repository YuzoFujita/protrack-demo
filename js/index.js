// 初期化処理
window.onload = function () {
  applyStatusDots();
  populateDynamicFilters();
  setupFilterDropdown("th-type", "typeFilter");
  setupFilterDropdown("th-newrepeat", "newrepeatFilter");
  setupFilterDropdown("th-standard", "standardFilter");
  setupFilterDropdown("th-client", "clientFilter");
  setupFilterDropdown("th-requester", "requesterFilter");
  setupFilterDropdown("th-designer", "designerFilter");
  setupFilterDropdown("th-mfgcontact", "mfgcontactFilter");
  setupFilterDropdown("th-mfganswer", "mfganswerFilter");
  setupFilterDropdown("th-status", "statusFilter");
  setupFilterDropdown("th-product", "productFilter");
  setupFilterDropdown("th-supplier", "supplierFilter");
};

// フィルタードロップダウンの表示・非表示・外クリック制御
function setupFilterDropdown(thId, filterId) {
  const th = document.getElementById(thId);
  const filter = document.getElementById(filterId);

  th.addEventListener("click", (e) => {
    e.stopPropagation();
    if (e.target.tagName === "SELECT") return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "LABEL") return;
    filter.style.display = filter.style.display === "none" ? "block" : "none";
  });

  filter.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  filter.querySelectorAll("input").forEach((cb) => {
    cb.addEventListener("change", () => {
      applyFilters();
    });
  });

  document.addEventListener("click", () => {
    filter.style.display = "none";
  });
}

// 動的候補を生成（客先・依頼者・設計者・製造窓口・製造回答・仕入先）
function populateDynamicFilters() {
  const dynamicFilters = [
    { filterId: "clientFilter", colIndex: 7 },
    { filterId: "requesterFilter", colIndex: 8 },
    { filterId: "designerFilter", colIndex: 9 },
    { filterId: "mfgcontactFilter", colIndex: 10 },
    { filterId: "mfganswerFilter", colIndex: 11 },
    { filterId: "supplierFilter", colIndex: 14 }, // 追加
  ];

  dynamicFilters.forEach(({ filterId, colIndex }) => {
    const filter = document.getElementById(filterId);
    const rows = document.querySelectorAll("tbody tr");
    const values = new Set();

    rows.forEach((row) => {
      const val = row.children[colIndex].innerText.trim();
      if (val) values.add(val);
    });

    values.forEach((val) => {
      const label = document.createElement("label");
      label.style.cssText = "display:block; padding:6px 12px; cursor:pointer;";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = val;
      cb.addEventListener("change", applyFilters);
      label.appendChild(cb);
      label.appendChild(document.createTextNode(" " + val));
      filter.appendChild(label);
    });
  });
}

//// フィルタ機能
const searchInput = document.getElementById("searchInput");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");

function applyFilters() {
  const keyword = searchInput.value.toLowerCase();
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  const selectedTypes = [
    ...document.querySelectorAll("#typeFilter input:checked"),
  ].map((cb) => cb.value.toLowerCase());
  const selectedProduct = [
    ...document.querySelectorAll("#productFilter input:checked"),
  ].map((cb) => cb.value.toLowerCase());
  const selectedNewrepeat = [
    ...document.querySelectorAll("#newrepeatFilter input:checked"),
  ].map((cb) => cb.value.toLowerCase());
  const selectedStandard = [
    ...document.querySelectorAll("#standardFilter input:checked"),
  ].map((cb) => cb.value.toLowerCase());
  const selectedClient = [
    ...document.querySelectorAll("#clientFilter input:checked"),
  ].map((cb) => cb.value.toLowerCase());
  const selectedRequester = [
    ...document.querySelectorAll("#requesterFilter input:checked"),
  ].map((cb) => cb.value.toLowerCase());
  const selectedDesigner = [
    ...document.querySelectorAll("#designerFilter input:checked"),
  ].map((cb) => cb.value.toLowerCase());
  const selectedMfgcontact = [
    ...document.querySelectorAll("#mfgcontactFilter input:checked"),
  ].map((cb) => cb.value.toLowerCase());
  const selectedMfganswer = [
    ...document.querySelectorAll("#mfganswerFilter input:checked"),
  ].map((cb) => cb.value.toLowerCase());
  const selectedStatus = [
    ...document.querySelectorAll("#statusFilter input:checked"),
  ].map((cb) => cb.value.toLowerCase());
  const selectedSupplier = [
    ...document.querySelectorAll("#supplierFilter input:checked"),
  ].map((cb) => cb.value.toLowerCase());

  const rows = document.querySelectorAll("tbody tr");

  rows.forEach((row) => {
    const matchType =
      selectedTypes.length === 0 ||
      selectedTypes.includes(row.children[1].innerText.toLowerCase());
    const matchProduct =
      selectedProduct.length === 0 ||
      selectedProduct.includes(row.children[2].innerText.toLowerCase());
    const matchNewrepeat =
      selectedNewrepeat.length === 0 ||
      selectedNewrepeat.includes(row.children[3].innerText.toLowerCase());
    const matchStandard =
      selectedStandard.length === 0 ||
      selectedStandard.includes(row.children[4].innerText.toLowerCase());
    const matchClient =
      selectedClient.length === 0 ||
      selectedClient.includes(row.children[7].innerText.toLowerCase());
    const matchRequester =
      selectedRequester.length === 0 ||
      selectedRequester.includes(row.children[8].innerText.toLowerCase());
    const matchDesigner =
      selectedDesigner.length === 0 ||
      selectedDesigner.includes(row.children[9].innerText.toLowerCase());
    const matchMfgcontact =
      selectedMfgcontact.length === 0 ||
      selectedMfgcontact.includes(row.children[10].innerText.toLowerCase());
    const matchMfganswer =
      selectedMfganswer.length === 0 ||
      selectedMfganswer.includes(row.children[11].innerText.toLowerCase());
    const matchStatus =
      selectedStatus.length === 0 ||
      selectedStatus.includes(row.children[12].innerText.toLowerCase());
    const matchSupplier =
      selectedSupplier.length === 0 ||
      selectedSupplier.includes(row.children[14].innerText.toLowerCase());
    const keywords = keyword.split(/\s+/).filter((k) => k);
    const matchSearch =
      keywords.length === 0 ||
      keywords.every((k) => row.innerText.toLowerCase().includes(k));

    const dueDate = new Date(row.children[13].innerText + "T00:00:00");
    const matchDate =
      (!start || dueDate >= new Date(start)) &&
      (!end || dueDate <= new Date(end));

    row.style.display =
      matchType &&
      matchProduct &&
      matchNewrepeat &&
      matchStandard &&
      matchClient &&
      matchRequester &&
      matchDesigner &&
      matchMfgcontact &&
      matchMfganswer &&
      matchStatus &&
      matchSearch &&
      matchDate &&
      matchSupplier
        ? ""
        : "none";
  });
  applyStatusDots();
}

// 検索バーの入力時
searchInput.addEventListener("input", applyFilters);
// 納期期間-変更時
startDateInput.addEventListener("change", applyFilters);
endDateInput.addEventListener("change", applyFilters);

//// 納期ソート
let isAsc = true;
function toggleSort() {
  resetAllArrows();
  const tbody = document.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const arrowDue = document.getElementById("arrow-due");

  rows.sort((a, b) => {
    const dateA = new Date(a.children[13].innerText + "T00:00:00");
    const dateB = new Date(b.children[13].innerText + "T00:00:00");
    return isAsc ? dateA - dateB : dateB - dateA;
  });

  rows.forEach((row) => tbody.appendChild(row));
  arrowDue.innerText = isAsc ? "↑" : "↓";
  isAsc = !isAsc;
}

//// 仕入先納期ソート（追加）
let isAscSupplierDueDate = true;
function sortBySupplierDueDate() {
  resetAllArrows();
  const tbody = document.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const arrow = document.getElementById("arrow-supplier-due");

  rows.sort((a, b) => {
    const dateA = new Date(a.children[15].innerText + "T00:00:00");
    const dateB = new Date(b.children[15].innerText + "T00:00:00");
    return isAscSupplierDueDate ? dateA - dateB : dateB - dateA;
  });

  rows.forEach((row) => tbody.appendChild(row));
  arrow.innerText = isAscSupplierDueDate ? "↑" : "↓";
  isAscSupplierDueDate = !isAscSupplierDueDate;
}

//// 管理番号ソート
let isAscManagementNo = true;
function sortByManagementNo() {
  resetAllArrows();
  const tbody = document.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const arrowManagement = document.getElementById("arrow-management");

  rows.sort((a, b) => {
    const aNo = a.children[0].innerText;
    const bNo = b.children[0].innerText;

    const aDate = new Date(
      aNo.split("-")[1].replace(/(\d{2})(\d{2})(\d{2})/, "20$1-$2-$3"),
    );
    const bDate = new Date(
      bNo.split("-")[1].replace(/(\d{2})(\d{2})(\d{2})/, "20$1-$2-$3"),
    );

    const aSeq = parseInt(aNo.split("-")[2], 10);
    const bSeq = parseInt(bNo.split("-")[2], 10);

    if (aDate - bDate !== 0) {
      return isAscManagementNo ? aDate - bDate : bDate - aDate;
    } else {
      return isAscManagementNo ? aSeq - bSeq : bSeq - aSeq;
    }
  });

  rows.forEach((row) => tbody.appendChild(row));
  arrowManagement.innerText = isAscManagementNo ? "↑" : "↓";
  isAscManagementNo = !isAscManagementNo;
}

//// CSVダウンロード
function downloadCSV() {
  const rows = document.querySelectorAll("table tr");
  let csv = [];

  rows.forEach((row) => {
    if (row.style.display === "none") return;

    const cols = row.querySelectorAll("th, td");
    const rowData = [];

    cols.forEach((col) => {
      rowData.push(col.innerText);
    });

    csv.push(rowData.join(","));
  });

  const csvString = csv.join("\n");
  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "protrack.csv";
  link.click();
}

//// リセット機能
function resetFilters() {
  document.getElementById("searchInput").value = "";
  // チェックボックスフィルタをリセット
  document
    .querySelectorAll("#typeFilter input, #productFilter input")
    .forEach((cb) => (cb.checked = false));
  document
    .querySelectorAll(
      "#newrepeatFilter input, #standardFilter input, #clientFilter input, #requesterFilter input, #designerFilter input, #mfgcontactFilter input, #mfganswerFilter input, #statusFilter input, #supplierFilter input",
    )
    .forEach((cb) => (cb.checked = false));
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  applyFilters();
}

//// ページ移動：新規登録
function goToForm() {
  window.location.href = "form.html";
}

// ステータス色ドット
function applyStatusDots() {
  const rows = document.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    const statusCell = row.children[12];
    const statusValue = statusCell.innerText.trim();

    // キャンセル行にクラスを付与
    if (statusValue === "キャンセル") {
      row.classList.add("cancelled");
    } else {
      row.classList.remove("cancelled");
    }

    if (!STATUS_COLOR[statusValue]) return;
    if (!STATUS_COLOR[statusValue]) return;

    // ↓ここに追加（returnの前）
    [7, 8, 9, 10, 11].forEach((i) => (row.children[i].style.fontWeight = ""));
    const label = STATUS_COLOR[statusValue].label;
    if (label === "設計者") {
      row.children[9].style.fontWeight = "bold";
    } else if (label === "製造") {
      row.children[10].style.fontWeight = "bold";
      row.children[11].style.fontWeight = "bold";
    } else if (label === "依頼者") {
      row.children[8].style.fontWeight = "bold";
    } else if (label === "客先") {
      row.children[7].style.fontWeight = "bold";
    }

    if (statusCell.querySelector(".status-dot")) return; // ← この前に入れる

    // ドット生成...
    if (statusCell.querySelector(".status-dot")) return;

    const dot = document.createElement("span");
    dot.className = "status-dot";
    dot.style.backgroundColor = STATUS_COLOR[statusValue].color;
    dot.title = STATUS_COLOR[statusValue].label;
    statusCell.appendChild(dot);
  });
}

//// 更新日ソート（colIndex 17に修正）
let isAscUpdateDate = true;
function sortByUpdateDate() {
  resetAllArrows();
  const tbody = document.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const arrow = document.getElementById("arrow-update");

  rows.sort((a, b) => {
    const dateA = new Date(a.children[17].innerText); // 17列目に修正
    const dateB = new Date(b.children[17].innerText);
    return isAscUpdateDate ? dateA - dateB : dateB - dateA;
  });

  rows.forEach((row) => tbody.appendChild(row));
  arrow.innerText = isAscUpdateDate ? "↑" : "↓";
  isAscUpdateDate = !isAscUpdateDate;
}

function goToMaster() {
  window.location.href = "master.html";
}

// 全ソート矢印をリセット
function resetAllArrows() {
  document.getElementById("arrow-management").textContent = "↑↓";
  document.getElementById("arrow-due").textContent = "↑↓";
  document.getElementById("arrow-supplier-due").textContent = "↑↓";
  document.getElementById("arrow-update").textContent = "↑↓";
}

function goToMfg() {
  window.location.href = "mfg.html";
}
function goToCal() {
  window.location.href = "cal.html";
}

function goToExtract() {
  const rows = document.querySelectorAll("tbody tr");
  const data = [];

  rows.forEach((row) => {
    if (row.style.display === "none") return;

    data.push({
      managementNo: row.children[0].innerText.trim(),
      type: row.children[1].innerText.trim(),
      product: row.children[2].innerText.trim(),
      newRepeat: row.children[3].innerText.trim(),
      standard: row.children[4].innerText.trim(),
      partNo: row.children[5].innerText.trim(),
      qty: row.children[6].innerText.trim(),
      client: row.children[7].innerText.trim(),
      requester: row.children[8].innerText.trim(),
      designer: row.children[9].innerText.trim(),
      mfgContact: row.children[10].innerText.trim(),
      mfgAnswer: row.children[11].innerText.trim(),
      status: row.children[12].innerText.trim(),
      dueDate: row.children[13].innerText.trim(),
      supplier: row.children[14].innerText.trim(),
      supplierDueDate: row.children[15].innerText.trim(),
      memo: row.children[16].innerText.trim(),
      mfgType: row.children[17].innerText.trim(),
      mfgPeriod: row.children[18].innerText.trim(),
      updatedAt: row.children[19].innerText.trim(),
      updatedBy: row.children[20].innerText.trim(),
    });
  });

  localStorage.setItem("extractData", JSON.stringify(data));
  window.location.href = "extract.html";
}

function goToForecast() {
  const rows = document.querySelectorAll("tbody tr");
  const data = [];

  rows.forEach((row) => {
    if (row.style.display === "none") return;

    data.push({
      managementNo: row.children[0].innerText.trim(),
      type: row.children[1].innerText.trim(),
      product: row.children[2].innerText.trim(),
      newRepeat: row.children[3].innerText.trim(),
      standard: row.children[4].innerText.trim(),
      partNo: row.children[5].innerText.trim(),
      qty: row.children[6].innerText.trim(),
      client: row.children[7].innerText.trim(),
      requester: row.children[8].innerText.trim(),
      designer: row.children[9].innerText.trim(),
      mfgContact: row.children[10].innerText.trim(),
      mfgAnswer: row.children[11].innerText.trim(),
      status: row.children[12].innerText.trim(),
      dueDate: row.children[13].innerText.trim(),
      supplier: row.children[14].innerText.trim(),
      supplierDueDate: row.children[15].innerText.trim(),
      memo: row.children[16].innerText.trim(),
      mfgType: row.children[17].innerText.trim(),
      mfgPeriod: row.children[18].innerText.trim(),
      updatedAt: row.children[19].innerText.trim(),
      updatedBy: row.children[20].innerText.trim(),
    });
  });

  localStorage.setItem("extractData", JSON.stringify(data));
  window.location.href = "forecast.html";
}

function toggleHamburger() {
  const menu = document.getElementById("hamburger-menu");
  menu.style.display = menu.style.display === "none" ? "block" : "none";
}

document.addEventListener("click", (e) => {
  const btn = document.getElementById("hamburger-btn");
  const menu = document.getElementById("hamburger-menu");
  if (!btn.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = "none";
  }
});

function toggleAllCheckboxes(filterId, allCheckbox) {
  const filter = document.getElementById(filterId);
  const checkboxes = [
    ...filter.querySelectorAll("input[type='checkbox']"),
  ].filter((cb) => cb !== allCheckbox);
  checkboxes.forEach((cb) => (cb.checked = allCheckbox.checked));
  applyFilters();
}
