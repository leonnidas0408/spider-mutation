"use strict";

/* ==========================================================================
   WEB SWING — física de balanço com a Teia (Quimera-Ω)
   ==========================================================================
   Implementa o balanço tipo pêndulo usado pela Teia comum (e reaproveitável
   pela Teia Elétrica/Teia de Prisão no futuro) sem depender de um motor de
   física com joints nativos (Arcade Physics não tem). A cada frame, o ponto
   de ancoragem fica fixo e o jogador se move sobre um arco ao redor dele;
   ao soltar, a velocidade tangencial vira velocidade linear normal.

   Não depende de renderização — pode ser testado isolado.
   ========================================================================== */

class WebSwing {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} opcoes
   * @param {number} [opcoes.comprimentoMinimo=40] - distância mínima da corda
   * @param {number} [opcoes.comprimentoMaximo=260] - alcance máximo do disparo de teia
   * @param {number} [opcoes.amortecimento=0.999] - perda de energia por frame (1 = sem perda)
   * @param {number} [opcoes.gravidade=900] - deve casar com a gravidade da cena
   */
  constructor(scene, opcoes = {}) {
    this.scene = scene;
    this.comprimentoMinimo = opcoes.comprimentoMinimo ?? 40;
    this.comprimentoMaximo = opcoes.comprimentoMaximo ?? 260;
    this.amortecimento = opcoes.amortecimento ?? 0.999;
    this.gravidade = opcoes.gravidade ?? 900;

    this.presa = false;
    this.ancora = null; // { x, y }
    this.comprimentoCorda = 0;
    this.angulo = 0; // radianos, 0 = corda apontando reto para baixo
    this.velocidadeAngular = 0;

    // linha visual da teia (fica escondida quando não presa)
    this.grafico = scene.add.graphics();
    this.grafico.setDepth(50);
  }

  /**
   * Tenta encontrar a âncora válida mais próxima dentro do alcance e acima
   * (ou ao lado) do jogador, e prender a teia nela.
   * @param {Array<{x:number,y:number}>} ancorasDisponiveis
   * @param {{x:number,y:number}} posJogador
   * @param {{x:number,y:number}} velocidadeAtual
   * @returns {boolean} true se conseguiu prender
   */
  tentarPrender(ancorasDisponiveis, posJogador, velocidadeAtual) {
    let melhor = null;
    let melhorDistancia = Infinity;

    for (const ancora of ancorasDisponiveis) {
      const dx = ancora.x - posJogador.x;
      const dy = ancora.y - posJogador.y;
      const distancia = Math.hypot(dx, dy);

      // só aceita âncoras dentro do alcance e que fiquem acima do jogador
      // (evita "prender" teia em pontos abaixo dos pés, o que não faz sentido)
      if (distancia <= this.comprimentoMaximo && distancia >= this.comprimentoMinimo && dy < 0) {
        if (distancia < melhorDistancia) {
          melhorDistancia = distancia;
          melhor = ancora;
        }
      }
    }

    if (!melhor) return false;

    this.prender(melhor, posJogador, velocidadeAtual);
    return true;
  }

  /** Prende a teia numa âncora específica, convertendo a velocidade atual em velocidade angular. */
  prender(ancora, posJogador, velocidadeAtual) {
    this.ancora = { x: ancora.x, y: ancora.y };

    const dx = posJogador.x - ancora.x;
    const dy = posJogador.y - ancora.y;
    this.comprimentoCorda = Phaser.Math.Clamp(Math.hypot(dx, dy), this.comprimentoMinimo, this.comprimentoMaximo);

    // ângulo medido a partir do eixo vertical (0 = pendurado reto pra baixo)
    this.angulo = Math.atan2(dx, dy);

    // componente tangencial da velocidade atual vira velocidade angular inicial
    const tangenteX = Math.cos(this.angulo);
    const tangenteY = -Math.sin(this.angulo);
    const velocidadeTangencial = velocidadeAtual.x * tangenteX + velocidadeAtual.y * tangenteY;
    this.velocidadeAngular = velocidadeTangencial / this.comprimentoCorda;

    this.presa = true;
  }

  /** Solta a teia e devolve a velocidade linear resultante para aplicar no corpo do jogador. */
  soltar() {
    if (!this.presa) return { x: 0, y: 0 };

    const velocidadeTangencial = this.velocidadeAngular * this.comprimentoCorda;
    const velocidade = {
      x: velocidadeTangencial * Math.cos(this.angulo),
      y: -velocidadeTangencial * Math.sin(this.angulo),
    };

    this.presa = false;
    this.ancora = null;
    this.grafico.clear();

    return velocidade;
  }

  /**
   * Avança a simulação do pêndulo em um passo de tempo.
   * @param {number} deltaSegundos
   * @returns {{x:number,y:number}|null} nova posição do jogador, ou null se não estiver presa
   */
  atualizar(deltaSegundos) {
    if (!this.presa) return null;

    // equação do pêndulo simples: aceleração angular = -(g / L) * sin(ângulo)
    const aceleracaoAngular = -(this.gravidade / this.comprimentoCorda) * Math.sin(this.angulo);
    this.velocidadeAngular += aceleracaoAngular * deltaSegundos;
    this.velocidadeAngular *= this.amortecimento;
    this.angulo += this.velocidadeAngular * deltaSegundos;

    const x = this.ancora.x + this.comprimentoCorda * Math.sin(this.angulo);
    const y = this.ancora.y + this.comprimentoCorda * Math.cos(this.angulo);
    return { x, y };
  }

  /** Encurta ou alonga a corda em tempo real (ex: segurar pra subir/descer na teia). */
  ajustarComprimento(delta) {
    if (!this.presa) return;
    this.comprimentoCorda = Phaser.Math.Clamp(
      this.comprimentoCorda + delta,
      this.comprimentoMinimo,
      this.comprimentoMaximo
    );
  }

  /** Desenha a linha da teia entre a âncora e o jogador. Chamar todo frame no render/update. */
  desenhar(posJogador, cor = 0xffffff) {
    this.grafico.clear();
    if (!this.presa || !this.ancora) return;
    this.grafico.lineStyle(2, cor, 0.9);
    this.grafico.lineBetween(this.ancora.x, this.ancora.y, posJogador.x, posJogador.y);
    this.grafico.fillStyle(cor, 1);
    this.grafico.fillCircle(this.ancora.x, this.ancora.y, 4);
  }

  destruir() {
    this.grafico.destroy();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { WebSwing };
}
if (typeof window !== "undefined") {
  window.QUIMERA_WebSwing = WebSwing;
}
