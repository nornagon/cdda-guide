import type {CddaData} from '../../data'
type SpawnLocation = {
  singularName: string;
  chance: number;
};
export function getItemSpawnLocations(data: CddaData, item_id: string): SpawnLocation[] {
  throw "not implemented";
}
