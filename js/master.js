// ===========================
// master.js - 客先/仕入先設定ページ
// ===========================

// ===========================
// 【仮データ】
// バックエンド実装後はAPIから取得に切り替える
// ===========================
let clients = [
  { id: 1, name: "A社", createdAt: "2026-02-01" },
  { id: 2, name: "B社", createdAt: "2026-02-01" },
  { id: 3, name: "C社", createdAt: "2026-02-11" },
];

let suppliers = [
  { id: 1, name: "α工業", createdAt: "2026-02-01" },
  { id: 2, name: "β精機", createdAt: "2026-02-01" },
];

// 編集中のID（新規登録時はnull）
let editingClientId = null;
let editingSupplierIdVal = null;

// ソート状態
let clientSortKey = null;
let clientSortAsc = true;
let supplierSortKey = null;
let supplierSortAsc = true;

// ===========================
// 初期化
// ===========================
window.onload = function () {
  renderClientTable();
  renderSupplierTable();
};

// ===========================
// 客先テーブル描画
// ===========================
function renderClientTable() {
  const keyword = document.getElementById("clientSearch").value.toLowerCase();
  const tbody = document.getElementById("clientTableBody");

  const keywords = keyword.split(/\s+/).filter((k) => k);
  let data = clients.filter(
    (c) =>
      keywords.length === 0 ||
      keywords.every((k) => c.name.toLowerCase().includes(k)),
  );

  // ソート
  if (clientSortKey) {
    data.sort((a, b) => {
      const valA = clientSortKey === "name" ? a.name : a.createdAt;
      const valB = clientSortKey === "name" ? b.name : b.createdAt;
      return clientSortAsc
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }

  tbody.innerHTML = data
    .map(
      (c) => `
    <tr>
      <td>${c.id}</td>
      <td>${c.name}</td>
      <td>${c.createdAt}</td>
      <td><button onclick="editClient(${c.id})">✏️</button></td>
      <td><button onclick="deleteClient(${c.id})">🗑</button></td>
    </tr>
  `,
    )
    .join("");
}

// ===========================
// 仕入先テーブル描画
// ===========================
function renderSupplierTable() {
  const keyword = document.getElementById("supplierSearch").value.toLowerCase();
  const tbody = document.getElementById("supplierTableBody");

  const keywords = keyword.split(/\s+/).filter((k) => k);
  let data = suppliers.filter(
    (s) =>
      keywords.length === 0 ||
      keywords.every((k) => s.name.toLowerCase().includes(k)),
  );

  // ソート
  if (supplierSortKey) {
    data.sort((a, b) => {
      const valA = supplierSortKey === "name" ? a.name : a.createdAt;
      const valB = supplierSortKey === "name" ? b.name : b.createdAt;
      return supplierSortAsc
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }

  tbody.innerHTML = data
    .map(
      (s) => `
    <tr>
      <td>${s.id}</td>
      <td>${s.name}</td>
      <td>${s.createdAt}</td>
      <td><button onclick="editSupplier(${s.id})">✏️</button></td>
      <td><button onclick="deleteSupplier(${s.id})">🗑</button></td>
    </tr>
  `,
    )
    .join("");
}

// ===========================
// 客先：フォーム表示
// ===========================
function showClientForm() {
  editingClientId = null;
  document.getElementById("clientFormTitle").textContent = "客先 新規登録";
  document.getElementById("clientInput").value = "";
  document.getElementById("clientForm").style.display = "block";
  document.getElementById("clientInput").focus();
}

function closeClientForm() {
  document.getElementById("clientForm").style.display = "none";
  editingClientId = null;
}

// ===========================
// 客先：編集
// ===========================
function editClient(id) {
  const client = clients.find((c) => c.id === id);
  if (!client) return;

  editingClientId = id;
  document.getElementById("clientFormTitle").textContent = "客先 編集";
  document.getElementById("clientInput").value = client.name;
  document.getElementById("clientForm").style.display = "block";
  document.getElementById("clientInput").focus();
}

// ===========================
// 客先：保存
// ===========================
function saveClient() {
  const name = document.getElementById("clientInput").value.trim();
  if (!name) {
    alert("客先名を入力してください");
    return;
  }

  if (editingClientId === null) {
    // 重複チェック
    if (clients.some((c) => c.name === name)) {
      alert("同じ名前の客先がすでに登録されています");
      return;
    }
    // 新規登録
    const newId =
      clients.length > 0 ? Math.max(...clients.map((c) => c.id)) + 1 : 1;
    const today = formatDate(new Date());
    clients.push({ id: newId, name, createdAt: today });
  } else {
    // 重複チェック（自分自身は除く）
    if (clients.some((c) => c.name === name && c.id !== editingClientId)) {
      alert("同じ名前の客先がすでに登録されています");
      return;
    }
    // 編集
    const client = clients.find((c) => c.id === editingClientId);
    if (client) client.name = name;
  }

  alert(
    "仮登録しました。ページ下部の「保存」ボタンを押すとデータベースに保存されます。",
  );
  closeClientForm();
  renderClientTable();
}

// ===========================
// 客先：削除
// ===========================
function deleteClient(id) {
  if (!confirm("この客先を削除しますか？")) return;
  clients = clients.filter((c) => c.id !== id);
  renderClientTable();
}

// ===========================
// 客先：検索
// ===========================
function filterClient() {
  renderClientTable();
}

// ===========================
// 客先：ソート
// ===========================
function sortClient(key) {
  if (clientSortKey === key) {
    clientSortAsc = !clientSortAsc;
  } else {
    clientSortKey = key;
    clientSortAsc = true;
  }
  const arrowName = document.getElementById("arrow-client-name");
  const arrowDate = document.getElementById("arrow-client-date");
  arrowName.textContent = "↑↓";
  arrowDate.textContent = "↑↓";

  if (key === "name") arrowName.textContent = clientSortAsc ? "↑" : "↓";
  if (key === "date") arrowDate.textContent = clientSortAsc ? "↑" : "↓";

  renderClientTable();
}

// ===========================
// 仕入先：フォーム表示
// ===========================
function showSupplierForm() {
  editingSupplierIdVal = null;
  document.getElementById("supplierFormTitle").textContent = "仕入先 新規登録";
  document.getElementById("supplierInput").value = "";
  document.getElementById("supplierForm").style.display = "block";
  document.getElementById("supplierInput").focus();
}

function closeSupplierForm() {
  document.getElementById("supplierForm").style.display = "none";
  editingSupplierIdVal = null;
}

// ===========================
// 仕入先：編集
// ===========================
function editSupplier(id) {
  const supplier = suppliers.find((s) => s.id === id);
  if (!supplier) return;

  editingSupplierIdVal = id;
  document.getElementById("supplierFormTitle").textContent = "仕入先 編集";
  document.getElementById("supplierInput").value = supplier.name;
  document.getElementById("supplierForm").style.display = "block";
  document.getElementById("supplierInput").focus();
}

// ===========================
// 仕入先：保存
// ===========================
function saveSupplier() {
  const name = document.getElementById("supplierInput").value.trim();
  if (!name) {
    alert("仕入先名を入力してください");
    return;
  }

  if (editingSupplierIdVal === null) {
    // 重複チェック
    if (suppliers.some((s) => s.name === name)) {
      alert("同じ名前の客先がすでに登録されています");
      return;
    }
    // 新規登録
    const newId =
      suppliers.length > 0 ? Math.max(...suppliers.map((s) => s.id)) + 1 : 1;
    const today = formatDate(new Date());
    suppliers.push({ id: newId, name, createdAt: today });
  } else {
    // 重複チェック（自分自身は除く）
    if (
      suppliers.some((s) => s.name === name && s.id !== editingSupplierIdVal)
    ) {
      alert("同じ名前の客先がすでに登録されています");
      return;
    }
    // 編集
    const supplier = suppliers.find((s) => s.id === editingSupplierIdVal);
    if (supplier) supplier.name = name;
  }

  alert(
    "仮登録しました。ページ下部の「保存」ボタンを押すとデータベースに保存されます。",
  );
  closeSupplierForm();
  renderSupplierTable();
}

// ===========================
// 仕入先：削除
// ===========================
function deleteSupplier(id) {
  if (!confirm("この仕入先を削除しますか？")) return;
  suppliers = suppliers.filter((s) => s.id !== id);
  renderSupplierTable();
}

// ===========================
// 仕入先：検索
// ===========================
function filterSupplier() {
  renderSupplierTable();
}

// ===========================
// 仕入先：ソート
// ===========================
function sortSupplier(key) {
  if (supplierSortKey === key) {
    supplierSortAsc = !supplierSortAsc;
  } else {
    supplierSortKey = key;
    supplierSortAsc = true;
  }
  const arrowName = document.getElementById("arrow-supplier-name");
  const arrowDate = document.getElementById("arrow-supplier-date");
  arrowName.textContent = "↑↓";
  arrowDate.textContent = "↑↓";

  if (key === "name") arrowName.textContent = supplierSortAsc ? "↑" : "↓";
  if (key === "date") arrowDate.textContent = supplierSortAsc ? "↑" : "↓";

  renderSupplierTable();
}

// ===========================
// 共通：日付フォーマット
// ===========================
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ===========================
// ページ下部ボタン
// ===========================
function saveAll() {
  if (!confirm("保存しますか？")) return;
  alert("保存しました！（※今はまだ仮保存です）");
  window.location.href = "index.html";
}

function goBack() {
  if (confirm("変更を破棄して一覧に戻りますか？")) {
    window.location.href = "index.html";
  }
}
