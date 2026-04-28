// ===========================
// login.js - ログインページ
// ※仮認証 バックエンド実装後はAPIに切り替え
// ===========================

// 仮の初期ユーザー（初回起動時にlocalStorageに登録）
const INITIAL_USERS = [
  {
    email: "admin@example.com",
    password: "password",
    displayName: "管理者",
  },
];

window.onload = function () {
  // 初回のみ初期ユーザーをlocalStorageに登録
  const users = JSON.parse(localStorage.getItem("protrack_users") || "[]");
  if (users.length === 0) {
    localStorage.setItem("protrack_users", JSON.stringify(INITIAL_USERS));
  }
};

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMsg");

  if (!email || !password) {
    errorMsg.textContent = "メールアドレスとパスワードを入力してください";
    errorMsg.style.display = "block";
    return;
  }

  const users = JSON.parse(localStorage.getItem("protrack_users") || "[]");
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    errorMsg.textContent = "メールアドレスまたはパスワードが違います";
    errorMsg.style.display = "block";
    return;
  }

  // ログイン成功 → ユーザー情報を保存して案件一覧へ
  localStorage.setItem(
    "protrack_login_user",
    JSON.stringify({
      email: user.email,
      displayName: user.displayName,
    }),
  );

  window.location.href = "index.html";
}

function goToRegister() {
  window.location.href = "register.html";
}
