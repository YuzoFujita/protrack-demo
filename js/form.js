// ページ読み込み時の処理
window.onload = function () {
  generateManagementNo();
  setDefaultDates();
  initStatusDot();
};

// 管理番号の自動生成
// 例: PT-260414-01 （PT + 年月日 + 連番）
function generateManagementNo() {
  const today = new Date();
  const y = String(today.getFullYear()).slice(2); // 下2桁
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const seq = "01"; // 本来はDBから取得するが今は仮で01
  const no = `PT-${y}${m}${d}-${seq}`;
  document.getElementById("managementNo").textContent = no;
}

// 製造期間のデフォルト日付をセット
// 納期が決まったら自動計算する予定。今は空のまま
function setDefaultDates() {
  // 納期が変わったら製造期間を自動計算
  document.getElementById("dueDate").addEventListener("change", function () {
    const dueDate = new Date(this.value);
    if (!this.value) return;

    // 簡易計算：納期の12稼働日前（仮：カレンダー日で約16日前※実際はカレンダー設定によって変わる）をデフォルトに
    const startDate = new Date(dueDate);
    startDate.setDate(startDate.getDate() - 16);

    // 納期の2稼働日前（仮：カレンダー日で約2日前※実際はカレンダー設定によって変わる）
    const endDate = new Date(dueDate);
    endDate.setDate(endDate.getDate() - 2);

    document.getElementById("mfgStart").value = formatDate(startDate);
    document.getElementById("mfgEnd").value = formatDate(endDate);
  });
}

// 日付をyyyy-mm-dd形式に変換
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 保存ボタン
function saveForm() {
  // 必須チェック
  const required = [
    { id: "productType", label: "試作/量産/トライ" },
    { id: "productName", label: "品名" },
    { id: "newOrRepeat", label: "新規/繰返/号口" },
    { id: "partNo", label: "品番" },
    { id: "quantity", label: "個数" },
    { id: "client", label: "客先" },
    { id: "requester", label: "依頼者" },
    { id: "status", label: "ステータス" },
    { id: "dueDate", label: "納期" },
  ];

  for (const field of required) {
    const el = document.getElementById(field.id);
    if (!el.value) {
      alert(`「${field.label}」を入力してください`);
      el.focus();
      return;
    }
  }

  //個数が正の整数か？確認
  const qty = document.getElementById("quantity").value;
  if (!/^\d+$/.test(qty) || parseInt(qty) <= 0) {
    alert("「個数」は正の整数を入力してください");
    document.getElementById("quantity").focus();
    return;
  }

  // データをオブジェクトにまとめる
  const data = {
    managementNo: document.getElementById("managementNo").textContent,
    productType: document.getElementById("productType").value,
    productName: document.getElementById("productName").value,
    newOrRepeat: document.getElementById("newOrRepeat").value,
    standardType: document.getElementById("standardType").value,
    partNo: document.getElementById("partNo").value,
    quantity: document.getElementById("quantity").value,
    client: document.getElementById("client").value,
    requester: document.getElementById("requester").value,
    designer: document.getElementById("designer").value,
    mfgContact: document.getElementById("mfgContact").value,
    mfgAnswer: document.getElementById("mfgAnswer").value,
    status: document.getElementById("status").value,
    dueDate: document.getElementById("dueDate").value,
    notes: document.getElementById("notes").value,
    mfgType: document.getElementById("mfgType").value,
    mfgStart: document.getElementById("mfgStart").value,
    mfgEnd: document.getElementById("mfgEnd").value,
    supplier: document.getElementById("supplier").value,
    supplierDueDate: document.getElementById("supplierDueDate").value,
  };

  // 今はコンソールに出力（後でAPIに送る）
  console.log("保存データ:", data);
  if (!confirm("保存しますか？")) return;
  alert("保存しました！（※今はまだ仮保存です）");

  // 一覧ページに戻る
  window.location.href = "index.html";
}

// キャンセル → 一覧に戻る
function goBack() {
  if (confirm("入力内容を破棄して一覧に戻りますか？")) {
    window.location.href = "index.html";
  }
}

// ===========================
// ステータス色ドットの初期化
// ステータスのプルダウンが変更されたら色ドットを更新する
// ===========================
function initStatusDot() {
  document.getElementById("status").addEventListener("change", function () {
    updateStatusDot(this.value); // 選択値を渡して色を更新
  });
}

// ステータスに対応する色ドットをセレクトの右に表示する
// 未選択またはマッピングにない値の場合はドットを非表示にする
function updateStatusDot(statusValue) {
  const dotEl = document.getElementById("statusDot"); // ドット要素を取得

  // 未選択 or マッピングにないステータスはドット非表示
  if (!statusValue || !STATUS_COLOR[statusValue]) {
    dotEl.style.display = "none";
    return;
  }

  // マッピングから色とラベルを取得して反映
  const { color, label } = STATUS_COLOR[statusValue];
  dotEl.style.display = "inline-block";
  dotEl.style.backgroundColor = color; // ドットの色をセット
  dotEl.title = label; // ホバー時にラベル（担当者名）を表示
}

// ===========================
// 製造時間テーブルの計算・表示
// 品名・製造種別・個数が変わるたびに再計算する
// ===========================

// 品名・製造種別・個数のいずれかが変わったら再計算
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("productName")
    .addEventListener("change", recalcMfgTable);
  document.getElementById("mfgType").addEventListener("change", recalcMfgTable);
  document.getElementById("quantity").addEventListener("input", recalcMfgTable);
});

// 製造時間テーブルを再計算して表示する
function recalcMfgTable() {
  const productName = document.getElementById("productName").value;
  const mfgType = document.getElementById("mfgType").value;
  const quantity = parseFloat(document.getElementById("quantity").value);

  // 品名・製造種別・個数がすべて揃ってないと計算しない
  if (!productName || !mfgType || !quantity || quantity <= 0) {
    document.getElementById("mfgPanel").style.display = "none";
    return;
  }

  // 品名に対応するマスタがない場合（メタル・ワッシャは未実装）
  const master = PROCESS_MASTER[productName];
  if (!master) {
    document.getElementById("mfgPanel").style.display = "none";
    return;
  }

  // 製造種別に対応する使用工程リストを取得
  const usedProcessNames = master.mfgTypes[mfgType];
  if (!usedProcessNames) {
    document.getElementById("mfgPanel").style.display = "none";
    return;
  }

  // 使用工程のみ抽出
  const usedProcesses = master.processes.filter((p) =>
    usedProcessNames.includes(p.name),
  );

  // 各工程の生産時間・段替時間を計算
  let totalProduction = 0;
  let totalSetup = 0;
  const rows = usedProcesses.map((p) => {
    // 生産数 = 個数 ÷ (1 - 不良率/100)
    const productionQty = quantity / (1 - p.defectRate / 100);
    // 生産時間(h) = 生産数 × MCT秒 ÷ 3600
    const productionTime = (productionQty * p.mct) / 3600;
    // 段替時間(h) = 1回当たり段替時間（固定）
    const setupTime = p.setupTime;
    // 計
    const total = productionTime + setupTime;

    totalProduction += productionTime;
    totalSetup += setupTime;

    return { name: p.name, productionTime, setupTime, total };
  });

  const totalTime = totalProduction + totalSetup;

  // テーブルのHTML生成
  const tbody = document.getElementById("mfgTableBody");
  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td>${r.name}</td>
      <td>${r.productionTime.toFixed(1)}</td>
      <td>${r.setupTime.toFixed(1)}</td>
      <td>${r.total.toFixed(1)}</td>
    </tr>
  `,
    )
    .join("");

  // 合計行・総製造時間を更新
  document.getElementById("totalProductionTime").textContent =
    totalProduction.toFixed(1);
  document.getElementById("totalSetupTime").textContent = totalSetup.toFixed(1);
  document.getElementById("totalTime").textContent = totalTime.toFixed(1);
  document.getElementById("totalMfgTime").textContent = totalTime.toFixed(1);

  // パネルを表示
  document.getElementById("mfgPanel").style.display = "block";
}
