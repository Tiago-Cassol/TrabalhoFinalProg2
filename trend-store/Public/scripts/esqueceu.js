$(document).ready(function () {
  $("#loginForm").on("submit", async function (e) {
    e.preventDefault();

    const email = $("#email").val();

    if (!email) {
      alert("Por favor, preencha o email.");
      return;
    }

    try {
      const res = await fetch("/api/esqueceu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Enviamos seu e-mail.");
        window.location.href = "Login.html";
      } else {
        alert(data.msg || "Esse e-mail não existe.");
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      alert("Erro ao tentar encontrar e-mail.");
    }
  });
});