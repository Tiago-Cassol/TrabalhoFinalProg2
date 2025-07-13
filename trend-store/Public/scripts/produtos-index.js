function carregarProdutos() {
  fetch('/data/lista-produtos.json')
    .then(res => res.json())
    .then(produtos => {
      const destaque = document.getElementById('produtos-destaque');
      const recentes = document.getElementById('produtos-recentes');

      produtos.forEach((produto, index) => {
        const precoNumerico = parseFloat(produto.preco) || 0;
        const produtoHTML = `
          <div class="col-4">
            <a href="detalhes-do-produto.html?id=${produto.id}">
              <img src="${produto.imagem}" alt="${produto.nome}">
              <h4>${produto.nome}</h4>
              <p>R$${precoNumerico.toFixed(2).replace('.', ',')}</p>
            </a>
          </div>`;

        if (index < 4) {
          destaque.innerHTML += produtoHTML;
        } else {
          recentes.innerHTML += produtoHTML;
        }
      });
    })
    .catch(err => console.error('Erro ao carregar produtos:', err));
}


function carregarProdutosRecentes(produtos) {
  const container = document.querySelector(".produtos-recentes");

  let html = '';
  for (let i = 0; i < produtos.length; i++) {
    const produto = produtos[i];
    if (i % 4 === 0) html += '<div class="row">';
    html += `
      <div class="col-4">
        <img src="${produto.imagem}" alt="${produto.nome}" />
        <h4>${produto.nome}</h4>
        <p>R$${parseFloat(produto.preco).toFixed(2).replace('.', ',')}</p>
      </div>
    `;
    if (i % 4 === 3 || i === produtos.length - 1) html += '</div>';
  }

  container.insertAdjacentHTML("beforeend", html);
}

document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();

  const compreJa = document.getElementById('compre-ja');
  if (compreJa) {
    compreJa.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = 'detalhes-do-produto.html?id=5';
    });
  }
});