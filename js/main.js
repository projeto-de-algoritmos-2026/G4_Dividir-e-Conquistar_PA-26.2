const tela = document.getElementById('tela');
const ceu = criarCeu(tela);

const el = {
  ficha: document.getElementById('ficha'),
  botaoRodada: document.getElementById('botao-rodada'),
  botaoNovo: document.getElementById('botao-novo'),
  ajusteEstrelas: document.getElementById('ajuste-estrelas'),
  valorEstrelas: document.getElementById('valor-estrelas'),
};

const estado = {
  semente: 0,
  quantidade: Number(el.ajusteEstrelas.value),
  campo: null,
};

// sorteia o número de catálogo de um céu novo
function novaSemente() {
  return 10000 + Math.floor(Math.random() * 90000);
}

// gera um céu a partir da semente e volta para o começo
function novoCeu(semente = novaSemente()) {
  estado.semente = semente;
  estado.campo = gerarCeu(semente, estado.quantidade, ceu.proporcaoUtil());
  ceu.definirCampo(estado.campo);
  atualizarFicha();
}

// escreve o número do céu e a contagem de estrelas no cabeçalho
function atualizarFicha() {
  el.ficha.textContent = `Céu nº ${estado.semente} · ${estado.quantidade} estrelas`;
}

// redesenha o céu a cada quadro de animação
function quadro(agora) {
  ceu.desenharFundo();
  ceu.desenharEstrelas(agora);
  requestAnimationFrame(quadro);
}

el.botaoNovo.addEventListener('click', () => novoCeu());

el.ajusteEstrelas.addEventListener('input', () => {
  el.valorEstrelas.textContent = el.ajusteEstrelas.value;
});

el.ajusteEstrelas.addEventListener('change', () => {
  estado.quantidade = Number(el.ajusteEstrelas.value);
  novoCeu(estado.semente);
});

new ResizeObserver(() => ceu.redimensionar()).observe(tela);

ceu.redimensionar();
novoCeu();
requestAnimationFrame(quadro);
