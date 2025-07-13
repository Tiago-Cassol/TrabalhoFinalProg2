document.getElementById("cadastroForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const nome = document.getElementById("nome").value;
  const aniversario = document.getElementById("aniversario").value;
  const cpf = document.getElementById("cpf").value;

  const res = await fetch("/api/cadastrar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha, nome, aniversario, cpf }),
  });

  const data = await res.json();

  if (res.ok) {
    alert("Cadastro realizado com sucesso!");
    window.location.href = "Login.html";
  } else {
    alert(data.msg);
  }
});