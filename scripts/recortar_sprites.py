from pathlib import Path
from PIL import Image
import json

ROOT = Path('/home/ubuntu/catalogo_quimera_omega/sprites')
OUT = Path('/home/ubuntu/catalogo_quimera_omega/sprites_recortados')
OUT.mkdir(parents=True, exist_ok=True)

animations = {
    'protagonista_sprites.png': ['idle', 'caminhada', 'corrida', 'aderencia_parede', 'balanco_teia', 'ataque_teia_comum', 'ataque_teia_eletrica', 'regeneracao'],
    'aranha_quimera_sprites.png': ['idle', 'rastejo', 'alerta_territorial', 'movimento_rapido', 'salto', 'mordida', 'veneno_mutagenico', 'morte'],
    'toupeira_gigante_sprites.png': ['idle', 'caminhada', 'escavacao_rapida', 'emergencia_solo', 'ataque_terra', 'golpe_garra', 'dano_desequilibrio', 'morte'],
    'homem_onca_sprites.png': ['postura_territorial', 'perseguicao', 'corrida', 'salto_agachado', 'ataque_garras', 'rugido', 'dano_humano', 'morte'],
    'fazendeiro_sprites.png': ['idle_espingarda', 'caminhada_lanterna', 'ataque_garfo', 'disparo', 'ataque_corda', 'investida', 'dano_regeneracao', 'morte'],
    'caes_mutantes_sprites.png': ['idle', 'farejo', 'corrida', 'ataque_grupo', 'salto_mordida', 'rosnado_alerta', 'preso_teia_prisao', 'morte'],
    'trex_mutante_sprites.png': ['idle_respiracao', 'caminhada', 'corrida', 'rugido', 'mordida', 'golpe_cauda', 'interrupcao_eletrica', 'morte'],
    'monstro_acido_sprites.png': ['idle_pulsacao', 'passagem_fresta', 'poca_acida', 'ataque_tentaculo', 'jorro_corrosivo', 'divisao_massas', 'dano_regeneracao', 'colapso_residuo'],
}

manifest = {'source': 'sprite sheets gerados para Quimera-Ω', 'frame_width': 320, 'frame_height': 1440, 'characters': {}}

for source_name, names in animations.items():
    source = ROOT / source_name
    if not source.exists():
        raise FileNotFoundError(source)
    image = Image.open(source).convert('RGBA')
    if image.width != 2560 or image.height != 1440:
        raise ValueError(f'{source_name}: dimensão inesperada {image.size}')
    character = source_name.replace('_sprites.png', '')
    target_dir = OUT / character
    target_dir.mkdir(parents=True, exist_ok=True)
    frames = []
    for i, animation in enumerate(names):
        frame = image.crop((i * 320, 0, (i + 1) * 320, 1440))
        filename = f'{i:02d}_{animation}.png'
        frame.save(target_dir / filename, 'PNG', optimize=True)
        frames.append({'index': i, 'animation': animation, 'file': f'{character}/{filename}'})
    manifest['characters'][character] = {'source': source_name, 'frames': frames}

(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Criados {sum(len(v) for v in animations.values())} frames em {len(animations)} personagens.')
