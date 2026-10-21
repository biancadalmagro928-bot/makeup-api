const URL_BASE = "https://makeup-api.herokuapp.com/api/v1/products";

const selMarca = document.getElementById("marca");
const selTipo = document.getElementById("tipo");
const lista = document.getElementById("lista");
const statusBox = document.getElementById("status");
const tituloLista = document.getElementById("tituloLista");
const detalhe = document.getElementById("detalhe");
const marcasBox = document.getElementById("marcasBox");

const FOTO_RESERVA = "data:image/svg+xml;utf8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='160'><rect width='100%' height='100%' fill='#f5eeeb'/><text x='50%' y='50%' font-size='14' fill='#8a7a76' text-anchor='middle'>sem imagem</text></svg>"
);

// a api as vezes manda link sem https ou com "//" no comeco
function arrumarLink(url) {
  if (!url) return "";
  if (url.startsWith("//")) return "https:" + url;
  return url.replace("http://", "https://");
}

// metodo 1: lista de produtos SEM filtro
async function buscarTodos() {
  statusBox.textContent = "Carregando produtos...";
  try {
    const resp = await fetch(URL_BASE + ".json");
    const dados = await resp.json();
    // a api devolve mais de 900 itens, entao mostro so os 40 primeiros
    // (varios ficam de fora porque a imagem deles nao existe mais)
    mostrarCards(dados.slice(0, 40));
    tituloLista.textContent = "Alguns produtos";
    statusBox.textContent = "";
  } catch (erro) {
    console.log(erro);
    statusBox.textContent = "Erro ao carregar os produtos. Tente de novo em alguns segundos.";
  }
}

// metodo 2: lista de produtos COM filtro (marca e/ou tipo)
async function buscarComFiltro(marca, tipo) {
  let url = URL_BASE + ".json?";
  if (marca) url += "brand=" + encodeURIComponent(marca) + "&";
  if (tipo) url += "product_type=" + tipo;

  statusBox.textContent = "Buscando...";
  try {
    const resp = await fetch(url);
    const dados = await resp.json();
    if (dados.length === 0) {
      lista.innerHTML = "";
      statusBox.textContent = "Nenhum produto encontrado com esse filtro.";
      return;
    }
    mostrarCards(dados);
    tituloLista.textContent = "Resultado da busca (" + dados.length + ")";
    statusBox.textContent = "";
  } catch (erro) {
    console.log(erro);
    statusBox.textContent = "Erro na busca.";
  }
}

// metodo 3: um unico produto pelo id (sem repeticao)
async function buscarProduto(id) {
  try {
    const resp = await fetch(URL_BASE + "/" + id + ".json");
    const p = await resp.json();
    mostrarDetalhe(p);
  } catch (erro) {
    console.log(erro);
    statusBox.textContent = "Nao consegui abrir esse produto.";
  }
}

// exibicao COM repeticao: um card para cada produto
function mostrarCards(produtos) {
  lista.innerHTML = "";

  produtos.forEach(function (p) {
    const card = document.createElement("div");
    card.className = "card";

    const preco = Number(p.price) > 0 ? "$ " + Number(p.price).toFixed(2) : "Preço indisponível";

    card.innerHTML =
      '<img src="' + arrumarLink(p.image_link) + '" alt="' + p.name + '">' +
      '<span class="marca">' + (p.brand || "") + "</span>" +
      "<h3>" + p.name + "</h3>" +
      '<span class="preco">' + preco + "</span>" +
      '<button data-id="' + p.id + '">Ver detalhes</button>';

    // se a imagem do produto nao existe mais, tiro o card da lista
    card.querySelector("img").onerror = function () {
      card.remove();
      if (lista.children.length === 0) {
        statusBox.textContent = "Nenhum produto com imagem disponível nessa busca.";
      }
    };
    card.querySelector("button").addEventListener("click", function () {
      buscarProduto(p.id);
    });

    lista.appendChild(card);
  });
}

// exibicao SEM repeticao: ficha de um produto so
function mostrarDetalhe(p) {
  const preco = Number(p.price) > 0 ? "$ " + Number(p.price).toFixed(2) : "indisponível";
  const descricao = p.description ? p.description.trim() : "Sem descrição.";
  const nota = p.rating ? p.rating + " / 5" : "sem avaliações";

  detalhe.innerHTML =
    '<img id="fotoDetalhe" src="' + arrumarLink(p.image_link) + '" alt="' + p.name + '">' +
    '<div class="info">' +
    "<h2>" + p.name + "</h2>" +
    "<p><strong>Marca:</strong> " + (p.brand || "-") + "</p>" +
    "<p><strong>Tipo:</strong> " + (p.product_type || "-") + "</p>" +
    "<p><strong>Preço:</strong> " + preco + "</p>" +
    "<p><strong>Avaliação:</strong> " + nota + "</p>" +
    "<p>" + descricao + "</p>" +
    "<strong>Cores:</strong>" +
    '<div class="cores" id="coresBox"></div>' +
    '<button class="fechar secundario" id="btnFechar">Fechar</button>' +
    "</div>";

  document.getElementById("fotoDetalhe").onerror = function () {
    this.src = FOTO_RESERVA;
  };

  const coresBox = document.getElementById("coresBox");
  if (p.product_colors && p.product_colors.length > 0) {
    p.product_colors.forEach(function (c) {
      const bolinha = document.createElement("span");
      bolinha.className = "cor";
      bolinha.style.background = c.hex_value;
      bolinha.title = c.colour_name || "";
      coresBox.appendChild(bolinha);
    });
  } else {
    coresBox.textContent = "Sem cores cadastradas.";
  }

  document.getElementById("btnFechar").addEventListener("click", function () {
    detalhe.classList.add("oculto");
  });

  detalhe.classList.remove("oculto");
  detalhe.scrollIntoView({ behavior: "smooth", block: "center" });
}

// chips de marcas: clicar faz a busca com filtro
function montarMarcas() {
  const marcas = ["maybelline", "covergirl", "revlon", "nyx", "colourpop", "dior", "clinique", "milani"];

  marcas.forEach(function (m) {
    const li = document.createElement("li");
    li.textContent = m;
    li.addEventListener("click", function () {
      selMarca.value = m;
      selTipo.value = "";
      buscarComFiltro(m, "");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    marcasBox.appendChild(li);
  });
}

document.getElementById("btnBuscar").addEventListener("click", function () {
  if (selMarca.value === "" && selTipo.value === "") {
    buscarTodos();
  } else {
    buscarComFiltro(selMarca.value, selTipo.value);
  }
});

document.getElementById("btnLimpar").addEventListener("click", function () {
  selMarca.value = "";
  selTipo.value = "";
  detalhe.classList.add("oculto");
  buscarTodos();
});

montarMarcas();
buscarTodos();
