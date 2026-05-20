import type { Palette } from '../../theme';
import { SceneFjord } from './SceneFjord';
import { ScenePeak } from './ScenePeak';
import { SceneAlpine } from './SceneAlpine';
import { SceneTown } from './SceneTown';

export type SceneKey = 'fjord' | 'peak' | 'alpine' | 'town';

export function HikeScene({ scene, palette }: { scene?: SceneKey; palette: Palette }) {
  if (scene === 'peak') return <ScenePeak palette={palette} />;
  if (scene === 'alpine') return <SceneAlpine palette={palette} />;
  if (scene === 'town') return <SceneTown palette={palette} />;
  return <SceneFjord palette={palette} />;
}
