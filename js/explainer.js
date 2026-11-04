const DURACAO_DO_PASSO = 750;
const INTERVALO_DE_REPRODUCAO = 1100;
const COR_ESQUERDA = '127, 168, 255';
const COR_DIREITA = '255, 173, 120';
const COR_FAIXA = '111, 224, 207';
const COR_MELHOR = '246, 228, 186';
const COR_COMPARACAO = '220, 226, 245';

// cria o explicador que mostra passo a passo a primeira busca pelo par mais próximo
function criarExplicador(ceu, el, aoConcluir) {
  const ctx = ceu.ctx;
  let passos = [];
  let indice = 0;
  let inicioDoPasso = 0;
  let ativo = false;
  let reproducao = null;
  let resultado = null;
  let totalDeEstrelas = 0;

  // roda o algoritmo guardando cada evento como um passo da explicação
  function iniciar(grupos) {
    totalDeEstrelas = grupos.length;
    passos = [{ tipo: 'inicio', pontos: grupos, profundidade: 0, acumulado: 0 }];
    let acumulado = 0;
    resultado = parMaisProximo(grupos, (evento) => {
      if (evento.comparacoes) acumulado += evento.comparacoes.length;
      passos.push({ ...evento, acumulado });
    });
    passos.push({ tipo: 'resultado', pontos: grupos, profundidade: 0, melhor: resultado, acumulado });

    const profundidadeMaxima = Math.max(...passos.map((p) => p.profundidade));
    el.niveis.replaceChildren(...Array.from({ length: profundidadeMaxima + 1 }, () => document.createElement('span')));
    el.forcaBruta.textContent = formatar((totalDeEstrelas * (totalDeEstrelas - 1)) / 2);
    ativo = true;
    irPara(0);
  }

  // abre o passo de número dado e atualiza o painel
  function irPara(novoIndice) {
    indice = limitar(novoIndice, 0, passos.length - 1);
    inicioDoPasso = performance.now();
    const passo = passos[indice];
    const { titulo, texto } = descrever(passo);
    const ultimo = indice === passos.length - 1;

    el.titulo.textContent = titulo;
    el.texto.innerHTML = texto;
    el.contador.textContent = `Passo ${indice + 1} de ${passos.length}`;
    el.barra.style.width = `${(indice / (passos.length - 1)) * 100}%`;
    el.calculadas.textContent = formatar(passo.acumulado);
    [...el.niveis.children].forEach((ponto, nivel) => {
      ponto.classList.toggle('ativo', passo.tipo !== 'inicio' && passo.tipo !== 'resultado' && nivel <= passo.profundidade);
    });

    el.anterior.disabled = indice === 0;
    el.proximo.textContent = ultimo ? 'Ligar as estrelas' : 'Próximo passo';
    el.pular.disabled = ultimo;
    if (ultimo) pausar();
  }

  // avança um passo ou conclui a rodada quando já está no último
  function avancar() {
    if (indice === passos.length - 1) concluir();
    else irPara(indice + 1);
  }

  // inicia ou interrompe o avanço automático dos passos
  function alternarReproducao() {
    if (reproducao) {
      pausar();
      return;
    }
    if (indice === passos.length - 1) return;
    reproducao = setInterval(() => irPara(indice + 1), INTERVALO_DE_REPRODUCAO);
    el.reproduzir.textContent = 'Pausar';
    el.reproduzir.setAttribute('aria-pressed', 'true');
  }

  // interrompe o avanço automático
  function pausar() {
    clearInterval(reproducao);
    reproducao = null;
    el.reproduzir.textContent = 'Reproduzir';
    el.reproduzir.setAttribute('aria-pressed', 'false');
  }

  // encerra a explicação e entrega o par encontrado para a rodada
  function concluir() {
    pausar();
    ativo = false;
    aoConcluir(resultado, passos[passos.length - 1].acumulado);
  }

  // abandona a explicação sem aplicar a rodada
  function cancelar() {
    pausar();
    ativo = false;
  }

  // dá o nome que aparece no texto para um ponto da primeira rodada
  function nomeDe(ponto) {
    return ponto.membros[0].nome;
  }

  // monta o título e o texto do painel para cada tipo de passo
  function descrever(passo) {
    if (passo.tipo === 'inicio') {
      const pares = formatar((totalDeEstrelas * (totalDeEstrelas - 1)) / 2);
      return {
        titulo: 'A primeira rodada, passo a passo',
        texto: `<p>O céu tem <strong>${totalDeEstrelas} estrelas</strong>. Comparar todas com todas exigiria ${pares} cálculos de distância.</p>
          <p>O algoritmo ordena as estrelas uma vez por x (as marcas na base) e uma vez por y (as marcas à esquerda). Depois divide o céu ao meio, e cada metade ao meio de novo, até sobrarem no máximo 3 estrelas.</p>`,
      };
    }

    if (passo.tipo === 'dividir') {
      return {
        titulo: `Dividir · nível ${passo.profundidade}`,
        texto: `<p>Esta região tem <strong>${passo.pontos.length} estrelas</strong>. A linha vertical em <strong>x = ${graus(passo.xLinha)}</strong> deixa <span class="esq">${passo.esquerda.length} à esquerda</span> e <span class="dir">${passo.direita.length} à direita</span>.</p>
          <p>Cada metade vai procurar o seu próprio par mais próximo sem olhar para a outra. Os pares que cruzam a linha ficam para a etapa de combinar.</p>`,
      };
    }

    if (passo.tipo === 'base') {
      const quantos = passo.comparacoes.length === 1 ? 'o único par' : `os ${passo.comparacoes.length} pares`;
      return {
        titulo: `Caso base · nível ${passo.profundidade}`,
        texto: `<p>Só <strong>${passo.pontos.length} estrelas</strong>: dividir de novo não compensa, então comparamos ${quantos} diretamente.</p>
          <p>O mais próximo está a <strong>${graus(passo.melhor.distancia)}</strong>. Essa resposta volta para o nível de cima.</p>`,
      };
    }

    if (passo.tipo === 'combinar') {
      const daFaixa = passo.melhor !== passo.melhorEsquerda && passo.melhor !== passo.melhorDireita;
      const comparacoes = passo.comparacoes.length;
      const trabalho =
        comparacoes === 0
          ? 'Com menos de duas estrelas na faixa, nenhuma comparação é necessária.'
          : `Na ordem por y, cada uma é comparada com no máximo 7 seguintes: <strong>${comparacoes} ${comparacoes === 1 ? 'comparação' : 'comparações'}</strong>.`;
      const conclusao = daFaixa
        ? `Um par que cruza a linha venceu: <strong>${graus(passo.melhor.distancia)}</strong>.`
        : `Nenhum par da faixa é melhor, então fica <strong>δ = ${graus(passo.delta)}</strong>.`;
      return {
        titulo: `Combinar · nível ${passo.profundidade}`,
        texto: `<p><span class="esq">Esquerda: ${graus(passo.melhorEsquerda.distancia)}</span>. <span class="dir">Direita: ${graus(passo.melhorDireita.distancia)}</span>. A menor das duas é <strong>δ = ${graus(passo.delta)}</strong>.</p>
          <p>Um par que cruza a linha só ganha de δ se as duas estrelas estiverem a menos de δ dela, dentro da <span class="fx">faixa de largura 2δ</span>. Há ${passo.faixa.length} ${passo.faixa.length === 1 ? 'estrela' : 'estrelas'} nela. ${trabalho}</p>
          <p>${conclusao}</p>`,
      };
    }

    const forcaBruta = (totalDeEstrelas * (totalDeEstrelas - 1)) / 2;
    const parte = Math.round((passo.acumulado / forcaBruta) * 100);
    return {
      titulo: 'O par mais próximo',
      texto: `<p><strong>${nomeDe(passo.melhor.a)}</strong> e <strong>${nomeDe(passo.melhor.b)}</strong>, a ${graus(passo.melhor.distancia)} uma da outra.</p>
        <p>O algoritmo calculou ${formatar(passo.acumulado)} distâncias, contra ${formatar(forcaBruta)} da força bruta: ${parte}% do trabalho.</p>
        <p>Agora as duas estrelas são ligadas e trocadas por um único ponto, o centróide. As próximas rodadas repetem o mesmo algoritmo sobre a lista nova, sem a explicação.</p>`,
    };
  }

  // escurece o céu fora da região que o passo está resolvendo
  function velarForaDe(pontos) {
    const folga = 13 * ceu.dpr;
    const esquerda = ceu.paraTela({ x: Math.min(...pontos.map((p) => p.x)), y: 0 }).x - folga;
    const direita = ceu.paraTela({ x: Math.max(...pontos.map((p) => p.x)), y: 0 }).x + folga;
    ctx.fillStyle = 'rgba(3, 5, 12, 0.66)';
    ctx.fillRect(0, 0, Math.max(0, esquerda), ctx.canvas.height);
    ctx.fillRect(direita, 0, Math.max(0, ctx.canvas.width - direita), ctx.canvas.height);
  }

  // desenha um anel em volta de um ponto
  function anel(ponto, cor, alfa, folga = 5) {
    const p = ceu.paraTela(ponto);
    const raio = ceu.raioDe(ponto.membros[0]) + folga * ceu.dpr;
    ctx.strokeStyle = `rgba(${cor}, ${alfa})`;
    ctx.lineWidth = 1.4 * ceu.dpr;
    ctx.beginPath();
    ctx.arc(p.x, p.y, raio, 0, Math.PI * 2);
    ctx.stroke();
  }

  // desenha um segmento entre dois pontos, parcial quando o avanço é menor que 1
  function segmento(a, b, cor, alfa, largura, avanco = 1) {
    const p = ceu.paraTela(a);
    const q = ceu.paraTela(b);
    ctx.strokeStyle = `rgba(${cor}, ${alfa})`;
    ctx.lineWidth = largura * ceu.dpr;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + (q.x - p.x) * avanco, p.y + (q.y - p.y) * avanco);
    ctx.stroke();
  }

  // desenha a linha vertical da divisão ao longo de todo o campo
  function linhaVertical(xGraus, cor, alfa, avanco, tracejada) {
    const area = ceu.campoNaTela();
    const x = ceu.paraTela({ x: xGraus, y: 0 }).x;
    ctx.strokeStyle = `rgba(${cor}, ${alfa})`;
    ctx.lineWidth = 1.5 * ceu.dpr;
    ctx.setLineDash(tracejada ? [6 * ceu.dpr, 5 * ceu.dpr] : []);
    ctx.beginPath();
    ctx.moveTo(x, area.y);
    ctx.lineTo(x, area.y + area.altura * avanco);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // escreve uma etiqueta de dados com fundo escuro para destacar do céu
  function etiqueta(texto, x, y, cor, alfa = 1) {
    const d = ceu.dpr;
    ctx.font = `${11.5 * d}px "IBM Plex Mono", ui-monospace, monospace`;
    const largura = ctx.measureText(texto).width + 12 * d;
    const altura = 20 * d;
    ctx.globalAlpha = alfa;
    ctx.fillStyle = 'rgba(4, 6, 13, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x - largura / 2, y - altura / 2, largura, altura, 4 * d);
    ctx.fill();
    ctx.fillStyle = `rgb(${cor})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, x, y + 0.5 * d);
    ctx.globalAlpha = 1;
  }

  // destaca o melhor par com uma linha forte e a distância no meio
  function melhorPar(par, alfa) {
    segmento(par.a, par.b, COR_MELHOR, alfa, 2.2);
    const p = ceu.paraTela(par.a);
    const q = ceu.paraTela(par.b);
    etiqueta(graus(par.distancia), (p.x + q.x) / 2, (p.y + q.y) / 2 - 16 * ceu.dpr, COR_MELHOR, alfa);
  }

  // mostra as marcas da ordenação inicial por x e por y
  function desenharInicio(passo, t) {
    const area = ceu.campoNaTela();
    const d = ceu.dpr;
    ctx.strokeStyle = `rgba(${COR_MELHOR}, ${0.55 * t})`;
    ctx.lineWidth = d;
    ctx.beginPath();
    for (const ponto of passo.pontos) {
      const p = ceu.paraTela(ponto);
      ctx.moveTo(p.x, area.y + area.altura);
      ctx.lineTo(p.x, area.y + area.altura - 8 * d * t);
      ctx.moveTo(area.x, p.y);
      ctx.lineTo(area.x + 8 * d * t, p.y);
    }
    ctx.stroke();
    for (const ponto of passo.pontos) anel(ponto, COR_COMPARACAO, 0.25 * t);
  }

  // mostra a linha que separa a região em duas metades
  function desenharDivisao(passo, t) {
    velarForaDe(passo.pontos);
    for (const ponto of passo.esquerda) anel(ponto, COR_ESQUERDA, 0.85 * t);
    for (const ponto of passo.direita) anel(ponto, COR_DIREITA, 0.85 * t);
    linhaVertical(passo.xLinha, COR_MELHOR, 0.85, t, true);
    const area = ceu.campoNaTela();
    etiqueta(`x = ${graus(passo.xLinha)}`, ceu.paraTela({ x: passo.xLinha, y: 0 }).x, area.y + 12 * ceu.dpr, COR_MELHOR, t);
  }

  // mostra todas as comparações de um caso base
  function desenharBase(passo, agora) {
    velarForaDe(passo.pontos);
    const t = limitar((agora - inicioDoPasso) / DURACAO_DO_PASSO, 0, 1);
    const visiveis = movimentoReduzido ? passo.comparacoes.length : Math.ceil(t * passo.comparacoes.length);
    for (const ponto of passo.pontos) anel(ponto, COR_COMPARACAO, 0.6);
    for (const c of passo.comparacoes.slice(0, visiveis)) segmento(c.a, c.b, COR_COMPARACAO, 0.45, 1);
    if (t >= 1 || movimentoReduzido) melhorPar(passo.melhor, 1);
  }

  // mostra a faixa 2δ e as comparações entre vizinhos dentro dela
  function desenharCombinacao(passo, agora) {
    velarForaDe(passo.pontos);
    const d = ceu.dpr;
    const area = ceu.campoNaTela();
    const duracao = DURACAO_DO_PASSO * 1.6;
    const t = movimentoReduzido ? 1 : limitar((agora - inicioDoPasso) / duracao, 0, 1);
    const entrada = suavizar(limitar(t * 3, 0, 1));

    const esquerda = ceu.paraTela({ x: passo.xLinha - passo.delta, y: 0 }).x;
    const direita = ceu.paraTela({ x: passo.xLinha + passo.delta, y: 0 }).x;
    ctx.fillStyle = `rgba(${COR_FAIXA}, ${0.09 * entrada})`;
    ctx.fillRect(esquerda, area.y, direita - esquerda, area.altura);
    ctx.strokeStyle = `rgba(${COR_FAIXA}, ${0.55 * entrada})`;
    ctx.lineWidth = d;
    ctx.setLineDash([3 * d, 4 * d]);
    ctx.strokeRect(esquerda, area.y, direita - esquerda, area.altura);
    ctx.setLineDash([]);
    linhaVertical(passo.xLinha, COR_MELHOR, 0.5, 1, false);
    etiqueta(`2δ = ${graus(2 * passo.delta)}`, (esquerda + direita) / 2, area.y + area.altura - 12 * d, COR_FAIXA, entrada);

    segmento(passo.melhorEsquerda.a, passo.melhorEsquerda.b, COR_ESQUERDA, 0.9, 1.8);
    segmento(passo.melhorDireita.a, passo.melhorDireita.b, COR_DIREITA, 0.9, 1.8);
    for (const ponto of passo.faixa) anel(ponto, COR_FAIXA, 0.9 * entrada);

    const andamento = limitar((t - 0.25) / 0.6, 0, 1);
    const visiveis = Math.ceil(andamento * passo.comparacoes.length);
    for (const c of passo.comparacoes.slice(0, visiveis)) segmento(c.a, c.b, COR_COMPARACAO, 0.5, 1);
    if (t >= 0.9) melhorPar(passo.melhor, limitar((t - 0.9) / 0.1, 0, 1));
  }

  // mostra o par vencedor pulsando no céu inteiro
  function desenharResultado(passo, agora) {
    const pulso = movimentoReduzido ? 0.5 : (Math.sin(agora / 260) + 1) / 2;
    anel(passo.melhor.a, COR_MELHOR, 0.5 + 0.5 * pulso, 6 + 6 * pulso);
    anel(passo.melhor.b, COR_MELHOR, 0.5 + 0.5 * pulso, 6 + 6 * pulso);
    melhorPar(passo.melhor, 1);
  }

  // desenha sobre o céu o que o passo atual está fazendo
  function desenhar(agora) {
    if (!ativo) return;
    const passo = passos[indice];
    const t = movimentoReduzido ? 1 : suavizar(limitar((agora - inicioDoPasso) / DURACAO_DO_PASSO, 0, 1));
    ctx.save();
    if (passo.tipo === 'inicio') desenharInicio(passo, t);
    else if (passo.tipo === 'dividir') desenharDivisao(passo, t);
    else if (passo.tipo === 'base') desenharBase(passo, agora);
    else if (passo.tipo === 'combinar') desenharCombinacao(passo, agora);
    else desenharResultado(passo, agora);
    ctx.restore();
  }

  el.anterior.addEventListener('click', () => {
    pausar();
    irPara(indice - 1);
  });
  el.proximo.addEventListener('click', () => {
    pausar();
    avancar();
  });
  el.reproduzir.addEventListener('click', alternarReproducao);
  el.pular.addEventListener('click', () => {
    pausar();
    irPara(passos.length - 1);
  });

  document.addEventListener('keydown', (evento) => {
    if (!ativo || evento.target.closest('input, textarea, select')) return;
    if (evento.key === 'ArrowRight') {
      pausar();
      avancar();
    } else if (evento.key === 'ArrowLeft') {
      pausar();
      irPara(indice - 1);
    }
  });

  return {
    iniciar,
    cancelar,
    desenhar,
    ativo: () => ativo,
  };
}