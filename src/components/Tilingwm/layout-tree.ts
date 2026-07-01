// Every window lives at exactly one leaf. Resizing changes a split's ratio.

export type SplitDir = "row" | "col";
export type PathSeg = "a" | "b";
export type Path = PathSeg[];

export type Edge = "left" | "right" | "top" | "bottom" | "center";
export type DropEdge = Exclude<Edge, "center">;

export type LayoutNode =
  | { type: "leaf"; windowId: string }
  | { type: "split"; dir: SplitDir; ratio: number; a: LayoutNode; b: LayoutNode };

export const initialLayout: LayoutNode = {
  type: "split",
  dir: "row",
  ratio: 0.44,
  a: { type: "leaf", windowId: "w1" },
  b: {
    type: "split",
    dir: "col",
    ratio: 0.54,
    a: { type: "leaf", windowId: "w2" },
    b: { type: "leaf", windowId: "w3" },
  },
};

/** Remove a leaf from the tree; its sibling absorbs the freed space. */
export function removeLeaf(node: LayoutNode, windowId: string): LayoutNode {
  if (node.type === "leaf") return node;
  if (node.a.type === "leaf" && node.a.windowId === windowId) return node.b;
  if (node.b.type === "leaf" && node.b.windowId === windowId) return node.a;
  return { ...node, a: removeLeaf(node.a, windowId), b: removeLeaf(node.b, windowId) };
}

/** Split the target leaf's space in two, placing a new leaf on the given edge. */
export function insertLeafNextTo(
  node: LayoutNode,
  targetWindowId: string,
  newWindowId: string,
  edge: DropEdge
): LayoutNode {
  if (node.type === "leaf") {
    if (node.windowId !== targetWindowId) return node;
    const newLeaf: LayoutNode = { type: "leaf", windowId: newWindowId };
    const dir: SplitDir = edge === "left" || edge === "right" ? "row" : "col";
    const [a, b] = edge === "left" || edge === "top" ? [newLeaf, node] : [node, newLeaf];
    return { type: "split", dir, ratio: 0.5, a, b };
  }
  return {
    ...node,
    a: insertLeafNextTo(node.a, targetWindowId, newWindowId, edge),
    b: insertLeafNextTo(node.b, targetWindowId, newWindowId, edge),
  };
}

/** Swap two windows' contents without touching the tree shape (center drop). */
export function swapLeaves(node: LayoutNode, idA: string, idB: string): LayoutNode {
  if (node.type === "leaf") {
    if (node.windowId === idA) return { type: "leaf", windowId: idB };
    if (node.windowId === idB) return { type: "leaf", windowId: idA };
    return node;
  }
  return { ...node, a: swapLeaves(node.a, idA, idB), b: swapLeaves(node.b, idA, idB) };
}

/** Set the ratio of the split located at `path`. */
export function updateRatioAtPath(node: LayoutNode, path: Path, ratio: number): LayoutNode {
  if (path.length === 0) {
    return node.type === "split" ? { ...node, ratio } : node;
  }
  if (node.type !== "split") return node;
  const [head, ...rest] = path;
  return { ...node, [head]: updateRatioAtPath(node[head], rest, ratio) };
}
