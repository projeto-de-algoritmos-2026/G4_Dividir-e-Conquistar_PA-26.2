const LARGURA_DO_CAMPO = 60;

const CLASSES_ESPECTRAIS = [
  { classe: 'O', cor: [155, 176, 255], peso: 0.05 },
  { classe: 'B', cor: [170, 191, 255], peso: 0.11 },
  { classe: 'A', cor: [202, 215, 255], peso: 0.16 },
  { classe: 'F', cor: [248, 247, 255], peso: 0.2 },
  { classe: 'G', cor: [255, 241, 224], peso: 0.2 },
  { classe: 'K', cor: [255, 208, 158], peso: 0.17 },
  { classe: 'M', cor: [255, 180, 120], peso: 0.11 },
];

const CORES_DE_NEBULOSA = [
  [96, 74, 168],
  [46, 112, 150],
  [150, 72, 110],
  [70, 64, 140],
  [120, 96, 70],
];

const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// gera números aleatórios reproduzíveis a partir de uma semente
function criarAleatorio(semente) {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// sorteia um valor com distribuição normal padrão
function sortearNormal(aleatorio) {
  const u = 1 - aleatorio();
  const v = aleatorio();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// escolhe uma classe espectral respeitando o peso de cada uma
function sortearClasse(aleatorio) {
  let resto = aleatorio();
  for (const c of CLASSES_ESPECTRAIS) {
    resto -= c.peso;
    if (resto <= 0) return c;
  }
  return CLASSES_ESPECTRAIS[CLASSES_ESPECTRAIS.length - 1];
}

// prende um valor entre um mínimo e um máximo
function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo);
}

// gera as estrelas em graus e a decoração do fundo em coordenadas relativas à tela
function gerarCeu(semente, quantidade, proporcao) {
  const aleatorio = criarAleatorio(semente);
  const largura = LARGURA_DO_CAMPO;
  const altura = LARGURA_DO_CAMPO * limitar(proporcao, 0.45, 1.7);
  const margem = 1.5;

  const aglomerados = Array.from({ length: 3 + Math.floor(aleatorio() * 3) }, () => ({
    x: margem + aleatorio() * (largura - 2 * margem),
    y: margem + aleatorio() * (altura - 2 * margem),
    raio: 2 + aleatorio() * 3,
  }));

  const catalogo = new Set();
  const estrelas = [];
  for (let i = 0; i < quantidade; i++) {
    let x = aleatorio() * largura;
    let y = aleatorio() * altura;
    if (aleatorio() < 0.35) {
      const a = aglomerados[Math.floor(aleatorio() * aglomerados.length)];
      const ax = a.x + sortearNormal(aleatorio) * a.raio;
      const ay = a.y + sortearNormal(aleatorio) * a.raio;
      if (ax > margem && ax < largura - margem && ay > margem && ay < altura - margem) {
        x = ax;
        y = ay;
      }
    }

    let numero;
    do {
      numero = 1000 + Math.floor(aleatorio() * 238000);
    } while (catalogo.has(numero));
    catalogo.add(numero);

    const { classe, cor } = sortearClasse(aleatorio);
    estrelas.push({
      id: i,
      nome: `HD ${numero}`,
      x: limitar(x, margem, largura - margem),
      y: limitar(y, margem, altura - margem),
      magnitude: 0.2 + 4.8 * Math.pow(aleatorio(), 0.55),
      classe,
      cor,
      fase: aleatorio() * Math.PI * 2,
      ritmo: 0.6 + aleatorio() * 1.6,
    });
  }

  const angulo = (aleatorio() - 0.5) * 1.3;
  const faixa = {
    cx: 0.35 + aleatorio() * 0.3,
    cy: 0.35 + aleatorio() * 0.3,
    dx: Math.cos(angulo),
    dy: Math.sin(angulo),
  };

  const poeira = [];
  for (let i = 0; i < 2600; i++) {
    let px = aleatorio();
    let py = aleatorio();
    if (aleatorio() < 0.72) {
      const ao = (aleatorio() - 0.5) * 1.8;
      const desvio = sortearNormal(aleatorio) * (aleatorio() < 0.6 ? 0.07 : 0.16);
      px = faixa.cx + faixa.dx * ao - faixa.dy * desvio;
      py = faixa.cy + faixa.dy * ao + faixa.dx * desvio;
    }
    if (px < 0 || px > 1 || py < 0 || py > 1) continue;
    poeira.push({
      x: px,
      y: py,
      tamanho: 0.25 + Math.pow(aleatorio(), 3) * 0.9,
      brilho: 0.12 + aleatorio() * 0.45,
      tom: aleatorio(),
    });
  }

  const nebulosas = Array.from({ length: 16 }, () => {
    const ao = (aleatorio() - 0.5) * 1.6;
    const desvio = sortearNormal(aleatorio) * 0.06;
    return {
      x: faixa.cx + faixa.dx * ao - faixa.dy * desvio,
      y: faixa.cy + faixa.dy * ao + faixa.dx * desvio,
      raio: 0.1 + aleatorio() * 0.18,
      cor: CORES_DE_NEBULOSA[Math.floor(aleatorio() * CORES_DE_NEBULOSA.length)],
      opacidade: 0.06 + aleatorio() * 0.09,
    };
  });

  const sombras = Array.from({ length: 10 }, () => {
    const ao = (aleatorio() - 0.5) * 1.4;
    const desvio = sortearNormal(aleatorio) * 0.012;
    return {
      x: faixa.cx + faixa.dx * ao - faixa.dy * desvio,
      y: faixa.cy + faixa.dy * ao + faixa.dx * desvio,
      raio: 0.03 + aleatorio() * 0.06,
      opacidade: 0.35 + aleatorio() * 0.3,
    };
  });

  return { semente, largura, altura, estrelas, poeira, nebulosas, sombras };
}

// cria o desenhista que converte graus em pixels e pinta o céu no canvas
function criarCeu(canvas) {
  const ctx = canvas.getContext('2d');
  const sprites = new Map();
  let campo = null;
  let fundo = null;
  let escala = 1;
  let origemX = 0;
  let origemY = 0;
  let dpr = 1;

  // devolve a parte do canvas livre do cabeçalho e dos botões
  function areaUtil() {
    const compacto = canvas.clientWidth < 620;
    const topo = (compacto ? 92 : 112) * dpr;
    const base = (compacto ? 72 : 84) * dpr;
    const lado = (compacto ? 18 : 34) * dpr;
    return { x: lado, y: topo, largura: canvas.width - 2 * lado, altura: canvas.height - topo - base };
  }

  // informa a proporção altura/largura da área útil para gerar um céu que a preencha
  function proporcaoUtil() {
    const area = areaUtil();
    return area.altura / Math.max(area.largura, 1);
  }

  // ajusta o canvas ao tamanho exibido e à densidade de pixels da tela
  function redimensionar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (campo) enquadrar();
  }

  // troca o céu exibido
  function definirCampo(novoCampo) {
    campo = novoCampo;
    enquadrar();
  }

  // centraliza o campo de estrelas na área útil sem distorcer as distâncias
  function enquadrar() {
    const area = areaUtil();
    escala = Math.min(area.largura / campo.largura, area.altura / campo.altura);
    origemX = area.x + (area.largura - campo.largura * escala) / 2;
    origemY = area.y + (area.altura - campo.altura * escala) / 2;
    fundo = pintarFundo();
  }

  // converte um ponto em graus para pixels do canvas
  function paraTela(ponto) {
    return { x: origemX + ponto.x * escala, y: origemY + ponto.y * escala };
  }

  // devolve o retângulo do campo de estrelas em pixels
  function campoNaTela() {
    return { x: origemX, y: origemY, largura: campo.largura * escala, altura: campo.altura * escala };
  }

  // calcula o raio do núcleo da estrela a partir da magnitude
  function raioDe(estrela) {
    return (1 + (5.4 - estrela.magnitude) * 0.52) * dpr;
  }

  // cria uma única vez a imagem de brilho de cada cor de estrela
  function spriteDe(cor) {
    const chave = cor.join(',');
    if (sprites.has(chave)) return sprites.get(chave);
    const tamanho = 96;
    const meio = tamanho / 2;
    const imagem = document.createElement('canvas');
    imagem.width = imagem.height = tamanho;
    const g = imagem.getContext('2d');
    const gradiente = g.createRadialGradient(meio, meio, 0, meio, meio, meio);
    gradiente.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradiente.addColorStop(0.1, 'rgba(255, 255, 255, 0.95)');
    gradiente.addColorStop(0.19, `rgba(${chave}, 0.78)`);
    gradiente.addColorStop(0.42, `rgba(${chave}, 0.14)`);
    gradiente.addColorStop(1, `rgba(${chave}, 0)`);
    g.fillStyle = gradiente;
    g.fillRect(0, 0, tamanho, tamanho);
    sprites.set(chave, imagem);
    return imagem;
  }

  // pinta uma vez o fundo fixo com via láctea, poeira estelar e grade de coordenadas
  function pintarFundo() {
    const imagem = document.createElement('canvas');
    imagem.width = canvas.width;
    imagem.height = canvas.height;
    const g = imagem.getContext('2d');
    const w = imagem.width;
    const h = imagem.height;
    const lado = Math.max(w, h);

    const ceuBase = g.createLinearGradient(0, 0, w * 0.3, h);
    ceuBase.addColorStop(0, '#070a19');
    ceuBase.addColorStop(0.55, '#04060f');
    ceuBase.addColorStop(1, '#020309');
    g.fillStyle = ceuBase;
    g.fillRect(0, 0, w, h);

    g.globalCompositeOperation = 'lighter';
    for (const n of campo.nebulosas) {
      const r = n.raio * lado;
      const brilho = g.createRadialGradient(n.x * w, n.y * h, 0, n.x * w, n.y * h, r);
      brilho.addColorStop(0, `rgba(${n.cor.join(',')}, ${n.opacidade})`);
      brilho.addColorStop(0.5, `rgba(${n.cor.join(',')}, ${n.opacidade * 0.45})`);
      brilho.addColorStop(1, `rgba(${n.cor.join(',')}, 0)`);
      g.fillStyle = brilho;
      g.fillRect(n.x * w - r, n.y * h - r, r * 2, r * 2);
    }

    for (const p of campo.poeira) {
      const tom = p.tom < 0.15 ? '255, 214, 170' : p.tom < 0.35 ? '190, 205, 255' : '235, 238, 255';
      g.fillStyle = `rgba(${tom}, ${p.brilho})`;
      g.beginPath();
      g.arc(p.x * w, p.y * h, p.tamanho * dpr, 0, Math.PI * 2);
      g.fill();
    }

    g.globalCompositeOperation = 'source-over';
    for (const s of campo.sombras) {
      const r = s.raio * lado;
      const sombra = g.createRadialGradient(s.x * w, s.y * h, 0, s.x * w, s.y * h, r);
      sombra.addColorStop(0, `rgba(3, 4, 10, ${s.opacidade})`);
      sombra.addColorStop(1, 'rgba(3, 4, 10, 0)');
      g.fillStyle = sombra;
      g.fillRect(s.x * w - r, s.y * h - r, r * 2, r * 2);
    }

    const vinheta = g.createRadialGradient(w / 2, h / 2, lado * 0.25, w / 2, h / 2, lado * 0.75);
    vinheta.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vinheta.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    g.fillStyle = vinheta;
    g.fillRect(0, 0, w, h);

    const area = campoNaTela();
    g.strokeStyle = 'rgba(160, 175, 230, 0.07)';
    g.lineWidth = dpr;
    g.setLineDash([2 * dpr, 6 * dpr]);
    g.beginPath();
    for (let grau = 0; grau <= campo.largura + 0.001; grau += 10) {
      const x = Math.round(origemX + grau * escala) + 0.5;
      g.moveTo(x, area.y);
      g.lineTo(x, area.y + area.altura);
    }
    for (let grau = 0; grau <= campo.altura + 0.001; grau += 10) {
      const y = Math.round(origemY + grau * escala) + 0.5;
      g.moveTo(area.x, y);
      g.lineTo(area.x + area.largura, y);
    }
    g.stroke();
    g.setLineDash([]);

    g.fillStyle = 'rgba(160, 175, 230, 0.32)';
    g.font = `${9.5 * dpr}px "IBM Plex Mono", ui-monospace, monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'top';
    for (let grau = 10; grau < campo.largura; grau += 10) {
      g.fillText(`${grau}°`, origemX + grau * escala, area.y + area.altura + 6 * dpr);
    }

    return imagem;
  }

  // copia o fundo já pintado para o canvas
  function desenharFundo() {
    if (fundo) ctx.drawImage(fundo, 0, 0);
  }

  // calcula a cintilação de uma estrela no instante dado
  function cintilacao(estrela, agora) {
    if (movimentoReduzido) return 1;
    const t = agora / 1000;
    const lenta = Math.sin(t * estrela.ritmo + estrela.fase);
    const rapida = Math.sin(t * estrela.ritmo * 3.7 + estrela.fase * 2.3);
    return 0.78 + 0.16 * lenta + 0.06 * rapida;
  }

  // desenha os raios de difração das estrelas mais brilhantes
  function desenharRaios(x, y, raio, cor, intensidade) {
    const comprimento = raio * (5 + intensidade * 9);
    ctx.lineWidth = Math.max(1, 0.8 * dpr);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const raioDeLuz = ctx.createLinearGradient(x, y, x + dx * comprimento, y + dy * comprimento);
      raioDeLuz.addColorStop(0, `rgba(${cor.join(',')}, ${0.55 * intensidade + 0.2})`);
      raioDeLuz.addColorStop(1, `rgba(${cor.join(',')}, 0)`);
      ctx.strokeStyle = raioDeLuz;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx * comprimento, y + dy * comprimento);
      ctx.stroke();
    }
  }

  // desenha todas as estrelas com halo colorido, cintilação e raios nas mais brilhantes
  function desenharEstrelas(agora) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const estrela of campo.estrelas) {
      const { x, y } = paraTela(estrela);
      const brilho = cintilacao(estrela, agora);
      const raio = raioDe(estrela) * (0.92 + 0.08 * brilho);
      const tamanho = raio * 7;
      ctx.globalAlpha = brilho;
      ctx.drawImage(spriteDe(estrela.cor), x - tamanho / 2, y - tamanho / 2, tamanho, tamanho);
      if (estrela.magnitude < 1.6) desenharRaios(x, y, raio, estrela.cor, ((1.6 - estrela.magnitude) / 1.4) * brilho);
    }
    ctx.restore();
  }

  return {
    ctx,
    redimensionar,
    definirCampo,
    proporcaoUtil,
    paraTela,
    campoNaTela,
    raioDe,
    desenharFundo,
    desenharEstrelas,
    get escala() {
      return escala;
    },
    get dpr() {
      return dpr;
    },
  };
}
