let produtos = [];

async function carregarProdutos() {
  try {
    const res = await fetch("/data/lista-produtos.json");
    if (!res.ok) throw new Error("Erro ao carregar produtos: " + res.status);
    produtos = await res.json();
    carregarPagina(1);
  } catch (err) {
    console.error("Falha ao carregar JSON:", err);
  }
}

function getIdUrl() {
  const url = new URLSearchParams(window.location.search);
  return parseInt(url.get("id"));
}

function formatarPreco(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

function carregarPagina(pagina = 1) {
  const produtosPorPagina = 8;
  const inicio = (pagina - 1) * produtosPorPagina;
  const fim = inicio + produtosPorPagina;
  const $container = $("#lista-produtos").empty();
  const produtosPagina = produtos.slice(inicio, fim);

  produtosPagina.forEach(prod => {
  let html = `
    <div class="col-4 produto-card">
      <a href="detalhes-do-produto.html?id=${prod.id}">
        <img src="${prod.imagem}" alt="${prod.nome}" />
        <h4>${prod.nome}</h4>
        <p>${formatarPreco(prod.preco)}</p>
      </a>
  `;

  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (usuario && usuario.admin) {
    html += `
      <button class="btn-editar" data-id="${prod.id}">Editar</button>
      <button class="btn-excluir" data-id="${prod.id}">Excluir</button>
    `;
  }

  html += `</div>`; 
  $container.append(html);
});

  atualizarBotoesPaginacao(pagina);
}

function atualizarBotoesPaginacao(paginaAtual) {
  const totalPaginas = Math.ceil(produtos.length / 8);
  const $paginacao = $("#pagination").empty();

  for (let i = 1; i <= totalPaginas; i++) {
    const active = i === paginaAtual ? "active" : "";
    $paginacao.append(`<span data-page="${i}" class="${active}">${i}</span>`);
  }
  $paginacao.append(`<span id="next-page">&#8594;</span>`);

  $paginacao.find("span[data-page]").click(function () {
    const pagina = parseInt($(this).data("page"));
    carregarPagina(pagina);
  });

  $("#next-page").click(function () {
    if (paginaAtual < totalPaginas) carregarPagina(paginaAtual + 1);
  });
}

function loadProduct() {
  const id = getIdUrl();
  const product = produtos.find(p => p.id === id);

  if (!product) {
    $(".single-product").html("<p>Produto não encontrado.</p>");
    return;
  }

 $("h1").text(product.nome);
 $("h4").text(formatarPreco(product.preco));
 $("h3 + br + p").text(product.descricao);
 $("#productImg").attr("src", product.galeria[0]);

  const $miniaturas = $("#icons").empty();
  product.galeria.forEach(src => {
    const $img = $(`<img src="${src}" class="small-img" style="width:100%;">`);
    $img.click(() => $("#productImg").attr("src", src));
    $miniaturas.append($("<div>").addClass("small-img-col").append($img));
  });
  
  const relacionados = produtos.filter(p => p.id !== product.id).slice(0, 4);
  const $relacionados = $("<div>").addClass("row");

  relacionados.forEach(p => {
    $relacionados.append(`
      <div class="col-4">
        <a href="detalhes-do-produto.html?id=${p.id}">
          <img src="${p.imagem}" alt="${p.nome}" />
          <h4>${p.nome}</h4>
          <p>${formatarPreco(p.preco)}</p>
        </a>
      </div>
    `);
  });

  $(".small-container").last().append($relacionados);
}

function abrirModal() {
  document.getElementById("modalProduto").style.display = "block";
}
function fecharModal() {
  document.getElementById("modalProduto").style.display = "none";
}
async function salvarProduto() {
  const nome = document.getElementById("novoNome").value;
  const preco = parseFloat(document.getElementById("novoPreco").value);
  const descricao = document.getElementById("novoDescricao").value;
  const imagem = document.getElementById("novoImagem").files;

  if (!nome || isNaN(preco) || !imagem || !descricao) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  const formData = new FormData();
  formData.append("nome", nome);
  formData.append("preco", preco);
  formData.append("descricao", descricao);
  for (let i = 0; i < imagens.length; i++) {
  formData.append("imagens", imagens[i]);
}

  try {
    const res = await fetch("/api/admin/produtos", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      alert("Produto adicionado com sucesso!");
      fecharModal();
      await carregarProdutos(); // Atualiza lista
    } else {
      alert("Erro: " + data.msg);
    }
  } catch (err) {
    console.error("Erro ao adicionar produto:", err);
    alert("Erro ao enviar produto.");
  }
}

async function adicionarAoCarrinho() {
  if (!produtos || produtos.length === 0) {
    await carregarProdutos(); // reforço extra
  }

  const id = getIdUrl();
  const product = produtos.find(p => p.id === id);
  const quantidade = parseInt($("input[type=number]").val()) || 1;
  const tamanho = $("select").val();

  if (!product || tamanho === "Escolha o tamanho") {
    alert("Escolha um tamanho válido.");
    return;
  }

  const item = {
    id: product.id,
    nome: product.nome,
    preco: typeof product.preco === "number" ? `R$ ${product.preco.toFixed(2).replace(".", ",")}` : product.preco,
    imagem: product.imagem,
    quantidade,
    tamanho
  };

  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  const existente = carrinho.find(p => p.id === item.id && p.tamanho === item.tamanho);

  if (existente) existente.quantidade += quantidade;
  else carrinho.push(item);

  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  window.location.href = "carrinho.html";
}

function carregarComentarios() {
  const idProduto = getIdUrl();
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  $.get(`/api/comentarios/${idProduto}`, function (comentarios) {
    const $container = $("#comentarios-lista").empty();

    if (!comentarios || comentarios.length === 0) {
      $container.html("<p>Seja o primeiro a comentar!</p>");
      return;
    }

    comentarios.forEach(c => {
      const html = `
        <div class="comentario-card">
          <p class="nome">${c.nomeUsuario} em ${new Date(c.data).toLocaleString()}</p>
          <p class="nota">Nota: ${"★".repeat(c.nota || 0)}${"☆".repeat(5 - (c.nota || 0))}</p>
          <p class="texto">${c.texto}</p>
        </div>
      `;
      $container.append(html);
    });

    if (
      usuario &&
      comentarios.some(c => c.cpfUsuario.trim() === usuario.cpf.trim())
    ) {
      $("#form-comentario").hide();
    } else {
      $("#form-comentario").show();
    }
  });
}
function enviarComentario(e) {
  e.preventDefault(); 
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const texto = $("#comentarioTexto").val().trim();
  const nota = parseInt($("#comentarioNota").val());
  const idProduto = getIdUrl();

  if (!usuario || !usuario.nome) {
    alert("Você precisa estar logado para comentar.");
    return;
  }
  if (!texto) {
    alert("Digite um comentário.");
    return;
  }
  if (!nota || nota < 1 || nota > 5) {
    alert("Selecione uma nota entre 1 e 5.");
    return;
  }

  $.ajax({
    url: "/api/comentarios",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      idProduto,
      nomeUsuario: usuario.nome,
      cpfUsuario: usuario.cpf,
      texto,
      nota
    }),
    success: () => {
      console.log("Comentário enviado com sucesso!");
      $("#comentarioTexto").val("");
      $("#comentarioNota").val("");
      carregarComentarios(); 
    },
    error: err => {
      console.error("Erro ao comentar:", err);
      alert("Erro ao comentar.");
    }
  });
}

$(document).ready(async function () {
  await carregarProdutos();

  if ($("#lista-produtos").length) carregarPagina(1);

  if (window.location.pathname.includes("detalhes-do-produto.html")) {
    loadProduct();
    carregarComentarios();

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuario) $("#form-comentario").hide();

    $("#btnEnviarComentario").click(enviarComentario);
}

  $("#filtro-produtos").change(function () {
  const valor = $(this).val();

  if (valor === "baixo") {
    produtos.sort((a, b) => a.preco - b.preco);
  } else if (valor === "alto") {
    produtos.sort((a, b) => b.preco - a.preco);
  }

  carregarPagina(1);
});

  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (usuario && usuario.admin) {
    $("#btnAdicionarProduto").css("display", "inline-block").click(abrirModal);
  }
});

$(document).on("click", ".btn-excluir", async function () {
  const id = $(this).data("id");
  
  if (confirm("Tem certeza que deseja excluir este produto?")) {
    try {
      const res = await fetch(`/api/admin/produtos/${id}`, { method: "DELETE" });
      
      if (!res.ok) {
        const erroTexto = await res.text();
        console.error("Erro ao excluir:", erroTexto);
        alert("Erro ao excluir produto.");
        return;
      }

      const data = await res.json();
      alert(data.msg);
      await carregarProdutos();
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
      alert("Erro ao excluir produto.");
    }
  }
});

$(document).on("click", ".btn-editar", function () {
  const id = $(this).data("id");
  const produto = produtos.find(p => p.id === id);

  if (!produto) {
    alert("Produto não encontrado.");
    return;
  }

  $("#novoNome").val(produto.nome);
  $("#novoPreco").val(produto.preco);
  $("#novoDescricao").val(produto.descricao);
  $("#modalProduto").show();

  $("#btnSalvarProduto").off("click").click(async function () {
    const formData = new FormData();
    formData.append("nome", $("#novoNome").val());
    formData.append("preco", $("#novoPreco").val());
    formData.append("descricao", $("#novoDescricao").val());
    const imagens = $("#novoImagem")[0].files;
    for (let i = 0; i < imagens.length; i++) {
      formData.append("imagens", imagens[i]);
    }

    try {
      const res = await fetch(`/api/admin/produtos/${id}`, {
        method: "PUT",
        body: formData
      });
      const data = await res.json();
      alert(data.msg);
      $("#modalProduto").hide();
      await carregarProdutos();
    } catch (err) {
      console.error("Erro ao editar produto:", err);
      alert("Erro ao editar produto.");
    }
  });
});
