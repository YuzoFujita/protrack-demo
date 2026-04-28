// ===========================
// register.js - ユーザー登録ページ
// ※仮実装 バックエンド実装後はAPIに切り替え
// ===========================

// 仮ユーザーデータ（login.jsと共有はしない・localStorageで管理）
function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const errorMsg = document.getElementById("errorMsg");

  // バリデーション
  if (!email || !password || !lastName || !firstName) {
    errorMsg.textContent = "すべての項目を入力してください";
    errorMsg.style.display = "block";
    return;
  }

  if (!email.includes("@")) {
    errorMsg.textContent = "メールアドレスの形式が正しくありません";
    errorMsg.style.display = "block";
    return;
  }

  if (password.length < 4) {
    errorMsg.textContent = "パスワードは4文字以上で入力してください";
    errorMsg.style.display = "block";
    return;
  }

  // 既存ユーザー確認
  const users = JSON.parse(localStorage.getItem("protrack_users") || "[]");
  const exists = users.find((u) => u.email === email);
  if (exists) {
    errorMsg.textContent = "このメールアドレスはすでに登録されています";
    errorMsg.style.display = "block";
    return;
  }

  // 登録
  users.push({
    email,
    password,
    displayName: `${lastName}　${firstName}`,
  });
  localStorage.setItem("protrack_users", JSON.stringify(users));

  alert(`${lastName}　${firstName}さんの登録が完了しました！`);
  window.location.href = "login.html";
}

function goToLogin() {
  window.location.href = "login.html";
}
