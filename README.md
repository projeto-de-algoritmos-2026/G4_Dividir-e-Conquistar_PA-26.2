# Gerador de Constelações

Um céu de estrelas aleatórias vira constelações rodada após rodada. Em cada rodada, o algoritmo de **par de pontos mais próximo** (dividir e conquistar) encontra os dois pontos mais próximos do céu, as estrelas são ligadas e o par é trocado por um único ponto, o **centróide** do grupo. A primeira rodada é explicada passo a passo sobre o próprio céu. As rodadas continuam até todas as estrelas estarem ligadas, sem limite de distância.

Projeto feito com HTML, CSS e JavaScript puro, sem dependências nem etapa de build.

## Como rodar

Abra o `index.html` no navegador. Também funciona publicado no GitHub Pages.

1. Clique em **Próxima rodada**. A primeira rodada abre a explicação: avance pelos passos (botões ou setas ← →), reproduza automaticamente ou pule para o resultado.
2. Clique em **Ligar as estrelas** para aplicar a primeira rodada.
3. Continue clicando em **Próxima rodada**, ou use **Automático**, até sobrar um único ponto na lista e todas as estrelas estarem ligadas.

## Onde está o algoritmo

Tudo o que importa para a demonstração está em [`js/algorithms.js`](js/algorithms.js):

| Função | O que faz |
| --- | --- |
| `parMaisProximo` | ordena os pontos por x e por y uma única vez e chama a recursão |
| `parMaisProximoRecursivo` | divide pela mediana de x, resolve cada metade e combina olhando a faixa 2δ, comparando cada ponto com no máximo 7 vizinhos na ordem por y |
| `forcaBruta` | resolve os casos base com até 3 pontos |
| `centroide` | calcula o centróide de dois grupos, ponderado pelo número de estrelas |
| `fundirGrupos` | tira o par da lista e coloca o novo ponto no lugar |
| `estrelasMaisProximas` | escolhe quais estrelas reais ligar entre dois grupos |

O algoritmo aceita um observador opcional que recebe cada etapa (`dividir`, `base`, `combinar`). É assim que a explicação visual reaproveita exatamente o mesmo código, sem uma segunda implementação.

### Por que 7 vizinhos

Depois de resolver as duas metades, δ é a menor distância encontrada. Um par que cruza a linha só pode ser melhor se as duas estrelas estiverem a menos de δ da linha, dentro de uma faixa de largura 2δ. Em um retângulo δ × 2δ dessa faixa cabem no máximo 8 pontos que estão a pelo menos δ uns dos outros, então, com a faixa ordenada por y, basta comparar cada ponto com os 7 seguintes. A etapa de combinar fica linear e o algoritmo todo roda em O(n log n).

### Por que o centróide

Depois da primeira ligação, as duas estrelas continuariam sendo o par mais próximo. Trocar o par por um único ponto, o centróide, mantém a lista válida para o algoritmo sem nenhuma modificação: cada rodada roda o par mais próximo sobre uma lista com um ponto a menos.

## Estrutura

```
index.html            página única
css/style.css         visual do painel e dos controles
js/algorithms.js      par mais próximo, centróide e fusão
js/sky.js             geração e desenho do céu, das linhas e das letras gregas
js/explainer.js       explicação passo a passo da primeira rodada
js/main.js            estado, rodadas e controles
tests/                teste do algoritmo contra a força bruta
```

## Teste

Com Node instalado:

```
node tests/algorithms.test.js
```

O teste compara o resultado com a força bruta em milhares de conjuntos aleatórios, inclusive com coordenadas repetidas, e confere que o centróide de cada fusão é a média das estrelas do grupo.
