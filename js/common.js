// ===========================
// common.js - 全ページ共通定義
// ===========================

// ステータスと色・担当のマッピング
// 赤=依頼者 / 青=設計者 / 緑=製造 / 黒=客先 / グレー=キャンセル
const STATUS_COLOR = {
  図面依頼済: { color: "#0f4ee2", label: "設計者" },
  見積依頼済: { color: "#1eb600", label: "製造" },
  設計中: { color: "#0f4ee2", label: "設計者" },
  見積図出済: { color: "#1eb600", label: "製造" },
  見積中: { color: "#1eb600", label: "製造" },
  見積済: { color: "#ff0101", label: "依頼者" },
  見積客先回答済: { color: "#1e1e1e", label: "客先" },
  "発注済(出図あり)": { color: "#0f4ee2", label: "設計者" },
  "発注済(出図なし)": { color: "#1eb600", label: "製造" },
  試作図出図済: { color: "#1eb600", label: "製造" },
  発送済: { color: "#1e1e1e", label: "客先" },
  キャンセル: { color: "#aaaaaa", label: "キャンセル" },
};

// ===========================
// 【仮データ】製造マスタ
// バックエンド実装後はAPIから取得に切り替える
// ※製造設定画面での入力値は現時点では反映されない
// ===========================
const PROCESS_MASTER = {
  ブシュ: {
    // 工程マスタ：MCT秒・不良率(%)・段替時間(h)
    processes: [
      { name: "シャー", mct: 2, defectRate: 15, setupTime: 0.3 },
      { name: "ハンドシャー", mct: 4, defectRate: 15, setupTime: 0.3 },
      { name: "レベラー", mct: 20.6, defectRate: 15, setupTime: 0.3 },
      { name: "切断プレス", mct: 20.6, defectRate: 15, setupTime: 0.3 },
      { name: "M/C 1面", mct: 29.7, defectRate: 15, setupTime: 1.5 },
      { name: "M/C 3面", mct: 63.1, defectRate: 15, setupTime: 0.08 },
      { name: "M/C 穴あけ", mct: 31.9, defectRate: 15, setupTime: 1.5 },
      { name: "M/C 溝", mct: 50, defectRate: 15, setupTime: 1.5 },
      { name: "面摺り", mct: 104.8, defectRate: 15, setupTime: 1.1 },
      { name: "U曲げ", mct: 14.2, defectRate: 15, setupTime: 0.3 },
      { name: "端曲げ", mct: 35, defectRate: 15, setupTime: 0.0 },
      { name: "ベンダー", mct: 57, defectRate: 15, setupTime: 0.3 },
      { name: "油圧プレス", mct: 38.9, defectRate: 15, setupTime: 0.3 },
      { name: "60tプレス", mct: 30, defectRate: 15, setupTime: 0.3 },
      { name: "サイジング", mct: 37.6, defectRate: 15, setupTime: 0.1 },
      { name: "面取り LA-712", mct: 50.1, defectRate: 15, setupTime: 1.0 },
      { name: "面取り LA-651", mct: 5.5, defectRate: 15, setupTime: 1.0 },
      { name: "油溜/油溝", mct: 5.5, defectRate: 15, setupTime: 1.0 },
      { name: "面取り LA-650", mct: 8, defectRate: 15, setupTime: 1.0 },
      { name: "拭取り", mct: 60, defectRate: 15, setupTime: 0.0 },
      { name: "バリ取り", mct: 2, defectRate: 15, setupTime: 0.0 },
      { name: "検査", mct: 45, defectRate: 15, setupTime: 0.5 },
      { name: "レイアウト", mct: 37, defectRate: 15, setupTime: 0.5 },
      { name: "レーザー", mct: 14, defectRate: 15, setupTime: 0.5 },
      { name: "梱包・出荷", mct: 77, defectRate: 15, setupTime: 0.0 },
    ],
    // 製造種別ごとの使用工程（✔が入っている工程名）
    mfgTypes: {
      "A プレーン(コイル)": [
        "ハンドシャー",
        "レベラー",
        "切断プレス",
        "U曲げ",
        "油圧プレス",
        "サイジング",
        "バリ取り",
        "検査",
        "レイアウト",
        "梱包・出荷",
      ],
      "B プレーン(端材)": [
        "シャー",
        "レベラー",
        "切断プレス",
        "U曲げ",
        "油圧プレス",
        "サイジング",
        "面取り LA-712",
        "バリ取り",
        "検査",
        "レイアウト",
        "梱包・出荷",
      ],
      "C プレーン(コイル)+M/C": [
        "ハンドシャー",
        "レベラー",
        "切断プレス",
        "M/C 溝",
        "U曲げ",
        "油圧プレス",
        "サイジング",
        "バリ取り",
        "検査",
        "レイアウト",
        "梱包・出荷",
      ],
    },
    workHours: {
      dailyHours: 7.5,
      excludeMorning: 15,
      exclude2s: 10,
      excludeSafety: 6.3,
      excludeQC: 6,
      excludeVacation: 22.5,
    },
  },
  // メタル・ワッシャは後で追加
};

// ===========================
// ログインユーザー表示・ログアウト
// ===========================

// ユーザー名を動的に表示
function renderUserInfo() {
  const userInfoEl = document.querySelector(".user-info");
  if (!userInfoEl) return;

  const stored = localStorage.getItem("protrack_login_user");
  if (!stored) {
    window.location.href = "login.html";
    return;
  }

  const user = JSON.parse(stored);
  userInfoEl.innerHTML = `
    👤 ${user.displayName}
    <a onclick="logout()">ログアウト</a>
  `;
}

function logout() {
  localStorage.removeItem("protrack_login_user");
  window.location.href = "login.html";
}

// ページ読み込み時に実行
document.addEventListener("DOMContentLoaded", renderUserInfo);
