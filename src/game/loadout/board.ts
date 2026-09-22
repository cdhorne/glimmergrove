/** Parked only. Clusters open when an attuned piece meets their aspect. */
import type { AspectId } from "../loot/catalog";

export type NodeDef = {
  id: string;
  cluster: AspectId;
  label: string;
  cost: number;
};

export type BoardState = {
  points: number;
  bought: string[];
};

export const NODES: NodeDef[] = [
  { id: "ward-1", cluster: "ward", label: "Hold", cost: 1 },
  { id: "ward-2", cluster: "ward", label: "Brace", cost: 1 },
  { id: "ward-3", cluster: "ward", label: "Bark", cost: 1 },
  { id: "ward-4", cluster: "ward", label: "Oak", cost: 1 },
  { id: "swift-1", cluster: "swift", label: "Step", cost: 1 },
  { id: "swift-2", cluster: "swift", label: "Slip", cost: 1 },
  { id: "swift-3", cluster: "swift", label: "Dash", cost: 1 },
  { id: "swift-4", cluster: "swift", label: "Gale", cost: 1 },
  { id: "tempo-1", cluster: "tempo", label: "Beat", cost: 1 },
  { id: "tempo-2", cluster: "tempo", label: "Cadence", cost: 1 },
  { id: "tempo-3", cluster: "tempo", label: "Rush", cost: 1 },
  { id: "tempo-4", cluster: "tempo", label: "Storm", cost: 1 },
];

export function emptyBoard(): BoardState {
  return { points: 1, bought: [] };
}

export function clusterOpen(aspects: string[], cluster: AspectId) {
  return aspects.includes(cluster);
}

export function buyNode(board: BoardState, nodeId: string, aspects: string[]): BoardState {
  const node = NODES.find((n) => n.id === nodeId);
  if (!node) return board;
  if (board.bought.includes(nodeId)) return board;
  if (!clusterOpen(aspects, node.cluster)) return board;
  if (board.points < node.cost) return board;
  return { points: board.points - node.cost, bought: [...board.bought, nodeId] };
}
