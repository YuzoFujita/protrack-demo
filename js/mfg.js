// ===========================
// mfg.js - 製造設定ページ
// ===========================

// 現在選択中の品名・設定項目
let currentProduct = "ブシュ";
let currentSetting = null;

// ===========================
// 初期化
// ===========================
window.onload = function () {
  // デフォルトはブシュ選択・設定項目は未選択（編集画面は空）
  selectProduct("ブシュ");
};

// ===========================
// 品名タブ切り替え
// ===========================
function selectProduct(product) {
  currentProduct = product;

  // タブのアクティブ状態を更新
  document.getElementById("tab-metal").classList.remove("active");
  document.getElementById("tab-bushu").classList.remove("active");
  document.getElementById("tab-washer").classList.remove("active");

  if (product === "メタル") {
    document.getElementById("tab-metal").classList.add("active");
  } else if (product === "ブシュ") {
    document.getElementById("tab-bushu").classList.add("active");
  } else if (product === "ワッシャ") {
    document.getElementById("tab-washer").classList.add("active");
  }

  // 設定項目を再描画
  if (currentSetting) selectSetting(currentSetting);
}

// ===========================
// 設定項目タブ切り替え
// ===========================
function selectSetting(setting) {
  currentSetting = setting;

  // タブのアクティブ状態を更新
  document.getElementById("tab-mct").classList.remove("active");
  document.getElementById("tab-type").classList.remove("active");
  document.getElementById("tab-work").classList.remove("active");

  if (setting === "mct")
    document.getElementById("tab-mct").classList.add("active");
  if (setting === "type")
    document.getElementById("tab-type").classList.add("active");
  if (setting === "work")
    document.getElementById("tab-work").classList.add("active");

  // パネルを全部隠す
  document.getElementById("notReady").style.display = "none";
  document.getElementById("panel-mct").style.display = "none";
  document.getElementById("panel-type").style.display = "none";
  document.getElementById("panel-work").style.display = "none";

  // メタル・ワッシャは準備中
  if (currentProduct !== "ブシュ") {
    document.getElementById("notReady").style.display = "block";
    return;
  }

  // ブシュの場合は該当パネルを表示
  if (setting === "mct") {
    document.getElementById("panel-mct").style.display = "block";
    renderMctTable();
  }
  if (setting === "type") {
    document.getElementById("panel-type").style.display = "block";
    renderTypeTable();
  }
  if (setting === "work") {
    document.getElementById("panel-work").style.display = "block";
    renderWorkPanel();
  }
}

// ===========================
// ① 個当たり製造時間テーブル描画
// ===========================
function renderMctTable() {
  const master = PROCESS_MASTER["ブシュ"];
  const tbody = document.getElementById("mctTableBody");

  tbody.innerHTML = master.processes
    .map(
      (p, i) => `
    <tr>
      <td>${p.name}</td>
      <td><input type="number" id="mct-${i}" value="${p.mct}" step="0.1" min="0" /></td>
      <td><input type="number" id="defect-${i}" value="${p.defectRate}" step="0.1" min="0" max="100" /></td>
      <td><input type="number" id="setup-${i}" value="${p.setupTime}" step="0.01" min="0" /></td>
    </tr>
  `,
    )
    .join("");
}

// ===========================
// ② 製造種別テーブル描画
// ===========================
function renderTypeTable() {
  const master = PROCESS_MASTER["ブシュ"];
  const processes = master.processes;
  const mfgTypes = master.mfgTypes;
  const typeNames = Object.keys(mfgTypes);

  // ヘッダー行
  const headerRow = document.getElementById("typeHeaderRow");
  headerRow.innerHTML = `
    <th><button class="btn-new-type" onclick="addNewType()">新規作成</button></th>
    ${typeNames.map((t) => `<th class="type-header">${t}</th>`).join("")}
  `;

  // ボディ行
  const tbody = document.getElementById("typeTableBody");
  tbody.innerHTML = processes
    .map(
      (p) => `
  <tr style="border-bottom: 1px solid #ccc;">
    <td>${p.name}</td>
    ${typeNames
      .map(
        (t) => `
      <td style="text-align:center;">
        <input type="checkbox"
          id="chk-${t}-${p.name}"
          ${mfgTypes[t].includes(p.name) ? "checked" : ""}
        />
      </td>
    `,
      )
      .join("")}
  </tr>
`,
    )
    .join("");
}

// ===========================
// ② 製造種別：新規作成
// ===========================
function addNewType() {
  const name = prompt(
    "新しい製造種別名を入力してください\n例：D プレーン(コイル)+熱処理",
  );
  if (!name || !name.trim()) return;

  const master = PROCESS_MASTER["ブシュ"];
  if (master.mfgTypes[name.trim()]) {
    alert("同じ名前の製造種別がすでに存在します");
    return;
  }

  // 新しい製造種別を追加（全工程チェックなしで初期化）
  master.mfgTypes[name.trim()] = [];
  renderTypeTable();
}

// ===========================
// ③ 1人当たりの稼働時間パネル描画
// ===========================
function renderWorkPanel() {
  const master = PROCESS_MASTER["ブシュ"];
  const work = master.workHours;

  document.getElementById("workHours").value = work.dailyHours;
  document.getElementById("excludeMorning").value = work.excludeMorning;
  document.getElementById("exclude2s").value = work.exclude2s;
  document.getElementById("excludeSafety").value = work.excludeSafety;
  document.getElementById("excludeQC").value = work.excludeQC;
  document.getElementById("excludeVacation").value = work.excludeVacation;

  calcNetWorkHours();

  // 入力値が変わるたびに正味製造時間を再計算
  [
    "workHours",
    "excludeMorning",
    "exclude2s",
    "excludeSafety",
    "excludeQC",
    "excludeVacation",
  ].forEach((id) => {
    document.getElementById(id).addEventListener("input", calcNetWorkHours);
  });
}

// 正味製造時間の計算
function calcNetWorkHours() {
  const dailyHours =
    parseFloat(document.getElementById("workHours").value) || 0;
  const excludeMorning =
    parseFloat(document.getElementById("excludeMorning").value) || 0;
  const exclude2s = parseFloat(document.getElementById("exclude2s").value) || 0;
  const excludeSafety =
    parseFloat(document.getElementById("excludeSafety").value) || 0;
  const excludeQC = parseFloat(document.getElementById("excludeQC").value) || 0;
  const excludeVacation =
    parseFloat(document.getElementById("excludeVacation").value) || 0;

  const totalExclude =
    (excludeMorning + exclude2s + excludeSafety + excludeQC + excludeVacation) /
    60;
  const net = Math.max(0, dailyHours - totalExclude);

  document.getElementById("netWorkHours").textContent = net.toFixed(1);
}

// ===========================
// 保存
// ===========================
function saveMfg() {
  const master = PROCESS_MASTER["ブシュ"];

  // ① 個当たり製造時間を保存
  if (currentSetting === "mct") {
    master.processes.forEach((p, i) => {
      p.mct = parseFloat(document.getElementById(`mct-${i}`).value) || 0;
      p.defectRate =
        parseFloat(document.getElementById(`defect-${i}`).value) || 0;
      p.setupTime =
        parseFloat(document.getElementById(`setup-${i}`).value) || 0;
    });
  }

  // ② 製造種別を保存
  if (currentSetting === "type") {
    const typeNames = Object.keys(master.mfgTypes);
    master.processes.forEach((p) => {
      typeNames.forEach((t) => {
        const chk = document.getElementById(`chk-${t}-${p.name}`);
        if (!chk) return;
        const idx = master.mfgTypes[t].indexOf(p.name);
        if (chk.checked && idx === -1) {
          master.mfgTypes[t].push(p.name);
        } else if (!chk.checked && idx !== -1) {
          master.mfgTypes[t].splice(idx, 1);
        }
      });
    });
  }

  // ③ 稼働時間を保存
  if (currentSetting === "work") {
    master.workHours.dailyHours =
      parseFloat(document.getElementById("workHours").value) || 0;
    master.workHours.excludeMorning =
      parseFloat(document.getElementById("excludeMorning").value) || 0;
    master.workHours.exclude2s =
      parseFloat(document.getElementById("exclude2s").value) || 0;
    master.workHours.excludeSafety =
      parseFloat(document.getElementById("excludeSafety").value) || 0;
    master.workHours.excludeQC =
      parseFloat(document.getElementById("excludeQC").value) || 0;
    master.workHours.excludeVacation =
      parseFloat(document.getElementById("excludeVacation").value) || 0;
  }

  if (!confirm("保存しますか？")) return;
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
