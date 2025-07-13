$(document).ready(function () {
  $("#loginForm").on("submit", async function (e) {
    e.preventDefault();

    const email = $("#email").val();
    const senha = $("#senha").val();

    if (!email || !senha) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));
        alert("Login bem-sucedido!");
        window.location.href = "index.html";
      } else {
        alert(data.msg || "Credenciais inválidas.");
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      alert("Erro ao tentar fazer login.");
    }
  });
});