"use strict";

/* ==========================================================================
   ANIMAÇÕES — Quimera-Ω
   ==========================================================================
   Adaptado do phaser-animations.js que você gerou junto do recorte dos
   sprites, só que no mesmo padrão dos outros arquivos do projeto (script
   simples, sem import/export de módulo ES, pra não precisar de bundler nem
   de <script type="module">).

   Cada "animação" aqui é hoje 1 frame só (pose estática), porque foi assim
   que o recorte gerou os arquivos (uma imagem por pose, não uma esteira de
   vários frames por pose). Quando/se você gerar frames intermediários de
   movimento pra cada pose, é só trocar o `frames: [...]` de cada entrada em
   registrarAnimacoesPersonagem por uma sequência de chaves e ajustar o
   frameRate/repeat.
   ========================================================================== */

const QUIMERA_ANIMACOES = {
  protagonista: [
    ["idle", "00_idle.png"],
    ["caminhada", "01_caminhada.png"],
    ["corrida", "02_corrida.png"],
    ["aderencia_parede", "03_aderencia_parede.png"],
    ["balanco_teia", "04_balanco_teia.png"],
    ["ataque_teia_comum", "05_ataque_teia_comum.png"],
    ["ataque_teia_eletrica", "06_ataque_teia_eletrica.png"],
    ["regeneracao", "07_regeneracao.png"],
  ],
  aranha_quimera: [
    ["idle", "00_idle.png"], ["rastejo", "01_rastejo.png"], ["alerta_territorial", "02_alerta_territorial.png"],
    ["movimento_rapido", "03_movimento_rapido.png"], ["salto", "04_salto.png"], ["mordida", "05_mordida.png"],
    ["veneno_mutagenico", "06_veneno_mutagenico.png"], ["morte", "07_morte.png"],
  ],
  toupeira_gigante: [
    ["idle", "00_idle.png"], ["caminhada", "01_caminhada.png"], ["escavacao_rapida", "02_escavacao_rapida.png"],
    ["emergencia_solo", "03_emergencia_solo.png"], ["ataque_terra", "04_ataque_terra.png"], ["golpe_garra", "05_golpe_garra.png"],
    ["dano_desequilibrio", "06_dano_desequilibrio.png"], ["morte", "07_morte.png"],
  ],
  homem_onca: [
    ["postura_territorial", "00_postura_territorial.png"], ["perseguicao", "01_perseguicao.png"], ["corrida", "02_corrida.png"],
    ["salto_agachado", "03_salto_agachado.png"], ["ataque_garras", "04_ataque_garras.png"], ["rugido", "05_rugido.png"],
    ["dano_humano", "06_dano_humano.png"], ["morte", "07_morte.png"],
  ],
  fazendeiro: [
    ["idle_espingarda", "00_idle_espingarda.png"], ["caminhada_lanterna", "01_caminhada_lanterna.png"], ["ataque_garfo", "02_ataque_garfo.png"],
    ["disparo", "03_disparo.png"], ["ataque_corda", "04_ataque_corda.png"], ["investida", "05_investida.png"],
    ["dano_regeneracao", "06_dano_regeneracao.png"], ["morte", "07_morte.png"],
  ],
  caes_mutantes: [
    ["idle", "00_idle.png"], ["farejo", "01_farejo.png"], ["corrida", "02_corrida.png"],
    ["ataque_grupo", "03_ataque_grupo.png"], ["salto_mordida", "04_salto_mordida.png"], ["rosnado_alerta", "05_rosnado_alerta.png"],
    ["preso_teia_prisao", "06_preso_teia_prisao.png"], ["morte", "07_morte.png"],
  ],
  trex_mutante: [
    ["idle_respiracao", "00_idle_respiracao.png"], ["caminhada", "01_caminhada.png"], ["corrida", "02_corrida.png"],
    ["rugido", "03_rugido.png"], ["mordida", "04_mordida.png"], ["golpe_cauda", "05_golpe_cauda.png"],
    ["interrupcao_eletrica", "06_interrupcao_eletrica.png"], ["morte", "07_morte.png"],
  ],
  monstro_acido: [
    ["idle_pulsacao", "00_idle_pulsacao.png"], ["passagem_fresta", "01_passagem_fresta.png"], ["poca_acida", "02_poca_acida.png"],
    ["ataque_tentaculo", "03_ataque_tentaculo.png"], ["jorro_corrosivo", "04_jorro_corrosivo.png"], ["divisao_massas", "05_divisao_massas.png"],
    ["dano_regeneracao", "06_dano_regeneracao.png"], ["colapso_residuo", "07_colapso_residuo.png"],
  ],
};

/** Monta a chave de textura/animação padrão: "<personagem>-<pose>". */
function chaveFramePersonagem(personagem, nomePose) {
  return `${personagem}-${nomePose}`;
}

/**
 * Registra no loader da cena todas as imagens de um personagem.
 * Chamar dentro de preload(). As imagens ficam em
 * `${pastaBase}/<personagem>/<arquivo>` (ver manifest.json).
 */
function precarregarSpritesPersonagem(scene, personagem, pastaBase = "assets/sprites") {
  const poses = QUIMERA_ANIMACOES[personagem];
  if (!poses) throw new Error(`Personagem sem animações mapeadas: ${personagem}`);
  for (const [nomePose, arquivo] of poses) {
    scene.load.image(chaveFramePersonagem(personagem, nomePose), `${pastaBase}/${personagem}/${arquivo}`);
  }
}

/**
 * Cria as animações (hoje, poses estáticas de 1 frame) de um personagem.
 * Chamar dentro de create(), depois que os assets já foram carregados.
 */
function registrarAnimacoesPersonagem(scene, personagem) {
  const poses = QUIMERA_ANIMACOES[personagem];
  if (!poses) throw new Error(`Personagem sem animações mapeadas: ${personagem}`);
  for (const [nomePose] of poses) {
    const chave = chaveFramePersonagem(personagem, nomePose);
    if (scene.anims.exists(chave)) continue;
    scene.anims.create({ key: chave, frames: [{ key: chave }], frameRate: 1, repeat: 0 });
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { QUIMERA_ANIMACOES, chaveFramePersonagem, precarregarSpritesPersonagem, registrarAnimacoesPersonagem };
}
if (typeof window !== "undefined") {
  window.QUIMERA_ANIMACOES = QUIMERA_ANIMACOES;
  window.QUIMERA_chaveFramePersonagem = chaveFramePersonagem;
  window.QUIMERA_precarregarSpritesPersonagem = precarregarSpritesPersonagem;
  window.QUIMERA_registrarAnimacoesPersonagem = registrarAnimacoesPersonagem;
}
