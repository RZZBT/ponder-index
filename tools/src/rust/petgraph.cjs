// petgraph: 7 animations (#114-120). Node weights are the names shown in the circles.
const { graph, Scene } = require('./scene.cjs');
const A = [];
const add = (key, title, description, build, rs, expect, claim) => A.push({ key, title, description, build, rs, expect, claim });

// Truth helpers: a DiGraph / UnGraph from names and edges.
const DI = (names, edges, w = false) => `let mut g = DiGraph::<&str, ${w ? 'u32' : '()'}>::new(); let n: Vec<NodeIndex> = [${names.map((x) => `"${x}"`).join(', ')}].iter().map(|x| g.add_node(*x)).collect(); ${edges.map(([u, v, wt]) => `g.add_edge(n[${names.indexOf(u)}], n[${names.indexOf(v)}], ${w ? wt : '()'});`).join(' ')}`;

const DJ = { A: [180, 330], B: [480, 210], C: [480, 450], D: [800, 330] };
const DJE = [['A', 'B', 4], ['A', 'C', 1], ['C', 'B', 2], ['B', 'D', 1], ['C', 'D', 5]];
add('dijkstra', 'How petgraph::algo::dijkstra() works', 'Shortest distances from one node, settling the closest unvisited node first.', () => graph({
  call: 'dijkstra(&g, a, None, |e| *e.weight())', note: 'shortest distance from A to every node', nodes: DJ, edges: DJE, directed: true,
  labels: { A: '0', B: '∞', C: '∞', D: '∞' }, labelDx: 46, labelDy: -40,
  intro: 'dijkstra() keeps a best-known distance for every node. It starts with 0 for A and "unknown" (∞) for the rest.',
  steps: [
    { cap: 'A is the closest unsettled node (0): settle it. Through its edges, B can be reached in 4 and C in 1.', nodes: { A: 'success' }, edges: { 'A-B': 'warning', 'A-C': 'warning' }, labels: { B: '4', C: '1' } },
    { cap: 'C (1) is now the closest unsettled node: settle it. Via C, B costs 1 + 2 = 3, better than 4. D costs 1 + 5 = 6.', nodes: { C: 'success' }, edges: { 'A-B': 'muted', 'C-B': 'warning', 'C-D': 'warning' }, labels: { B: '3', D: '6' } },
    { cap: 'B (3) is next: settle it. Via B, D costs 3 + 1 = 4, better than 6.', nodes: { B: 'success' }, edges: { 'C-D': 'muted', 'B-D': 'warning' }, labels: { D: '4' } },
    { cap: 'D (4) is the last node. A settled node never gets a better distance later, because all weights are ≥ 0.', nodes: { D: 'success' } },
  ],
  result: 'A: 0, B: 3, C: 1, D: 4', resultCap: 'dijkstra() returns a HashMap from node to distance (sorted here by name). Pass Some(goal) to stop early. Negative weights need bellman_ford().',
}), `${DI(['A', 'B', 'C', 'D'], DJE, true)} let res = dijkstra(&g, n[0], None, |e| *e.weight()); let mut v: Vec<_> = res.iter().map(|(k, c)| (g[*k], *c)).collect(); v.sort(); v.iter().map(|(k, c)| format!("{}: {}", k, c)).join(", ")`, 'A: 0, B: 3, C: 1, D: 4');

const TP = { A: [180, 330], B: [460, 210], C: [460, 450], D: [760, 330] };
const TPE = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D']];
add('toposort', 'How petgraph::algo::toposort() works', 'Orders the nodes so that every arrow points forward; a cycle is an error.', () => graph({
  call: 'toposort(&g, None)', note: 'an arrow X → Y means "X must come before Y"', nodes: TP, edges: TPE, directed: true,
  labels: { A: '', B: '', C: '', D: '' }, labelDx: 0, labelDy: -46,
  intro: 'Think of tasks with dependencies: A before B and C, and both B and C before D. toposort() finds an order that respects every arrow.',
  steps: [
    { cap: 'A has no arrows coming in, so nothing has to happen before it: it goes first.', nodes: { A: 'success' }, labels: { A: '1st' } },
    { cap: 'With A done, B and C are both free. Either order is valid; petgraph\'s depth-first search places C here.', nodes: { C: 'success' }, edges: { 'A-C': 'success' }, labels: { C: '2nd' } },
    { cap: 'Then B.', nodes: { B: 'success' }, edges: { 'A-B': 'success' }, labels: { B: '3rd' } },
    { cap: 'D needs both B and C, so it comes last. Every arrow now points from an earlier to a later node.', nodes: { D: 'success' }, edges: { 'B-D': 'success', 'C-D': 'success' }, labels: { D: '4th' } },
  ],
  result: 'A, C, B, D', resultCap: 'toposort() returns Ok(Vec<NodeIndex>). If the graph has a cycle there is no valid order, and it returns Err(Cycle(node)).',
}), `${DI(['A', 'B', 'C', 'D'], TPE)} j(toposort(&g, None).unwrap().iter().map(|i| g[*i]))`, 'A, C, B, D');

const CY = { A: [500, 200], B: [700, 420], C: [300, 420] };
const CYE = [['A', 'B'], ['B', 'C'], ['C', 'A']];
add('is-cyclic-directed', 'How petgraph::algo::is_cyclic_directed() works', 'Finds out whether following the arrows can lead back to where you started.', () => graph({
  call: 'is_cyclic_directed(&g)', note: 'edges A → B, B → C, C → A', nodes: CY, edges: CYE, directed: true,
  intro: 'is_cyclic_directed() walks the graph depth-first and remembers which nodes are on the current path.',
  steps: [
    { cap: 'Start at A. A is on the path.', nodes: { A: 'warning' }, eq: 'path: A' },
    { cap: 'Follow A → B. B joins the path.', nodes: { B: 'warning' }, edges: { 'A-B': 'warning' }, eq: 'path: A → B' },
    { cap: 'Follow B → C.', nodes: { C: 'warning' }, edges: { 'B-C': 'warning' }, eq: 'path: A → B → C' },
    { cap: 'C → A leads to a node that is still on the current path. That arrow closes a loop: a cycle.', nodes: { A: 'danger' }, edges: { 'C-A': 'danger' }, eq: 'A is already on the path → cycle' },
  ],
  result: 'true', resultCap: 'is_cyclic_directed(&g) is true. Without the arrow C → A it would be false, and toposort() would succeed.',
}), `${DI(['A', 'B', 'C'], CYE)} d(is_cyclic_directed(&g))`, 'true');

// the same tree for Bfs and Dfs; edges are added A→C before A→B (petgraph lists the newest edge first)
const TR = { A: [500, 190], B: [300, 320], C: [700, 320], D: [200, 460], E: [800, 460] };
const TRE = [['A', 'C'], ['A', 'B'], ['B', 'D'], ['C', 'E']];
const walk = (kind) => `${DI(['A', 'B', 'C', 'D', 'E'], TRE)} let mut w = ${kind}::new(&g, n[0]); let mut v = vec![]; while let Some(x) = w.next(&g) { v.push(g[x]); } j(v)`;
add('bfs-next', 'How Bfs::next() works', 'Visits a graph breadth-first: all neighbours before the neighbours\' neighbours.', () => graph({
  call: 'while let Some(n) = bfs.next(&g) { … }', note: 'bfs = Bfs::new(&g, a); a FIFO queue decides the order', nodes: TR, edges: TRE.map(([u, v]) => (u === 'A' && v === 'C' ? ['A', 'C'] : [u, v])), directed: true,
  labels: { A: '', B: '', C: '', D: '', E: '' }, labelDx: 0, labelDy: -44,
  intro: 'Each call to next() returns one node. Bfs keeps a queue: nodes found first are visited first.',
  steps: [
    { cap: 'next() returns A, the start. Its neighbours B and C join the queue.', nodes: { A: 'success' }, labels: { A: '1' }, eq: 'queue: B, C' },
    { cap: 'B comes out of the queue first; its neighbour D is added at the back.', nodes: { B: 'success' }, labels: { B: '2' }, eq: 'queue: C, D' },
    { cap: 'C is next, still at distance 1 from A. Its neighbour E goes to the back.', nodes: { C: 'success' }, labels: { C: '3' }, eq: 'queue: D, E' },
    { cap: 'Only then the nodes at distance 2: D, then E.', nodes: { D: 'success', E: 'success' }, labels: { D: '4', E: '5' }, eq: 'queue: empty → None' },
  ],
  result: 'A, B, C, D, E', resultCap: 'Level by level: A, then B and C, then D and E. In an unweighted graph BFS reaches every node by a shortest path.',
}), walk('Bfs'), 'A, B, C, D, E');
add('dfs-next', 'How Dfs::next() works', 'Visits a graph depth-first: follows one path to its end before going back.', () => graph({
  call: 'while let Some(n) = dfs.next(&g) { … }', note: 'dfs = Dfs::new(&g, a); a stack (last in, first out) decides the order', nodes: TR, edges: TRE, directed: true,
  labels: { A: '', B: '', C: '', D: '', E: '' }, labelDx: 0, labelDy: -44,
  intro: 'Dfs keeps a stack. The node pushed last is visited next, so the walk goes deep before it goes wide.',
  steps: [
    { cap: 'next() returns A. Its neighbours are pushed: B, then C. C is on top.', nodes: { A: 'success' }, labels: { A: '1' }, eq: 'stack: B, C' },
    { cap: 'C comes off the top. Its neighbour E is pushed on top of B.', nodes: { C: 'success' }, labels: { C: '2' }, eq: 'stack: B, E' },
    { cap: 'E is visited next: the walk went all the way down A → C → E first.', nodes: { E: 'success' }, labels: { E: '3' }, eq: 'stack: B' },
    { cap: 'That path is finished, so it backs up to B, and from B goes down to D.', nodes: { B: 'success', D: 'success' }, labels: { B: '4', D: '5' }, eq: 'stack: empty → None' },
  ],
  result: 'A, C, E, B, D', resultCap: 'Depth first: one branch completely (C, E), then the next (B, D). Which branch goes first depends on the order petgraph lists the edges.',
}), walk('Dfs'), 'A, C, E, B, D');

const CC = { A: [200, 230], B: [380, 330], C: [200, 430], D: [650, 260], E: [800, 420] };
const CCE = [['A', 'B'], ['B', 'C'], ['D', 'E']];
add('connected-components', 'How petgraph::algo::connected_components() works', 'Counts the separate groups of nodes that are linked to each other.', () => graph({
  call: 'connected_components(&g)', note: 'an undirected graph with edges A–B, B–C, D–E', nodes: CC, edges: CCE,
  intro: 'Two nodes are in the same component when some path of edges links them.',
  steps: [
    { cap: 'Start at A: A–B and B–C link A, B and C. That is component 1.', nodes: { A: 'success', B: 'success', C: 'success' }, edges: { 'A-B': 'success', 'B-C': 'success' }, eq: 'component 1: A, B, C' },
    { cap: 'D is not linked to any of them, so it starts component 2, together with E.', nodes: { D: 'warning', E: 'warning' }, edges: { 'D-E': 'warning' }, eq: 'component 2: D, E' },
    { cap: 'Every node now belongs to a component. (petgraph does this with a union-find structure, merging groups edge by edge.)', eq: 'two islands' },
  ],
  result: '2', resultCap: 'connected_components(&g) is 2. Adding an edge between C and D would make it 1.',
}), `let mut g = UnGraph::<&str, ()>::new_undirected(); let n: Vec<NodeIndex> = ["A", "B", "C", "D", "E"].iter().map(|x| g.add_node(*x)).collect(); g.add_edge(n[0], n[1], ()); g.add_edge(n[1], n[2], ()); g.add_edge(n[3], n[4], ()); d(connected_components(&g))`, '2');

// A*: a 3 × 3 grid without its middle; every step costs 1; estimate = Manhattan distance to T
const GX = [300, 500, 700], GY = [190, 330, 470];
const ASN = { S: [GX[0], GY[0]], B: [GX[1], GY[0]], C: [GX[2], GY[0]], D: [GX[0], GY[1]], F: [GX[2], GY[1]], G: [GX[0], GY[2]], H: [GX[1], GY[2]], T: [GX[2], GY[2]] };
const ASE = [['S', 'B'], ['B', 'C'], ['C', 'F'], ['F', 'T'], ['S', 'D'], ['D', 'G'], ['G', 'H'], ['H', 'T']];
add('astar', 'How petgraph::algo::astar() works', 'Shortest path to a goal: Dijkstra guided by an estimate of the distance left.', () => {
  const b = graph({
    call: 'astar(&g, s, |n| n == t, |e| *e.weight(), |n| estimate(n))', note: 'each step costs 1; estimate = steps left to T, ignoring the hole', nodes: ASN, edges: ASE.map(([u, v]) => [u, v, undefined]),
    labels: { S: '0+4', B: '', C: '', D: '', F: '', G: '', H: '', T: '' }, labelDx: 0, labelDy: -44,
    intro: 'astar() ranks nodes by f = cost so far + estimate of the cost left. The estimate never overestimates, so the path found is a shortest one.',
    steps: [
      { cap: 'From S, both B and D cost 1, and both are 3 steps from T: f = 1 + 3 = 4.', nodes: { S: 'success' }, labels: { B: '1+3', D: '1+3' } },
      { cap: 'They tie, so the search continues from one of them; petgraph picks D. D leads to G (f = 2 + 2).', nodes: { D: 'success' }, edges: { 'S-D': 'warning' }, labels: { G: '2+2' } },
      { cap: 'G leads to H (3 + 1), and H to T (4 + 0). The f values never rose above 4, so no detour was needed.', nodes: { G: 'success', H: 'success' }, edges: { 'D-G': 'warning', 'G-H': 'warning' }, labels: { H: '3+1', T: '4+0' } },
      { cap: 'T is reached with cost 4. Dijkstra would have spread out evenly in all directions; the estimate pulled the search towards T.', nodes: { T: 'success' }, edges: { 'S-D': 'success', 'D-G': 'success', 'G-H': 'success', 'H-T': 'success' } },
    ],
    result: 'cost 4, path S → D → G → H → T', resultCap: 'astar() returns Some((4, path)). The path along the top (S, B, C, F, T) is just as short; which one is returned depends on tie-breaking.',
  });
  return b;
}, `let mut g = UnGraph::<(&str, i32, i32), u32>::new_undirected(); let p = [("S", 0, 0), ("B", 1, 0), ("C", 2, 0), ("D", 0, 1), ("F", 2, 1), ("G", 0, 2), ("H", 1, 2), ("T", 2, 2)]; let n: Vec<NodeIndex> = p.iter().map(|x| g.add_node(*x)).collect(); let ix = |s: &str| p.iter().position(|x| x.0 == s).unwrap(); for (u, v) in [${ASE.map(([u, v]) => `("${u}", "${v}")`).join(', ')}] { g.add_edge(n[ix(u)], n[ix(v)], 1); } let t = n[ix("T")]; let (cost, path) = astar(&g, n[0], |x| x == t, |e| *e.weight(), |x| (2 - g[x].1).abs() as u32 + (2 - g[x].2).abs() as u32).unwrap(); format!("cost {}, path {}", cost, path.iter().map(|x| g[*x].0).join(" → "))`, 'cost 4, path S → D → G → H → T');

module.exports = A;
