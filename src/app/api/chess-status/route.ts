import { timingSafeEqual } from "crypto";
import { Chess } from "chess.js";

// My live chess game, for the board on the home page. My phone (the Chess Relay app) POSTs, with
// "Authorization: Bearer <CHESS_STATUS_SECRET>":
//   {"board":"<the piece part of a FEN>","color":"white"|"black"}  the position on screen, and which side I'm playing
//   {"status":"done"}                                               I left the Chess.com app
// From each new position the server works out the move (or two) that led there, so the board can slide the pieces;
// a position it can't reach that way (a new game, or one picked up halfway) starts the record afresh from there.
// Also accepted, for testing and older app versions: {"status":"new","color"}, {"ply":23,"move":"Nxe5"},
// {"status":"playing"}.
// Every position or move keeps the board up for 45 minutes in case "done" never comes; "done" cuts that to 2 minutes,
// so a quick app switch mid-game doesn't hide the board. Everyone else can GET the game.
// Stored in Upstash Redis (added through Vercel's Storage tab, which sets the URL and token below).
export const dynamic = "force-dynamic";

const PLAYING_MS = 45 * 60 * 1000;
const GRACE_MS = 2 * 60 * 1000;
const KEY = "chess-game";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
const BOARD = /^([pnbrqkPNBRQK1-8]{1,8}\/){7}[pnbrqkPNBRQK1-8]{1,8}$/;

/** `start`: the position the record begins from, when it isn't the usual one (a game picked up halfway). */
type Game = { until: number; color: "white" | "black"; start?: string; moves: string[] };
const EMPTY: Game = { until: 0, color: "white", moves: [] };

const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

// shortcut: without Upstash keys (on my own computer) the game lives in memory, which is fine for testing only.
let memory: Game = EMPTY;

async function redis(command: string[]) {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  return (await res.json()).result;
}

async function read(): Promise<Game> {
  if (!REDIS_URL || !REDIS_TOKEN) return memory;
  const raw = await redis(["GET", KEY]);
  return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
}

async function write(game: Game) {
  if (!REDIS_URL || !REDIS_TOKEN) return void (memory = game);
  // Kept a day after the board goes away, then it deletes itself.
  await redis(["SET", KEY, JSON.stringify(game), "PX", String(Math.max(1, game.until - Date.now()) + 86_400_000)]);
}

function authorised(request: Request) {
  const secret = process.env.CHESS_STATUS_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const wanted = Buffer.from(`Bearer ${secret}`);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

/** The game so far, or null if the moves don't make a legal game from its start. */
function replay(start: string | undefined, moves: string[]) {
  try {
    const chess = new Chess(start);
    for (const m of moves) chess.move(m);
    return chess;
  } catch {
    return null;
  }
}

const placement = (chess: Chess) => chess.fen().split(" ")[0];

/** The one or two moves that turn the current position into `target`, or null. */
function movesTo(chess: Chess, target: string, depth = 2): string[] | null {
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m);
    const hit = placement(chess) === target ? [] : depth > 1 ? movesTo(chess, target, depth - 1) : null;
    chess.undo();
    if (hit) return [m.san, ...hit];
  }
  return null;
}

/** A full position from just the pieces: whose turn it is is a guess, castling allowed where king and rook are home. */
function fenFrom(board: string, turn: "w" | "b") {
  const rows = board.split("/").map((r) => r.replace(/\d/g, (n) => ".".repeat(Number(n))));
  const at = (sq: string) => rows[8 - Number(sq[1])][sq.charCodeAt(0) - 97];
  let castle = "";
  if (at("e1") === "K") castle += (at("h1") === "R" ? "K" : "") + (at("a1") === "R" ? "Q" : "");
  if (at("e8") === "k") castle += (at("h8") === "r" ? "k" : "") + (at("a8") === "r" ? "q" : "");
  return `${board} ${turn} ${castle || "-"} - 0 1`;
}

const flipTurn = (fen: string) => fen.replace(/ ([wb]) /, (_, t) => (t === "w" ? " b " : " w "));
const valid = (fen: string) => replay(fen, []) !== null;

/** Fold a position from the phone into the game. */
function withBoard(game: Game, board: string, color: Game["color"], now: number): Game | null {
  const until = now + PLAYING_MS;
  if (board === START) return { until, color, moves: [] };
  const chess = replay(game.start, game.moves);
  if (chess && placement(chess) === board) return { ...game, color, until };
  const next = chess && movesTo(chess, board);
  if (next) return { ...game, color, until, moves: [...game.moves, ...next] };
  // Picked up halfway, we guessed whose turn it was: if that was wrong, the other side's move gets us here.
  if (game.start && game.moves.length === 0) {
    const other = replay(flipTurn(game.start), []);
    const moves = other && movesTo(other, board);
    if (moves) return { ...game, start: flipTurn(game.start), color, until, moves };
  }
  // Somewhere new: start the record afresh from here.
  const start = [fenFrom(board, "w"), fenFrom(board, "b")].find(valid);
  return start ? { until, color, start, moves: [] } : null;
}

const noStore = { "Cache-Control": "no-store, max-age=0" };
const reply = (body: object, status = 200) => Response.json(body, { status, headers: noStore });

export async function GET() {
  try {
    const game = await read();
    const playing = Date.now() < game.until;
    return reply(playing ? { playing, color: game.color, start: game.start, moves: game.moves } : { playing: false });
  } catch {
    return reply({ playing: false });
  }
}

export async function POST(request: Request) {
  if (!authorised(request)) return reply({ error: "Unauthorised." }, 401);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return reply({ error: "Send a JSON body." }, 400);

  try {
    const now = Date.now();
    const game = await read();
    const color = body.color === "black" ? "black" : body.color === "white" ? "white" : game.color;

    if (typeof body.board === "string") {
      if (!BOARD.test(body.board)) return reply({ error: "That isn't a board position." }, 400);
      const next = withBoard(game, body.board, color, now);
      if (!next) return reply({ error: "That position isn't possible in chess." }, 422);
      await write(next);
      return reply({ ok: true, moves: next.moves.length, fresh: next.start !== game.start || next.moves.length < game.moves.length });
    }

    if (body.status === "new") {
      await write({ until: now + PLAYING_MS, color: body.color === "black" ? "black" : "white", moves: [] });
    } else if (body.status === "playing") {
      await write({ ...game, until: now + PLAYING_MS });
    } else if (body.status === "done") {
      if (game.until > now) await write({ ...game, until: Math.min(game.until, now + GRACE_MS) });
    } else if (Number.isInteger(body.ply) && body.ply >= 1 && typeof body.move === "string") {
      const move = body.move.trim().slice(0, 10);
      // A move we already have (sent twice) changes nothing; a gap means one was missed.
      if (body.ply > game.moves.length + 1) {
        return reply({ error: `Missing earlier moves: I have ${game.moves.length}.`, have: game.moves.length }, 409);
      }
      const moves = [...game.moves.slice(0, body.ply - 1), move];
      if (!replay(game.start, moves)) return reply({ error: `"${move}" isn't a legal move there.`, have: game.moves.length }, 422);
      await write({ ...game, until: now + PLAYING_MS, moves });
    } else {
      return reply({ error: 'Send {"board":"...","color":"white"} or {"status":"done"}.' }, 400);
    }
    return reply({ ok: true });
  } catch {
    return reply({ error: "Couldn't save the game." }, 502);
  }
}
