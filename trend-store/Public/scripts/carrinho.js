function carregarCarrinho() {
  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  const container = document.getElementById("itens-carrinho");
  container.innerHTML = "";
  let total = 0;

  if (carrinho.length === 0) {
    container.innerHTML = "<p style='margin: 40px auto;'>Seu carrinho está vazio.</p>";
    document.getElementById("total").innerText = "Total: R$ 0,00";
    return;
  }

  carrinho.forEach(prod => {
    let preco = 0;
    if (typeof prod.preco === "string") {
      preco = parseFloat(prod.preco.replace("R$", "").replace(",", "."));
    } else if (typeof prod.preco === "number") {
      preco = prod.preco;
    }

    const subtotal = preco * prod.quantidade;
    total += subtotal;

    const produtoHTML = `
      <div class="carrinho-produto">
        <img src="${prod.imagem}" alt="${prod.nome}">
        <h4>${prod.nome}</h4>
        <p>Tamanho: <strong>${prod.tamanho}</strong></p>
        <p>Quantidade: ${prod.quantidade}</p>
        <p>Subtotal: R$${subtotal.toFixed(2).replace(".", ",")}</p>
      </div>
    `;
    container.innerHTML += produtoHTML;
  });

  document.getElementById("total").innerText = "Total: R$ " + total.toFixed(2).replace(".", ",");
}

async function finalizarCompra() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  if (!usuario || !usuario.email) {
    alert("Você precisa estar logado para finalizar a compra.");
    return;
  }

  try {
    const res = await fetch("/api/finalizar-compra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: usuario.email, produtos: carrinho }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Compra finalizada com sucesso!");
      localStorage.removeItem("carrinho");
      location.reload();
    } else {
      alert(data.msg || "Erro ao finalizar a compra.");
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro ao finalizar a compra.");
  }
}

function limparCarrinho() {
  if (confirm("Deseja realmente limpar o carrinho?")) {
    localStorage.removeItem("carrinho");
    location.reload();
  }
}

document.addEventListener("DOMContentLoaded", carregarCarrinho);