// calcula a distância euclidiana entre dois pontos
function distancia(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// compara todos os pares de um conjunto pequeno de pontos
function forcaBruta(pontos) {
  let melhor = { a: null, b: null, distancia: Infinity };
  const comparacoes = [];

  for (let i = 0; i < pontos.length; i++) {
    for (let j = i + 1; j < pontos.length; j++) {
      const d = distancia(pontos[i], pontos[j]);
      comparacoes.push({ a: pontos[i], b: pontos[j], distancia: d });
      if (d < melhor.distancia) melhor = { a: pontos[i], b: pontos[j], distancia: d };
    }
  }

  return { melhor, comparacoes };
}

// encontra o par de pontos mais próximo ordenando uma única vez e chamando a recursão
function parMaisProximo(pontos, observar = () => {}) {
  const porX = [...pontos].sort((a, b) => a.x - b.x);
  const porY = [...pontos].sort((a, b) => a.y - b.y);
  return parMaisProximoRecursivo(porX, porY, 0, observar);
}

// resolve um subproblema com os mesmos pontos ordenados por x e por y
function parMaisProximoRecursivo(porX, porY, profundidade, observar) {
  const n = porX.length;

  // caso base: com até 3 pontos, comparar todos os pares é mais barato que dividir
  if (n <= 3) {
    const { melhor, comparacoes } = forcaBruta(porX);
    observar({ tipo: 'base', profundidade, pontos: porX, comparacoes, melhor });
    return melhor;
  }

  // dividir: a linha vertical passa entre o ponto do meio e o seguinte na ordem por x
  const meio = Math.floor(n / 2);
  const xLinha = (porX[meio - 1].x + porX[meio].x) / 2;
  const esquerdaX = porX.slice(0, meio);
  const direitaX = porX.slice(meio);
  observar({ tipo: 'dividir', profundidade, pontos: porX, xLinha, esquerda: esquerdaX, direita: direitaX });

  // a lista por y é repartida sem reordenar, então cada metade continua ordenada por y
  const naEsquerda = new Set(esquerdaX);
  const esquerdaY = porY.filter((p) => naEsquerda.has(p));
  const direitaY = porY.filter((p) => !naEsquerda.has(p));

  // conquistar: cada metade encontra o seu próprio par mais próximo
  const melhorEsquerda = parMaisProximoRecursivo(esquerdaX, esquerdaY, profundidade + 1, observar);
  const melhorDireita = parMaisProximoRecursivo(direitaX, direitaY, profundidade + 1, observar);

  // delta é a menor distância encontrada até aqui, sem olhar pares que cruzam a linha
  let melhor = melhorEsquerda.distancia <= melhorDireita.distancia ? melhorEsquerda : melhorDireita;
  const delta = melhor.distancia;

  // combinar: um par que cruza a linha e é menor que delta tem os dois pontos a menos de delta dela
  const faixa = porY.filter((p) => Math.abs(p.x - xLinha) < delta);
  const comparacoes = [];

  // em um retângulo delta × 2delta da faixa cabem no máximo 8 pontos separados por δ,
  // então, na ordem por y, cada ponto só precisa ser comparado com os 7 seguintes
  for (let i = 0; i < faixa.length; i++) {
    for (let j = i + 1; j < faixa.length && j <= i + 7; j++) {
      const d = distancia(faixa[i], faixa[j]);
      comparacoes.push({ a: faixa[i], b: faixa[j], distancia: d });
      if (d < melhor.distancia) melhor = { a: faixa[i], b: faixa[j], distancia: d };
    }
  }

  observar({
    tipo: 'combinar',
    profundidade,
    pontos: porX,
    xLinha,
    delta,
    faixa,
    comparacoes,
    melhorEsquerda,
    melhorDireita,
    melhor,
  });

  return melhor;
}

// transforma cada estrela em um grupo de um só membro, posicionado sobre ela
function criarGrupos(estrelas) {
  return estrelas.map((estrela) => ({ x: estrela.x, y: estrela.y, membros: [estrela] }));
}

// calcula o centróide de dois grupos, ponderado pela quantidade de estrelas de cada um
function centroide(p, q) {
  const np = p.membros.length;
  const nq = q.membros.length;
  return {
    x: (p.x * np + q.x * nq) / (np + nq),
    y: (p.y * np + q.y * nq) / (np + nq),
  };
}

// tira os dois grupos da lista e coloca no lugar um único ponto no centróide deles
function fundirGrupos(pontos, p, q) {
  const { x, y } = centroide(p, q);
  const novo = { x, y, membros: [...p.membros, ...q.membros] };
  const restantes = pontos.filter((r) => r !== p && r !== q);
  restantes.push(novo);
  return { pontos: restantes, novo };
}

// escolhe as duas estrelas reais mais próximas entre dois grupos para desenhar a ligação
function estrelasMaisProximas(membrosA, membrosB) {
  let melhor = { a: null, b: null, distancia: Infinity };
  for (const a of membrosA) {
    for (const b of membrosB) {
      const d = distancia(a, b);
      if (d < melhor.distancia) melhor = { a, b, distancia: d };
    }
  }
  return melhor;
}
