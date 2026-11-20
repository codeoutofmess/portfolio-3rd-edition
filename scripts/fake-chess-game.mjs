// Pretends to be my phone: starts a game and sends a famous one (Morphy v Duke of Brunswick and Count Isouard, Paris
// 1858) one move every few seconds, then says the game is done. For testing the live board on my own computer.
//   node scripts/fake-chess-game.mjs                       (local site, test password)
//   node scripts/fake-chess-game.mjs <site address> <password> <seconds between moves>
const [url = "http://localhost:3057", secret = "local-test-secret", gap = "3"] = process.argv.slice(2);
const moves = "e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#".split(" ");

const send = async (body) => {
  const res = await fetch(`${url}/api/chess-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify(body),
  });
  console.log(JSON.stringify(body), "→", res.status, (await res.text()).slice(0, 120));
  if (!res.ok) process.exit(1);
};
const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));

await send({ status: "new", color: "white" });
for (const [i, move] of moves.entries()) {
  await wait(Number(gap));
  await send({ ply: i + 1, move });
}
await wait(Number(gap));
await send({ status: "done" });
console.log("Game over. The board stays up for 2 more minutes, then goes away.");
