const tela = document.getElementById('tela');
const ceu = criarCeu(tela);

const el = {
  ficha: document.getElementById('ficha'),
  botaoRodada: document.getElementById('botao-rodada'),
  botaoNovo: document.getElementById('botao-novo'),
  ajusteEstrelas: document.getElementById('ajuste-estrelas'),
  valorEstrelas: document.getElementById('valor-estrelas'),
  vistas: {
    intro: document.getElementById('vista-intro'),
    explicacao: document.getElementById('vista-explicacao'),
    diario: document.getElementById('vista-diario'),
  },
  resumo: document.getElementById('diario-resumo'),
  aviso: document.getElementById('diario-aviso'),
  diario: document.getElementById('diario'),
};

const explicador = criarExplicador(
  ceu,
  {
    titulo: document.getElementById('explicacao-titulo'),
    texto: document.getElementById('explicacao-texto'),
    contador: document.getElementById('explicacao-contador'),
    barra: document.getElementById('explicacao-barra'),
    niveis: document.getElementById('explicacao-niveis'),
    calculadas: document.getElementById('explicacao-calculadas'),
    forcaBruta: document.getElementById('explicacao-forca'),
    anterior: document.getElementById('explicacao-anterior'),
    proximo: document.getElementById('explicacao-proximo'),
    reproduzir: document.getElementById('explicacao-reproduzir'),
    pular: document.getElementById('explicacao-pular'),
  },
  (par, comparacoes) => aplicarRodada(par, comparacoes),
);

const estado = {
  semente: 0,
  quantidade: Number(el.ajusteEstrelas.value),
  campo: null,
  grupos: [],
  linhas: [],
  efeitos: [],
  diario: [],
  rodada: 0,
};

// formata um número com casas decimais no padrão brasileiro
function formatar(valor, casas = 0) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

// formata uma distância em graus
function graus(valor) {
  return `${formatar(valor, 2)}°`;
}

// sorteia o número de catálogo de um céu novo
function novaSemente() {
  return 10000 + Math.floor(Math.random() * 90000);
}

// gera um céu a partir da semente e volta para a rodada zero
function novoCeu(semente = novaSemente()) {
  explicador.cancelar();
  estado.semente = semente;
  estado.campo = gerarCeu(semente, estado.quantidade, ceu.proporcaoUtil());
  ceu.definirCampo(estado.campo);
  estado.grupos = criarGrupos(estado.campo.estrelas);
  estado.linhas = [];
  estado.efeitos = [];
  estado.diario = [];
  estado.rodada = 0;
  el.aviso.hidden = true;
  mostrarVista('intro');
  atualizarFicha();
  atualizarBotoes();
}

// executa uma rodada e informa se ela conseguiu ligar um par, explicando a primeira
function proximaRodada() {
  if (estado.grupos.length < 2 || explicador.ativo()) return false;
  if (estado.rodada === 0) {
    explicador.iniciar(estado.grupos);
    mostrarVista('explicacao');
    atualizarBotoes();
    return false;
  }
  let comparacoes = 0;
  const par = parMaisProximo(estado.grupos, (evento) => {
    if (evento.comparacoes) comparacoes += evento.comparacoes.length;
  });
  return aplicarRodada(par, comparacoes);
}

// liga as estrelas do par encontrado e troca os dois grupos pelo centróide deles
function aplicarRodada(par, comparacoes) {
  mostrarVista('diario');
  const agora = performance.now();
  const { a: p, b: q, distancia: medida } = par;
  const forcaBruta = (estado.grupos.length * (estado.grupos.length - 1)) / 2;
  const ligacao = estrelasMaisProximas(p.membros, q.membros);
  const { pontos, novo } = fundirGrupos(estado.grupos, p, q);

  estado.grupos = pontos;
  estado.rodada++;
  estado.linhas.push({ a: ligacao.a, b: ligacao.b, nascimento: agora + 350 });
  estado.efeitos.push({ p: { x: p.x, y: p.y }, q: { x: q.x, y: q.y }, novo: { x: novo.x, y: novo.y }, medida, inicio: agora });
  estado.diario.unshift({ rodada: estado.rodada, ligacao, medida, comparacoes, forcaBruta });
  estado.diario.length = Math.min(estado.diario.length, 200);

  if (estado.grupos.length === 1) {
    el.aviso.textContent = `Todas as ${estado.quantidade} estrelas estão ligadas em uma única constelação, depois de ${estado.rodada} rodadas.`;
    el.aviso.hidden = false;
  }
  atualizarFicha();
  renderizarDiario();
  atualizarBotoes();
  return true;
}

// escreve o número do céu, a contagem de estrelas e o andamento no cabeçalho
function atualizarFicha() {
  const pontos = estado.grupos.length;
  el.ficha.textContent = `Céu nº ${estado.semente} · ${estado.quantidade} estrelas · rodada ${estado.rodada} · ${pontos} ${pontos === 1 ? 'ponto' : 'pontos'} na lista`;
}

// liga e desliga os botões de acordo com o momento do jogo
function atualizarBotoes() {
  const explicando = explicador.ativo();
  el.botaoRodada.disabled = explicando || estado.grupos.length < 2;
  el.botaoRodada.textContent = explicando ? 'Explicando a 1ª rodada' : 'Próxima rodada';
}

// mostra apenas a vista escolhida do painel lateral
function mostrarVista(nome) {
  for (const [chave, vista] of Object.entries(el.vistas)) vista.hidden = chave !== nome;
}

// reescreve a lista de rodadas do painel
function renderizarDiario() {
  const pontos = estado.grupos.length;
  el.resumo.textContent = `${pontos} ${pontos === 1 ? 'ponto' : 'pontos'} na lista · ${estado.linhas.length} linhas no céu`;
  el.diario.replaceChildren(
    ...estado.diario.map((entrada) => {
      const item = document.createElement('li');
      const numero = document.createElement('span');
      numero.className = 'num';
      numero.textContent = entrada.rodada;
      const corpo = document.createElement('div');
      const par = document.createElement('span');
      par.className = 'par';
      par.textContent = `${entrada.ligacao.a.nome} – ${entrada.ligacao.b.nome}`;
      const detalhe = document.createElement('span');
      detalhe.className = 'detalhe';
      detalhe.textContent = `${formatar(entrada.comparacoes)} ${entrada.comparacoes === 1 ? 'distância' : 'distâncias'} · força bruta ${formatar(entrada.forcaBruta)}`;
      corpo.append(par, detalhe);
      const medida = document.createElement('span');
      medida.className = 'dist';
      medida.textContent = graus(entrada.medida);
      item.append(numero, corpo, medida);
      return item;
    }),
  );
}

// desenha o destaque passageiro do par escolhido em cada rodada
function desenharEfeitos(agora) {
  const ctx = ceu.ctx;
  const dpr = ceu.dpr;
  const duracao = 1800;
  estado.efeitos = estado.efeitos.filter((e) => agora - e.inicio < duracao);

  ctx.save();
  for (const efeito of estado.efeitos) {
    const t = Math.max(0, (agora - efeito.inicio) / duracao);
    const alfa = 1 - t;
    const p = ceu.paraTela(efeito.p);
    const q = ceu.paraTela(efeito.q);
    const c = ceu.paraTela(efeito.novo);

    ctx.strokeStyle = `rgba(111, 224, 207, ${0.75 * alfa})`;
    ctx.lineWidth = dpr;
    ctx.setLineDash([3 * dpr, 4 * dpr]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const ponto of [p, q]) {
      ctx.beginPath();
      ctx.arc(ponto.x, ponto.y, (8 + 18 * t) * dpr, 0, Math.PI * 2);
      ctx.stroke();
    }

    const braco = 5 * dpr;
    ctx.beginPath();
    ctx.moveTo(c.x - braco, c.y);
    ctx.lineTo(c.x + braco, c.y);
    ctx.moveTo(c.x, c.y - braco);
    ctx.lineTo(c.x, c.y + braco);
    ctx.stroke();

    ctx.fillStyle = `rgba(111, 224, 207, ${alfa})`;
    ctx.font = `${11 * dpr}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(graus(efeito.medida), (p.x + q.x) / 2, Math.min(p.y, q.y) - 12 * dpr);
  }
  ctx.restore();
}

// redesenha o céu a cada quadro de animação
function quadro(agora) {
  ceu.desenharFundo();
  ceu.desenharLinhas(estado.linhas, agora);
  ceu.desenharEstrelas(agora);
  ceu.desenharLetras(estado.grupos);
  desenharEfeitos(agora);
  explicador.desenhar(agora);
  requestAnimationFrame(quadro);
}

el.botaoRodada.addEventListener('click', () => proximaRodada());
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
