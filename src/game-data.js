"use strict";

/* ==========================================================================
   SPIDER MUTATION (Quimera-Ω) — ESTRUTURA DE DADOS DO JOGO
   ==========================================================================
   Este arquivo organiza Atos, Regiões, Poderes e Personagens/Chefes em dados
   puros (sem lógica de renderização), pra servir de "fonte da verdade" pro
   resto do código consultar.

   REGRA DE ACURÁCIA (herdada do catálogo de personagens):
   - Campos normais = confirmados no documento de conceito (GDD).
   - Campos com sufixo "ReferenciaVisual" = vieram só da arte conceitual
     (tamanho, paleta, comportamento visual). Não são fatos narrativos
     adicionais — são referência de implementação visual/gameplay.
   - Nomes não confirmados no GDD (ex: "Jalke Jaguar" pro Homem-Onça) NÃO
     entram aqui como nome canônico.

   Como usar em outro arquivo:
     <script src="game_data.js"></script>
     <script src="seu-jogo.js"></script>
   E no seu-jogo.js: QUIMERA.dados / new QUIMERA.GerenciadorProgressao()

   Também funciona em Node (module.exports) se quiser testar a lógica isolada.
   ========================================================================== */

// ---------------------------------------------------------------------------
// DADOS POR TIPO
// ---------------------------------------------------------------------------

const REGIOES = {
  centro_pesquisa: {
    id: "centro_pesquisa",
    nome: "Centro de Pesquisa",
    caracteristicas: "Laboratórios destruídos, salas de contenção e sistemas de segurança",
    desafioPrincipal: "Primeiros mutantes e armadilhas",
    recompensa: "Habilidades básicas e registros",
    atoId: "ato1",
    paletaReferencia: ["cinza", "azul", "vermelho de emergência"], // paleta descrita p/ áreas urbanas/cidade
  },
  esgotos: {
    id: "esgotos",
    nome: "Esgotos",
    caracteristicas: "Túneis alagados, galerias contaminadas e ninhos",
    desafioPrincipal: "Toupeira Gigante",
    recompensa: "Teia Elétrica",
    atoId: "ato2",
    paletaReferencia: ["verde tóxico", "sombras profundas"],
  },
  floresta_cidade_abandonada: {
    id: "floresta_cidade_abandonada",
    nome: "Floresta e Cidade Abandonada",
    caracteristicas: "Vegetação mutante e casas vazias",
    desafioPrincipal: "Homem-Onça",
    recompensa: "Invisibilidade temporária",
    atoId: "ato3",
    paletaReferencia: ["verde escuro", "roxo", "tons orgânicos"],
  },
  fazenda_experimental: {
    id: "fazenda_experimental",
    nome: "Fazenda Experimental",
    caracteristicas: "Celeiros, plantações e laboratórios rurais",
    desafioPrincipal: "Cães mutantes e Fazendeiro",
    recompensa: "Teia de Prisão",
    atoId: "ato4",
    // a paleta começa quente e vai sendo dominada por tons doentes ao longo do ato
    paletaReferencia: ["tons quentes (início)", "tons doentes (progressão)"],
  },
  laboratorio_central: {
    id: "laboratorio_central",
    nome: "Laboratório Central",
    caracteristicas: "Reator, câmara fóssil e setores colapsados",
    desafioPrincipal: "T-Rex e Monstro Ácido",
    recompensa: "Desfecho da história",
    atoId: "ato6",
    atosRelacionados: ["ato5", "ato6"], // O Retorno (V) também se passa aqui
    paletaReferencia: ["tons de emergência, coerente com a identidade da cidade/laboratório"],
  },
};

const PODERES = {
  sentido_aracnideo: {
    id: "sentido_aracnideo",
    nome: "Sentido-Aracnídeo",
    funcaoCombate: "Detecta ataques, inimigos ocultos e pontos vulneráveis; avisa o jogador sobre esquiva ou contra-ataque",
    funcaoExploracao: "Revela passagens secretas, armadilhas, rastros, paredes frágeis, sons atrás de portas e concentrações de Quimera-Ω",
    desbloqueadoNoAtoId: "ato1",
    desbloqueadoAposChefeId: null,
    representacaoVisual: "Alterações na paleta de cores e sinais vibratórios ao redor do personagem",
  },
  forca_agilidade: {
    id: "forca_agilidade",
    nome: "Força e Agilidade",
    funcaoCombate: "Permite combos, esquivas, acrobacias e ataques contra criaturas maiores",
    funcaoExploracao: "Aumenta saltos e permite mover objetos pesados",
    desbloqueadoNoAtoId: "ato1",
    desbloqueadoAposChefeId: null,
  },
  aderencia: {
    id: "aderencia",
    nome: "Aderência",
    funcaoCombate: "Permite atacar a partir de paredes e tetos",
    funcaoExploracao: "Permite escalar prédios, cavernas e estruturas",
    desbloqueadoNoAtoId: "ato1", // "parte da evolução inicial"
    desbloqueadoAposChefeId: null,
  },
  teia_comum: {
    id: "teia_comum",
    nome: "Teia comum",
    funcaoCombate: "Prende inimigos leves e interrompe ações",
    funcaoExploracao: "Cria pontos de balanço e ativa mecanismos",
    desbloqueadoNoAtoId: "ato1",
    desbloqueadoAposChefeId: null,
  },
  teia_eletrica: {
    id: "teia_eletrica",
    nome: "Teia Elétrica",
    funcaoCombate: "Atordoa inimigos, conduz descargas e conecta alvos a objetos",
    funcaoExploracao: "Liga painéis e geradores, eletrifica água e ativa máquinas antigas",
    desbloqueadoNoAtoId: "ato2",
    desbloqueadoAposChefeId: "toupeira_gigante",
  },
  invisibilidade_temporaria: {
    id: "invisibilidade_temporaria",
    nome: "Invisibilidade temporária",
    funcaoCombate: "Permite ataques furtivos, fuga, reposicionamento e ataques surpresa",
    funcaoExploracao: "Facilita atravessar áreas vigiadas sem combate",
    desbloqueadoNoAtoId: "ato3",
    desbloqueadoAposChefeId: "homem_onca",
    duracaoCurta: true, // ruídos, ataques ou contato direto revelam a posição
  },
  teia_prisao: {
    id: "teia_prisao",
    nome: "Teia de Prisão",
    funcaoCombate: "Imobiliza inimigos resistentes e abre janelas contra chefes",
    funcaoExploracao: "Bloqueia passagens, cria barreiras, remove obstáculos e forma plataformas temporárias",
    desbloqueadoNoAtoId: "ato4",
    desbloqueadoAposChefeId: "fazendeiro",
    enduraceRapido: true,
  },
  regeneracao_controlada: {
    id: "regeneracao_controlada",
    nome: "Regeneração controlada",
    funcaoCombate: "Recupera parte da vida",
    funcaoExploracao: "Aumenta a resistência em áreas contaminadas",
    desbloqueadoNoAtoId: null, // não ligada a um ato/chefe específico
    desbloqueadoAposChefeId: null,
    evoluiComRecursos: true, // melhora com componentes científicos, amostras, baterias, registros
  },
};

const ATOS = [
  {
    id: "ato1", numero: "I", nome: "O Acidente",
    evento: "Explosão do laboratório e mordida da aranha",
    regiaoId: "centro_pesquisa",
    personagensCentraisIds: ["protagonista", "aranha_mutada"],
    poderesConcedidosIds: ["sentido_aracnideo", "forca_agilidade", "aderencia", "teia_comum"],
  },
  {
    id: "ato2", numero: "II", nome: "O Subsolo",
    evento: "Exploração dos esgotos e batalha subterrânea",
    regiaoId: "esgotos",
    personagensCentraisIds: ["toupeira_gigante"],
    poderesConcedidosIds: ["teia_eletrica"],
  },
  {
    id: "ato3", numero: "III", nome: "O Território Selvagem",
    evento: "Investigação da floresta e confronto de perseguição",
    regiaoId: "floresta_cidade_abandonada",
    personagensCentraisIds: ["homem_onca"],
    poderesConcedidosIds: ["invisibilidade_temporaria"],
  },
  {
    id: "ato4", numero: "IV", nome: "A Fazenda",
    evento: "Centro de testes rural e arena com cães",
    regiaoId: "fazenda_experimental",
    personagensCentraisIds: ["fazendeiro", "caes_mutantes"],
    poderesConcedidosIds: ["teia_prisao"],
  },
  {
    id: "ato5", numero: "V", nome: "O Retorno",
    evento: "Retorno ao laboratório e descoberta da verdade",
    regiaoId: "laboratorio_central",
    personagensCentraisIds: ["protagonista"], // + registros e cientistas transformados (sem entidade jogável própria)
    poderesConcedidosIds: [], // "aprimoramento dos poderes" já existentes, não um poder novo
  },
  {
    id: "ato6", numero: "VI", nome: "A Quimera",
    evento: "Batalhas finais no Laboratório Central",
    regiaoId: "laboratorio_central",
    personagensCentraisIds: ["t_rex", "monstro_acido"],
    poderesConcedidosIds: [], // desfecho e escolha final, sem novo poder
  },
];

const PERSONAGENS = {
  protagonista: {
    id: "protagonista",
    nome: "Protagonista",
    categoria: "Humano mutado",
    vinculo: "Centro de Pesquisa e todas as regiões",
    funcaoPrincipal: "Personagem jogável e investigador",
    jogavel: true,
    alturaMetrosReferenciaVisual: 1.76,
    aparenciaReferenciaVisual: {
      boneComSimboloAranha: true,
      camisaBrancaAberta: true,
      gravataPreta: true,
      calcaMarromLarga: true,
      sapatosSociaisPretos: true,
      foneIntraAuricularComFio: true,
      olhosDeAranhaVermelhos: "concentrados em um lado do rosto",
      cicatrizMordidaNoPeito: true,
    },
    poderesIds: Object.keys(PODERES), // todos os poderes pertencem ao protagonista
  },

  aranha_mutada: {
    id: "aranha_mutada",
    nome: "Aranha Mutada",
    categoria: "Vetor biológico",
    vinculo: "Laboratório e origem da infecção",
    funcaoPrincipal: "Evento desencadeador da mutação",
    jogavel: false,
    regiaoId: "centro_pesquisa",
    tamanhoCmReferenciaVisual: [3, 5],
    comportamentoReferenciaVisual: [
      "pequena e ágil", "extremamente agressiva",
      "veneno mutagênico", "camuflagem em ambientes escuros e úmidos",
      "comportamento territorial",
    ],
    funcaoNarrativaConfirmadaPDF: "Transmissão do agente ao protagonista por meio da mordida",
  },

  toupeira_gigante: {
    id: "toupeira_gigante",
    nome: "Toupeira Gigante",
    categoria: "Chefe mutante",
    tipo: "chefe",
    regiaoId: "esgotos",
    atoId: "ato2",
    funcaoPrincipal: "Primeiro grande chefe e guardiã da Teia Elétrica",
    alturaMetrosReferenciaVisual: 3.5,
    caracteristicasReferenciaVisual: [
      "olhos adaptados à escuridão", "dentes afiados", "mandíbula forte",
      "garras de escavação extremamente resistentes",
      "pele grossa resistente à contaminação",
      "escavação ultrarrápida", "ataque de terra",
    ],
    arenaDesignNotes: "Arena subterrânea com túneis que se alteram durante o combate. Combate exige leitura de padrões, esquiva de ataques de escavação e uso do ambiente.",
    fraquezaBiologicaEspecifica: null, // PDF não define; decisão futura de implementação
    recompensaAoDerrotarPoderId: "teia_eletrica",
  },

  homem_onca: {
    id: "homem_onca",
    nome: "Homem-Onça",
    categoria: "Chefe humano mutado",
    tipo: "chefe",
    regiaoId: "floresta_cidade_abandonada",
    atoId: "ato3",
    funcaoPrincipal: "Chefe de perseguição e furtividade",
    loreNota: "Antigo morador/guarda florestal exposto ao agente protegendo a família. Conserva fragmentos de consciência humana.",
    nomeNaoCanonico: "Jalke Jaguar (nome de arquivo do protótipo — NÃO confirmado pelo GDD, não usar como canônico)",
    caracteristicasReferenciaVisual: [
      "orelhas e cauda felinas", "padrão de pelagem onça-pintada",
      "olhos amarelos com visão noturna e aguçada",
      "audição aguçada", "garras retráteis",
    ],
    encontroDesignNotes: "Baseado em velocidade, furtividade e perseguição; pode desaparecer entre vegetação e estruturas.",
    recompensaAoDerrotarPoderId: "invisibilidade_temporaria",
  },

  fazendeiro: {
    id: "fazendeiro",
    nome: "Fazendeiro",
    categoria: "Chefe humano mutado",
    tipo: "chefe",
    regiaoId: "fazenda_experimental",
    atoId: "ato4",
    funcaoPrincipal: "Controlador da arena rural e dos cães",
    loreNota: "Exposição prolongada à Quimera-Ω: força, regeneração e agressividade, mas ainda com aparência humana.",
    caracteristicasReferenciaVisual: [
      "chapéu, camisa xadrez, macacão, botas",
      "mão mutante (força e resistência aumentadas)",
    ],
    equipamentosReferenciaVisual: ["espingarda", "garfo", "corda", "lanterna"],
    designNotes: "PDF não confirma qual equipamento é usado em combate nem define nome próprio.",
    recompensaAoDerrotarPoderId: "teia_prisao",
  },

  caes_mutantes: {
    id: "caes_mutantes",
    nome: "Cães Mutantes",
    categoria: "Inimigos mutados",
    tipo: "inimigo_comum_em_grupo",
    regiaoId: "fazenda_experimental",
    atoId: "ato4",
    funcaoPrincipal: "Guarda, caça e combate em grupo",
    comportamento: [
      "alguns atacam em grupo",
      "alguns farejam o protagonista mesmo quando invisível",
    ],
    contraMedidaRecomendadaPoderId: "teia_prisao",
    variacoesReferenciaVisual: [
      { tipo: "cão maior", idadeAnosReferencia: [7, 8], perfil: "mais forte, experiente e agressivo" },
      { tipo: "cão jovem", idadeAnosReferencia: 1, perfil: "mais ágil, inteligente e arisco" },
    ],
  },

  t_rex: {
    id: "t_rex",
    nome: "T-Rex Mutante",
    categoria: "Chefe revivido e reconstruído",
    tipo: "chefe",
    regiaoId: "laboratorio_central",
    atoId: "ato6",
    funcaoPrincipal: "Manifestação do projeto Ressurreição Ômega",
    alturaMetrosReferenciaVisual: 12,
    caracteristicasReferenciaVisual: ["força bruta", "regeneração acelerada", "comportamento agressivo"],
    poderesNecessariosParaEnfrentarIds: ["teia_eletrica", "teia_prisao", "invisibilidade_temporaria"],
    designNotes: "Teia Elétrica interrompe sistemas que o fortalecem; Teia de Prisão limita movimentos; Invisibilidade permite reposicionamento.",
  },

  monstro_acido: {
    id: "monstro_acido",
    nome: "Monstro Ácido",
    apelidoReferenciaVisual: "Gosma (forma final)",
    categoria: "Chefe final e forma terminal",
    tipo: "chefe_final",
    regiaoId: "laboratorio_central",
    atoId: "ato6",
    funcaoPrincipal: "Núcleo vivo do horror químico e desfecho",
    tamanhoMetrosReferenciaVisual: [10, 15],
    loreNota: "Fusão de corpos humanos, produtos químicos e doses extremas de Quimera-Ω. Fragmentos das consciências dos cientistas permanecem dentro da criatura.",
    caracteristicasReferenciaVisual: [
      "forma líquida e maleável", "divisão em partes menores",
      "reconstrução após destruição", "absorção e cópia de matéria orgânica",
      "alta resistência", "regeneração acelerada",
    ],
  },
};

// ---------------------------------------------------------------------------
// FUNÇÕES DE CONSULTA (helpers)
// ---------------------------------------------------------------------------

function obterAtoPorId(id) { return ATOS.find(a => a.id === id) || null; }
function obterProximoAto(idAtoAtual) {
  const idx = ATOS.findIndex(a => a.id === idAtoAtual);
  if (idx === -1 || idx === ATOS.length - 1) return null;
  return ATOS[idx + 1];
}
function obterRegiaoPorId(id) { return REGIOES[id] || null; }
function obterPoderPorId(id) { return PODERES[id] || null; }
function obterPersonagemPorId(id) { return PERSONAGENS[id] || null; }
function obterChefesDaRegiao(regiaoId) {
  return Object.values(PERSONAGENS).filter(p => p.regiaoId === regiaoId && (p.tipo === "chefe" || p.tipo === "chefe_final"));
}

// ---------------------------------------------------------------------------
// GERENCIADOR DE PROGRESSÃO
// ---------------------------------------------------------------------------
// Guarda o estado de save do jogador: ato atual, poderes desbloqueados,
// chefes derrotados e regiões visitadas. Não depende de nada de renderização
// — é seguro usar tanto no motor do jogo quanto em testes isolados.

class GerenciadorProgressao {
  constructor() {
    this.atoAtualId = null; // null = ainda não começou (antes do acidente)
    this.poderesDesbloqueados = new Set();
    this.chefesDerrotados = new Set();
    this.regioesVisitadas = new Set();
  }

  /** Inicia a campanha: entra no Ato I e concede os poderes iniciais. */
  iniciarCampanha() {
    this._entrarNoAto("ato1");
  }

  /** Marca um chefe como derrotado, concede a recompensa do ato dele e avança. */
  derrotarChefe(chefeId) {
    const personagem = obterPersonagemPorId(chefeId);
    if (!personagem) throw new Error(`Personagem desconhecido: ${chefeId}`);
    this.chefesDerrotados.add(chefeId);

    if (personagem.recompensaAoDerrotarPoderId) {
      this.poderesDesbloqueados.add(personagem.recompensaAoDerrotarPoderId);
    }

    // se esse chefe é o marco final de um ato, avança pro próximo
    const atoDoChefe = ATOS.find(a => a.personagensCentraisIds.includes(chefeId));
    if (atoDoChefe && atoDoChefe.id === this.atoAtualId) {
      const proximo = obterProximoAto(this.atoAtualId);
      if (proximo) this._entrarNoAto(proximo.id);
    }
  }

  /** Avança manualmente pro próximo ato (ex: eventos de história sem "chefe", como o Ato V). */
  avancarAto() {
    const proximo = obterProximoAto(this.atoAtualId);
    if (proximo) this._entrarNoAto(proximo.id);
    return proximo;
  }

  _entrarNoAto(atoId) {
    const ato = obterAtoPorId(atoId);
    if (!ato) throw new Error(`Ato desconhecido: ${atoId}`);
    this.atoAtualId = atoId;
    this.regioesVisitadas.add(ato.regiaoId);
    for (const poderId of ato.poderesConcedidosIds) {
      this.poderesDesbloqueados.add(poderId);
    }
  }

  temPoder(poderId) { return this.poderesDesbloqueados.has(poderId); }
  chefeFoiDerrotado(chefeId) { return this.chefesDerrotados.has(chefeId); }
  regiaoFoiVisitada(regiaoId) { return this.regioesVisitadas.has(regiaoId); }

  obterAtoAtual() { return this.atoAtualId ? obterAtoPorId(this.atoAtualId) : null; }
  obterRegiaoAtual() {
    const ato = this.obterAtoAtual();
    return ato ? obterRegiaoPorId(ato.regiaoId) : null;
  }
  listarPoderesDesbloqueados() {
    return [...this.poderesDesbloqueados].map(obterPoderPorId);
  }

  /** Serializa o progresso pra salvar (ex: localStorage do lado de fora do artifact, ou window.storage). */
  paraJSON() {
    return {
      atoAtualId: this.atoAtualId,
      poderesDesbloqueados: [...this.poderesDesbloqueados],
      chefesDerrotados: [...this.chefesDerrotados],
      regioesVisitadas: [...this.regioesVisitadas],
    };
  }

  /** Restaura o progresso a partir do formato gerado por paraJSON(). */
  static deJSON(dados) {
    const g = new GerenciadorProgressao();
    g.atoAtualId = dados.atoAtualId || null;
    g.poderesDesbloqueados = new Set(dados.poderesDesbloqueados || []);
    g.chefesDerrotados = new Set(dados.chefesDerrotados || []);
    g.regioesVisitadas = new Set(dados.regioesVisitadas || []);
    return g;
  }
}

// ---------------------------------------------------------------------------
// EXPORTAÇÃO (funciona em <script> no navegador e em Node/CommonJS)
// ---------------------------------------------------------------------------

const QUIMERA = {
  dados: { ATOS, REGIOES, PODERES, PERSONAGENS },
  GerenciadorProgressao,
  obterAtoPorId, obterProximoAto, obterRegiaoPorId, obterPoderPorId,
  obterPersonagemPorId, obterChefesDaRegiao,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = QUIMERA;
}
if (typeof window !== "undefined") {
  window.QUIMERA = QUIMERA;
}
