const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("Public"));
app.use('/data', express.static(path.join(__dirname, 'data')));

const usuariosPath = path.join(__dirname, "data", "usuarios.json");
const pedidosPath = path.join(__dirname, "data", "pedidos.json");

const multer = require("multer");
const uploadDir = path.join(__dirname, "Public", "images"); 

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname;
    cb(null, unique);
  }
});

const upload = multer({ storage });

const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10; 

app.post("/api/cadastrar", async (req, res) => {
  const { email, senha, nome, aniversario, cpf } = req.body;

  if (!email || !senha || !nome || !aniversario || !cpf) {
    return res.status(400).json({ msg: "Todos os campos são obrigatórios" });
  }

  const usuarios = JSON.parse(fs.readFileSync(usuariosPath, "utf-8"));
  const existente = usuarios.find(u => u.email === email);

  if (existente) {
    return res.status(409).json({ msg: "Usuário já existe" });
  }

  try {
    const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

    usuarios.push({ email, senha: hashedPassword, nome, aniversario, cpf });
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));
    res.json({ msg: "Usuário cadastrado com sucesso" });

  } catch (err) {
    console.error("Erro ao hashear a senha:", err);
    res.status(500).json({ msg: "Erro interno no servidor" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;
  const usuarios = JSON.parse(fs.readFileSync(usuariosPath, "utf-8"));
  const usuario = usuarios.find(u => u.email === email);

  if (!usuario) {
    return res.status(401).json({ msg: "Credenciais inválidas" });
  }

  try {
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ msg: "Credenciais inválidas" });
    }

    const { senha: _, ...usuarioSemSenha } = usuario;
    res.json({ usuario: usuarioSemSenha });

  } catch (err) {
    console.error("Erro ao verificar a senha:", err);
    res.status(500).json({ msg: "Erro interno no servidor" });
  }
});

app.post("/api/esqueceu", (req, res) => {
  const { email } = req.body;
  const usuarios = JSON.parse(fs.readFileSync(usuariosPath, "utf-8"));
  const usuario = usuarios.find(u => u.email === email);

  if (!usuario) {
    return res.status(401).json({ msg: "E-mail não existe" });
  }
  else{
    res.json({ msg: "E-mail enviado com sucesso" });
  }
});
app.post("/api/admin/produtos", upload.array("imagens"), (req, res) => {
  const { nome, preco, descricao } = req.body;
  const imagem = req.file?.filename;
  const produtosPath = path.join(__dirname, "data", "lista-produtos.json");
  const arquivos = req.files;
  const galeria = arquivos.map(file => `/images/${file.filename}`);

  if (!nome || !preco || !descricao || arquivos.length === 0) {
    return res.status(400).json({ msg: "Dados incompletos." });
  }

  const produtos = fs.existsSync(produtosPath) ? JSON.parse(fs.readFileSync(produtosPath, "utf-8")) : [];
  const maxId = produtos.reduce((max, p) => (p.id > max ? p.id : max), 0);
  const novoProduto = {
    id: maxId + 1,
    nome,
    preco: parseFloat(preco),
    descricao,
    imagem: galeria[0] ,
    galeria: [`/images/${imagem}`]
  };

  produtos.push(novoProduto);
  fs.writeFileSync(produtosPath, JSON.stringify(produtos, null, 2));
  res.json({ msg: "Produto adicionado com sucesso!" });
});

app.put("/api/admin/produtos/:id", upload.array("imagens"), (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, preco, descricao } = req.body;
  const arquivos = req.files;
  const galeria = arquivos.map(file => `/images/${file.filename}`);

  const produtosPath = path.join(__dirname, "data", "lista-produtos.json");
  const produtos = JSON.parse(fs.readFileSync(produtosPath, "utf-8"));
  const produtoIndex = produtos.findIndex(p => p.id === id);

  if (produtoIndex === -1) {
    return res.status(404).json({ msg: "Produto não encontrado" });
  }

  produtos[produtoIndex].nome = nome || produtos[produtoIndex].nome;
  produtos[produtoIndex].preco = preco ? parseFloat(preco) : produtos[produtoIndex].preco;
  produtos[produtoIndex].descricao = descricao || produtos[produtoIndex].descricao;
  if (galeria.length > 0) produtos[produtoIndex].galeria = galeria;

  fs.writeFileSync(produtosPath, JSON.stringify(produtos, null, 2));
  res.json({ msg: "Produto atualizado com sucesso" });
});

app.delete("/api/admin/produtos/:id", (req, res) => {
  const id = parseInt(req.params.id);

  const produtosPath = path.join(__dirname, "data", "lista-produtos.json");
  const produtos = JSON.parse(fs.readFileSync(produtosPath, "utf-8"));
  const novoArray = produtos.filter(p => p.id !== id);

  if (novoArray.length === produtos.length) {
    return res.status(404).json({ msg: "Produto não encontrado" });
  }

  fs.writeFileSync(produtosPath, JSON.stringify(novoArray, null, 2));
  res.json({ msg: "Produto excluído com sucesso" });
});

app.post("/api/finalizar-compra", (req, res) => {
  const { email, produtos } = req.body;

  if (!email || !Array.isArray(produtos)) {
    return res.status(400).json({ msg: "Dados inválidos para finalização da compra" });
  }

  const pedidos = fs.existsSync(pedidosPath) ? JSON.parse(fs.readFileSync(pedidosPath, "utf-8")) : [];
  const novoPedido = {
    email,
    produtos,
    data: new Date().toISOString()
  };

  pedidos.push(novoPedido);

  fs.writeFileSync(pedidosPath, JSON.stringify(pedidos, null, 2));
  res.json({ msg: "Compra finalizada e salva com sucesso" });
});

app.get("/api/compras", (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ msg: "Email não fornecido" });
  }

  const pedidos = fs.existsSync(pedidosPath) ? JSON.parse(fs.readFileSync(pedidosPath, "utf-8")) : [];
  const comprasDoUsuario = pedidos.filter(p => p.email === email);
  res.json(comprasDoUsuario);
});

const comentariosPath = path.join(__dirname, "data", "comentarios.json");

app.get("/api/comentarios/:idProduto", (req, res) => {
  const idProduto = parseInt(req.params.idProduto);
  const comentarios = fs.existsSync(comentariosPath) ? JSON.parse(fs.readFileSync(comentariosPath, "utf-8")) : [];
  const filtrados = comentarios.filter(c => c.idProduto === idProduto);
  res.json(filtrados);
});

app.post("/api/comentarios", (req, res) => {
  const { idProduto, nomeUsuario, cpfUsuario, texto, nota } = req.body;

  if (!idProduto || !nomeUsuario || !cpfUsuario || !texto || !nota) {
    return res.status(400).json({ msg: "Dados incompletos" });
  }

  const comentarios = fs.existsSync(comentariosPath) ? JSON.parse(fs.readFileSync(comentariosPath, "utf-8")) : [];

  const novoComentario = {
    idProduto,
    nomeUsuario,
    texto,
    nota,
    data: new Date().toISOString()
  };

  comentarios.push(novoComentario);
  fs.writeFileSync(comentariosPath, JSON.stringify(comentarios, null, 2));
  res.json({ msg: "Comentário salvo com sucesso" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
