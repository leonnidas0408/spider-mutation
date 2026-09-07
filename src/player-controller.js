"use strict";

/* ==========================================================================
   PLAYER CONTROLLER — Protagonista (Quimera-Ω)
   ==========================================================================
   Movimento, colisão, aderência a paredes e teia (balanço), usando Phaser 3
   Arcade Physics + o módulo web-swing.js para a física de pêndulo da teia.

   Os poderes são checados via GerenciadorProgressao (game_data.js), então o
   protagonista só ganha aderência/teia se esses poderes já tiverem sido
   desbloqueados na campanha — não é hardcoded.

   MAPEAMENTO DE ANIMAÇÃO (ordem dos frames em protagonista_sprites.png,
   ver README_sprites.md — os sprites ainda não estão recortados em tiles,
   isso é só o mapeamento lógico que a animação vai usar quando estiverem):
     0 Idle | 1 Caminhada | 2 Corrida | 3 Aderência à parede
     4 Balanço com teia | 5 Ataque com teia comum
     6 Ataque com Teia Elétrica | 7 Regeneração controlada

   Dependências esperadas no escopo global/módulo:
     - QUIMERA (de game_data.js) — usado só para checar poderes via
       gerenciadorProgressao.temPoder(id)
     - QUIMERA_WebSwing (de web-swing.js)
   ========================================================================== */

const ESTADOS_JOGADOR = Object.freeze({
  IDLE: "idle",
  CAMINHANDO: "caminhando",
  CORRENDO: "correndo",
  PULANDO: "pulando",
  CAINDO: "caindo",
  ADERENCIA_PAREDE: "aderencia_parede",
  BALANCO_TEIA: "balanco_teia",
});

// Estado -> pose de animação. pulando/caindo reaproveitam "idle" porque o
// recorte atual (ver src/animations.js) não tem uma pose própria de salto —
// quando você gerar esses frames, é só trocar aqui.
const ESTADO_PARA_POSE_ANIMACAO = Object.freeze({
  idle: "idle",
  caminhando: "caminhada",
  correndo: "corrida",
  pulando: "idle",
  caindo: "idle",
  aderencia_parede: "aderencia_parede",
  balanco_teia: "balanco_teia",
});

const CONFIG_PADRAO = Object.freeze({
  velocidadeCaminhada: 180,
  velocidadeCorrida: 300,
  aceleracao: 1800,
  arrastoNoChao: 2200,
  arrastoNoAr: 400,
  velocidadePulo: 420,
  velocidadeMaximaQueda: 900,

  // Sprite/hitbox — os frames em assets/sprites/protagonista são imagens de
  // 320×1440 (canvas de alta resolução, não um tile de jogo pronto). Medi a
  // caixa delimitadora real do personagem (via canal alfa) em algumas poses
  // e os valores batem de forma inconsistente entre frames (a "corrida" e a
  // "caminhada" encostam na borda esquerda, o "idle" não) — ou seja, os
  // frames não foram exportados com um pivô/ancoragem consistente entre si.
  // Os valores abaixo são uma aproximação razoável a partir do frame de
  // idle; espere ajustar isso visualmente, ou (melhor) pedir uma nova
  // exportação com os pés sempre na mesma linha e o personagem centralizado
  // igual em todas as poses.
  alturaAlvoPixels: 160, // altura final desejada na tela
  larguraColisaoFrac: 0.45,
  alturaColisaoFrac: 0.5,
  offsetYFrac: 0.34, // deslocamento vertical do topo do frame até o topo da hitbox

  // Aderência à parede
  velocidadeDeslizeParede: 70,
  velocidadePuloDaParede: { x: 320, y: 380 },
  janelaCoiotePulaParede: 150, // ms de tolerância após soltar a parede

  // Teia
  gravidadeCena: 900,
  teiaComprimentoMinimo: 40,
  teiaComprimentoMaximo: 260,
  teiaAmortecimento: 0.999,
  teiaVelocidadeAjusteComprimento: 220, // px/s ao segurar cima/baixo balançando
});

class PlayerController {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} opcoes
   * @param {object} opcoes.gerenciadorProgressao - instância de QUIMERA.GerenciadorProgressao
   * @param {string} [opcoes.textura] - chave da textura/spritesheet do jogador
   * @param {Phaser.GameObjects.Group|Array} opcoes.ancoras - pontos onde a teia pode prender
   * @param {Partial<typeof CONFIG_PADRAO>} [opcoes.config]
   */
  constructor(scene, x, y, opcoes) {
    this.scene = scene;
    this.progressao = opcoes.gerenciadorProgressao;
    this.ancoras = opcoes.ancoras || [];
    this.colisores = opcoes.colisores || [];
    this.personagemId = opcoes.personagemId || "protagonista";
    this.config = { ...CONFIG_PADRAO, ...(opcoes.config || {}) };

    const chaveInicial = opcoes.textura || (window.QUIMERA_chaveFramePersonagem
      ? window.QUIMERA_chaveFramePersonagem(this.personagemId, "idle")
      : "protagonista");

    this.sprite = scene.physics.add.sprite(x, y, chaveInicial);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setMaxVelocity(this.config.velocidadeCorrida + 40, this.config.velocidadeMaximaQueda);
    this.sprite.setDragX(this.config.arrastoNoChao);

    // this.sprite.width/height aqui ainda são as dimensões cruas do frame
    // (a textura só foi carregada, o setScale abaixo é que muda o tamanho
    // exibido). Ver a nota em CONFIG_PADRAO sobre a hitbox.
    const escala = this.config.alturaAlvoPixels / this.sprite.height;
    this.sprite.setScale(escala);
    this.sprite.body.setSize(
      this.sprite.width * this.config.larguraColisaoFrac,
      this.sprite.height * this.config.alturaColisaoFrac
    );
    this.sprite.body.setOffset(
      (this.sprite.width * (1 - this.config.larguraColisaoFrac)) / 2,
      this.sprite.height * this.config.offsetYFrac
    );

    if (window.QUIMERA_registrarAnimacoesPersonagem) {
      window.QUIMERA_registrarAnimacoesPersonagem(scene, this.personagemId);
    }

    this.estado = ESTADOS_JOGADOR.IDLE;
    this._ultimaPoseAnimacao = null;
    this.olhandoDireita = true;

    this._ultimoContatoParedeLado = 0; // -1 esquerda, 1 direita, 0 nenhum
    this._tempoDesdeSoltouParede = Infinity;

    this.webSwing = new (window.QUIMERA_WebSwing || require("./web-swing").WebSwing)(scene, {
      comprimentoMinimo: this.config.teiaComprimentoMinimo,
      comprimentoMaximo: this.config.teiaComprimentoMaximo,
      amortecimento: this.config.teiaAmortecimento,
      gravidade: this.config.gravidadeCena,
    });

    this._configurarInput();
  }

  _configurarInput() {
    const teclado = this.scene.input.keyboard;
    this.teclas = teclado.addKeys({
      esquerda: Phaser.Input.Keyboard.KeyCodes.LEFT,
      direita: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      cima: Phaser.Input.Keyboard.KeyCodes.UP,
      baixo: Phaser.Input.Keyboard.KeyCodes.DOWN,
      pular: Phaser.Input.Keyboard.KeyCodes.SPACE,
      correr: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      teia: Phaser.Input.Keyboard.KeyCodes.E,
    });

    this.scene.input.on("pointerdown", (ponteiro) => {
      if (ponteiro.leftButtonDown()) this._teclaTeiaPressionadaAgora = true;
    });
    this.scene.input.on("pointerup", () => {
      this._teclaTeiaPressionadaAgora = false;
      this._soltarTeiaSePresa();
    });
  }

  temPoder(poderId) {
    return !!(this.progressao && this.progressao.temPoder(poderId));
  }

  /** Chamar todo frame, a partir do update() da cena. @param {number} deltaMs */
  atualizar(deltaMs) {
    const deltaSegundos = deltaMs / 1000;
    const corpo = this.sprite.body;
    const noChao = corpo.blocked.down || corpo.touching.down;
    const tocandoParedeEsquerda = corpo.blocked.left || corpo.touching.left;
    const tocandoParedeDireita = corpo.blocked.right || corpo.touching.right;

    const teclaEsquerda = this.teclas.esquerda.isDown || this.teclas.a.isDown;
    const teclaDireita = this.teclas.direita.isDown || this.teclas.d.isDown;
    const teclaPular = Phaser.Input.Keyboard.JustDown(this.teclas.pular);
    const teclaCorrer = this.teclas.correr.isDown;
    const teclaTeiaJustDown = Phaser.Input.Keyboard.JustDown(this.teclas.teia) || this._consumirCliqueTeia();
    const teclaTeiaSegurando = this.teclas.teia.isDown || this._teclaTeiaPressionadaAgora;

    // -------------------------------------------------------------
    // 1) Se está balançando na teia, a física do pêndulo manda
    // -------------------------------------------------------------
    if (this.webSwing.presa) {
      this._atualizarBalancoTeia(deltaSegundos, teclaEsquerda, teclaDireita, teclaTeiaSegurando);

      if (!teclaTeiaSegurando || teclaPular) {
        this._soltarTeiaSePresa(teclaPular);
      }
      this._sincronizarVisual(deltaSegundos, noChao);
      return;
    }

    // -------------------------------------------------------------
    // 2) Disparo de teia (só se o poder já foi desbloqueado)
    // -------------------------------------------------------------
    if (teclaTeiaJustDown && this.temPoder("teia_comum") && !noChao) {
      const posJogador = { x: this.sprite.x, y: this.sprite.y };
      const velocidadeAtual = { x: corpo.velocity.x, y: corpo.velocity.y };
      this.webSwing.tentarPrender(this._listarAncorasAtivas(), posJogador, velocidadeAtual);
      if (this.webSwing.presa) return;
    }

    // -------------------------------------------------------------
    // 3) Aderência à parede (só se o poder "aderencia" foi desbloqueado)
    // -------------------------------------------------------------
    const podeAderir = this.temPoder("aderencia");
    const encostandoNaParedeCorreta =
      (tocandoParedeEsquerda && teclaEsquerda) || (tocandoParedeDireita && teclaDireita);

    if (podeAderir && !noChao && encostandoNaParedeCorreta && corpo.velocity.y >= 0) {
      this.estado = ESTADOS_JOGADOR.ADERENCIA_PAREDE;
      corpo.setVelocityY(this.config.velocidadeDeslizeParede);
      corpo.setVelocityX(0);
      this._ultimoContatoParedeLado = tocandoParedeEsquerda ? -1 : 1;
      this._tempoDesdeSoltouParede = 0;
      this.olhandoDireita = this._ultimoContatoParedeLado === -1;

      if (teclaPular) {
        corpo.setVelocityX(this._ultimoContatoParedeLado * -this.config.velocidadePuloDaParede.x);
        corpo.setVelocityY(-this.config.velocidadePuloDaParede.y);
        this._tempoDesdeSoltouParede = Infinity;
      }
      this._sincronizarVisual(deltaSegundos, noChao);
      return;
    }
    this._tempoDesdeSoltouParede += deltaMs;

    // -------------------------------------------------------------
    // 4) Movimento normal no chão / no ar
    // -------------------------------------------------------------
    const velocidadeAlvo = teclaCorrer ? this.config.velocidadeCorrida : this.config.velocidadeCaminhada;
    corpo.setDragX(noChao ? this.config.arrastoNoChao : this.config.arrastoNoAr);

    if (teclaEsquerda && !teclaDireita) {
      corpo.setAccelerationX(-this.config.aceleracao);
      this.olhandoDireita = false;
    } else if (teclaDireita && !teclaEsquerda) {
      corpo.setAccelerationX(this.config.aceleracao);
      this.olhandoDireita = true;
    } else {
      corpo.setAccelerationX(0);
    }

    // trava a velocidade horizontal no alvo (corrida vs caminhada) sem "estourar" com aceleração
    corpo.velocity.x = Phaser.Math.Clamp(corpo.velocity.x, -velocidadeAlvo, velocidadeAlvo);

    // pulo normal (só a partir do chão ou logo depois de sair da parede — coyote time de parede)
    if (teclaPular) {
      if (noChao) {
        corpo.setVelocityY(-this.config.velocidadePulo);
      } else if (podeAderir && this._tempoDesdeSoltouParede < this.config.janelaCoiotePulaParede) {
        corpo.setVelocityX(this._ultimoContatoParedeLado * -this.config.velocidadePuloDaParede.x);
        corpo.setVelocityY(-this.config.velocidadePuloDaParede.y);
      }
    }

    this._sincronizarVisual(deltaSegundos, noChao);
  }

  _atualizarBalancoTeia(deltaSegundos, teclaEsquerda, teclaDireita, teclaTeiaSegurando) {
    // segurar pra cima/baixo encurta ou alonga a corda (subir/descer balançando)
    if (this.teclas.cima.isDown || this.teclas.w.isDown) {
      this.webSwing.ajustarComprimento(-this.config.teiaVelocidadeAjusteComprimento * deltaSegundos);
    } else if (this.teclas.baixo.isDown) {
      this.webSwing.ajustarComprimento(this.config.teiaVelocidadeAjusteComprimento * deltaSegundos);
    }

    // um pequeno "bombeamento" horizontal ajuda a ganhar/perder momento no balanço
    if (teclaEsquerda) this.webSwing.velocidadeAngular -= 0.6 * deltaSegundos;
    if (teclaDireita) this.webSwing.velocidadeAngular += 0.6 * deltaSegundos;

    const novaPosicao = this.webSwing.atualizar(deltaSegundos);
    if (novaPosicao) {
      const posicaoAnterior = { x: this.sprite.x, y: this.sprite.y };
      const dx = novaPosicao.x - posicaoAnterior.x;
      const dy = novaPosicao.y - posicaoAnterior.y;
      const distancia = Math.hypot(dx, dy);
      // O corpo é movido manualmente pelo pêndulo. Passos pequenos evitam
      // que uma plataforma fina fique entre duas posições consecutivas.
      const passos = Math.max(1, Math.ceil(distancia / 2));
      let colidiu = false;

      // O pêndulo move o jogador manualmente. Fazemos subpassos e atualizamos
      // o corpo em cada um para não atravessar plataformas em alta velocidade.
      for (let passo = 1; passo <= passos; passo += 1) {
        const t = passo / passos;
        this.sprite.setPosition(posicaoAnterior.x + dx * t, posicaoAnterior.y + dy * t);
        this.sprite.body.updateFromGameObject();

        if (this._trajetoColideComGrupo()) colidiu = true;
        if (colidiu) break;
      }

      if (colidiu) {
        // Volta para o último ponto seguro e solta a teia. Assim a plataforma
        // bloqueia o trajeto em vez de deixar o corpo do jogador atravessá-la.
        this.sprite.setPosition(posicaoAnterior.x, posicaoAnterior.y);
        this.sprite.body.updateFromGameObject();
        this._soltarTeiaSePresa(false);
        this.sprite.body.setVelocity(0, 0);
      } else {
        this.olhandoDireita = this.webSwing.velocidadeAngular >= 0;
      }
    }
    this.estado = ESTADOS_JOGADOR.BALANCO_TEIA;
    this.sprite.body.setVelocity(0, 0); // a posição já é definida manualmente pelo pêndulo
  }

  _trajetoColideComGrupo() {
    const corpoJogador = this.sprite.body;
    const retanguloJogador = new Phaser.Geom.Rectangle(
      corpoJogador.x,
      corpoJogador.y,
      corpoJogador.width,
      corpoJogador.height
    );

    for (const grupo of this.colisores) {
      const objetos = grupo && typeof grupo.getChildren === "function"
        ? grupo.getChildren()
        : Array.isArray(grupo) ? grupo : [];

      for (const objeto of objetos) {
        const corpoColisor = objeto && objeto.body;
        if (!corpoColisor || !corpoColisor.enable) continue;

        const retanguloColisor = new Phaser.Geom.Rectangle(
          corpoColisor.x,
          corpoColisor.y,
          corpoColisor.width,
          corpoColisor.height
        );

        // Teste simétrico: bloqueia tanto vindo de cima quanto vindo de baixo.
        if (Phaser.Geom.Intersects.RectangleToRectangle(retanguloJogador, retanguloColisor)) {
          return true;
        }
      }
    }
    return false;
  }

  _soltarTeiaSePresa(impulsoExtraPulo = false) {
    if (!this.webSwing.presa) return;
    const velocidadeSaida = this.webSwing.soltar();
    this.sprite.body.setVelocity(velocidadeSaida.x, velocidadeSaida.y - (impulsoExtraPulo ? 120 : 0));
  }

  _consumirCliqueTeia() {
    if (this._cliqueTeiaConsumivel) {
      this._cliqueTeiaConsumivel = false;
      return true;
    }
    return false;
  }

  _listarAncorasAtivas() {
    // aceita tanto array simples de {x,y} quanto um grupo do Phaser
    if (Array.isArray(this.ancoras)) return this.ancoras;
    if (this.ancoras.getChildren) {
      return this.ancoras.getChildren().map((filho) => ({ x: filho.x, y: filho.y }));
    }
    return [];
  }

  _sincronizarVisual(deltaSegundos, noChao) {
    this.sprite.setFlipX(!this.olhandoDireita);
    this.webSwing.desenhar({ x: this.sprite.x, y: this.sprite.y });

    if (!this.webSwing.presa) {
      const corpo = this.sprite.body;
      if (this.estado === ESTADOS_JOGADOR.ADERENCIA_PAREDE && !(corpo.touching.left || corpo.touching.right)) {
        this.estado = noChao ? ESTADOS_JOGADOR.IDLE : ESTADOS_JOGADOR.CAINDO;
      }
      if (!noChao) {
        this.estado = corpo.velocity.y < 0 ? ESTADOS_JOGADOR.PULANDO : ESTADOS_JOGADOR.CAINDO;
      } else if (Math.abs(corpo.velocity.x) > this.config.velocidadeCaminhada + 5) {
        this.estado = ESTADOS_JOGADOR.CORRENDO;
      } else if (Math.abs(corpo.velocity.x) > 5) {
        this.estado = ESTADOS_JOGADOR.CAMINHANDO;
      } else {
        this.estado = ESTADOS_JOGADOR.IDLE;
      }
    }
    // estado === BALANCO_TEIA já foi setado em _atualizarBalancoTeia

    this._tocarAnimacaoDoEstado();
  }

  _tocarAnimacaoDoEstado() {
    if (!this.sprite.anims) return;
    const pose = ESTADO_PARA_POSE_ANIMACAO[this.estado] || "idle";
    if (pose === this._ultimaPoseAnimacao) return;
    const chave = window.QUIMERA_chaveFramePersonagem
      ? window.QUIMERA_chaveFramePersonagem(this.personagemId, pose)
      : null;
    if (chave && this.scene.anims.exists(chave)) {
      // As poses são texturas de um único frame. setTexture evita que o Phaser
      // mantenha o frame visual anterior ao entrar no balanço.
      this.sprite.setTexture(chave);
      this.sprite.anims.play(chave, true);
      this._ultimaPoseAnimacao = pose;
    }
  }

  destruir() {
    this.webSwing.destruir();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PlayerController, ESTADOS_JOGADOR };
}
if (typeof window !== "undefined") {
  window.QUIMERA_PlayerController = PlayerController;
  window.QUIMERA_ESTADOS_JOGADOR = ESTADOS_JOGADOR;
}
