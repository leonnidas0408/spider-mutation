Quimera-Ω

Jogo 2D de ação, aventura, exploração e metroidvania em pixel art, sobre um
pesquisador mordido por uma aranha exposta ao agente mutagênico Quimera-Ω.
Ver docs/quimera_omega_game_design.pdf (conceito e formato do jogo) e
docs/catalogo_personagens_quimera_omega.pdf (lore e referência visual de
cada personagem/criatura) pro design completo.

Divisão de trabalho: os sprites e a arte são feitos à mão; este repositório
é o backend/lógica do jogo em cima disso (Phaser 3).

Como rodar

O index.html carrega scripts e imagens locais, então abrir o arquivo
direto do disco (file://) é bloqueado pelo navegador (CORS). Suba um
servidor estático simples na raiz do projeto:

Bash


python3 -m http.server 8000
# ou: npx serve .



Abra http://localhost:8000/.

Controles da demo atual:

•
←/→ ou A/D: andar

•
Segurar SHIFT: correr

•
ESPAÇO: pular (encostado numa parede + segurando a direção dela = pulo
na parede )

•
E ou clique esquerdo (no ar): atira a teia no ponto de ancoragem
(círculo amarelo) mais próximo dentro do alcance

•
W/↑ e S/↓ enquanto balança na teia: encurta/alonga a corda

Estrutura do repositório

Plain Text


quimera-omega/
├── index.html                 # cena de demonstração jogável
├── assets/
│   └── sprites/
│       ├── manifest.json      # de onde veio cada frame recortado
│       └── <personagem>/      # 8 poses por personagem (ver abaixo)
├── src/
│   ├── game-data.js           # fonte da verdade: Atos, Regiões, Poderes,
│   │                             Personagens + GerenciadorProgressao
│   ├── animations.js          # mapa pose→arquivo e helpers de load/anim
│   ├── web-swing.js           # física de pêndulo da teia
│   └── player-controller.js   # movimento, colisão, aderência, teia
├── scripts/
│   └── recortar_sprites.py    # script que gerou assets/sprites a partir
│                                 das pranchas conceituais originais
└── docs/
    ├── quimera_omega_game_design.pdf
    └── catalogo_personagens_quimera_omega.pdf



Personagens com sprites já integrados ao sistema de animação

src/animations.js já mapeia as 8 poses de todos eles (via
assets/sprites/manifest.json), prontos pra qualquer controller futuro
usar com QUIMERA_precarregarSpritesPersonagem /
QUIMERA_registrarAnimacoesPersonagem:

protagonista, aranha_quimera, toupeira_gigante, homem_onca,
fazendeiro, caes_mutantes, trex_mutante, monstro_acido.

Só o protagonista tem um controller de verdade (player-controller.js)
por enquanto — os outros são o próximo passo (IA de inimigos/chefes).

Limitação conhecida: hitbox do protagonista

Os frames em assets/sprites/protagonista/ são canvases de 320×1440 (arte
conceitual em alta resolução), e medindo a caixa delimitadora real do
personagem (via canal alfa) em algumas poses:

Frame
bbox (x0, y0, x1, y1)
00_idle.png
(42, 400, 320, 1129)
01_caminhada.png
(0, 471, 320, 1120)
02_corrida.png
(0, 517, 320, 1108)
03_aderencia_parede.png
(0, 456, 320, 970)
04_balanco_teia.png
(0, 265, 320, 1129)




O personagem não está ancorado/centralizado do mesmo jeito em todas as
poses (a corrida e a caminhada encostam na borda esquerda do canvas, o idle
não). Isso é normal pra arte conceitual, mas significa que a hitbox fixa
usada em player-controller.js (larguraColisaoFrac/alturaColisaoFrac/
offsetYFrac) é uma aproximação a partir do idle, não algo pixel-perfect
pra todas as poses. Duas opções pra resolver isso de vez:

1.
Reexportar os frames com um pivô consistente (ex: pés sempre na mesma
linha Y, personagem sempre centralizado horizontalmente no canvas).

2.
Manter a hitbox fixa como está (ela já funciona pra colisão/gameplay) e
aceitar que o sprite pode "vazar" um pouco da caixa em poses mais
largas, como qualquer jogo 2D com hitbox menor que o sprite.

Correção do balanço na teia

O estado balanco_teia agora força a pose 04_balanco_teia.png, evitando que
o Phaser mantenha a textura da pose anterior. Durante o movimento pendular, o
controller divide o deslocamento em subpassos de no máximo 12 px, atualiza o
corpo Arcade em cada subpasso e testa colisão contra plataformas e paredes.
Se o trajeto atingir um colisor, o jogador retorna ao último ponto seguro e a
teia é solta, impedindo atravessamento de plataformas em alta velocidade.

Poderes e progressão

O PlayerController não libera aderência/teia por padrão — ele consulta o
GerenciadorProgressao de game-data.js. Quando a campanha avança de ato
(gerenciadorProgressao.derrotarChefe(...)), os poderes recém-desbloqueados
já passam a funcionar no controller sem mexer em nada.

Tamanho do repositório / Git LFS

assets/sprites/ tem ~18 MB em 64 PNGs de alta resolução. Isso ainda está
bem dentro dos limites do GitHub, mas se o time for crescer o volume de
arte, vale considerar Git LFS pros PNGs desde já
(git lfs track "assets/sprites/**/*.png") pra manter o histórico do repo
leve.

Próximos passos possíveis

•
IA e controllers dos inimigos/chefes (Toupeira, Homem-Onça, Fazendeiro,
Cães, T-Rex, Monstro Ácido) reaproveitando animations.js

•
Sistema de combate (dano, teia prendendo inimigos, HP)

•
Poses de frame intermediárias pra animações de verdade (hoje cada pose é
1 frame estático)

•
Tilemap real das regiões (hoje são só plataformas de teste)

•
Save/load usando GerenciadorProgressao.paraJSON() / .deJSON()

