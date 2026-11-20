"use client";

import { useMemo } from "react";
import { Chess, type Square } from "chess.js";
import { Piece, type PieceType } from "@/components/chess-pieces";

type Placed = { id: string; type: PieceType; color: "w" | "b"; square: string };

/** Replays the moves from the start (the usual one, or `start` for a game picked up halfway), so every piece keeps the
 * same id all game and slides from square to square. */
function replay(moves: string[], start?: string) {
  let chess: Chess;
  try {
    chess = new Chess(start);
  } catch {
    chess = new Chess();
  }
  const at = new Map<string, Placed>();
  for (const row of chess.board()) for (const p of row) if (p) at.set(p.square, { id: p.square, type: p.type, color: p.color, square: p.square });

  let last: { from: string; to: string } | undefined;
  let taken: Placed | undefined; // the piece the last move captured, shown fading away
  for (const san of moves) {
    let m;
    try {
      m = chess.move(san);
    } catch {
      break; // the server only keeps legal games, but stop cleanly if one slips through
    }
    const take = m.flags.includes("e") ? m.to[0] + m.from[1] : m.to; // en passant takes the pawn beside, not in front
    taken = m.captured ? at.get(take) : undefined;
    if (m.captured) at.delete(take);
    const piece = at.get(m.from)!;
    at.delete(m.from);
    at.set(m.to, { ...piece, square: m.to, type: m.promotion ?? piece.type });
    // Castling: the rook jumps over the king too.
    const rank = m.from[1];
    const rook = m.flags.includes("k") ? ["h", "f"] : m.flags.includes("q") ? ["a", "d"] : null;
    if (rook) {
      const r = at.get(rook[0] + rank)!;
      at.delete(rook[0] + rank);
      at.set(rook[1] + rank, { ...r, square: rook[1] + rank });
    }
    last = { from: m.from, to: m.to };
  }
  // A fixed order (by id): moving a piece's element around the page would cancel its slide.
  const pieces = [...at.values()].sort((a, b) => a.id.localeCompare(b.id));
  return { pieces, last, taken, turn: chess.turn(), check: chess.inCheck(), over: chess.isGameOver(), chess };
}

const FILES = "abcdefgh";
// Light squares are the page itself; dark squares are the page's ink, faintly. So the board takes on the theme.
const DARK = "color-mix(in srgb, var(--color-ink) 8%, transparent)";
const MARK = "color-mix(in srgb, var(--color-ink) 13%, transparent)"; // the last move
const CHECK = "color-mix(in srgb, var(--color-ink) 26%, transparent)";

/** A chess board with our pieces, seen from `side`'s end, highlighting the last move. */
export function ChessBoard({ moves, start, side = "white", className = "" }: { moves: string[]; start?: string; side?: "white" | "black"; className?: string }) {
  const { pieces, last, taken, check, turn, chess } = useMemo(() => replay(moves, start), [moves, start]);
  const xy = (sq: string) => {
    const f = FILES.indexOf(sq[0]);
    const r = Number(sq[1]);
    return side === "white" ? [f, 8 - r] : [7 - f, r - 1];
  };
  const kingInCheck = check ? chess.findPiece({ type: "k", color: turn })[0] : undefined;
  const lastSan = moves[moves.length - 1];
  const label = moves.length
    ? `Live chess board, ${moves.length} ${moves.length === 1 ? "move" : "moves"} in. Last move ${lastSan}.`
    : "Live chess board, the game is about to start.";

  return (
    <div role="img" aria-label={label} className={`relative aspect-square overflow-hidden ring-1 ring-line ${className}`}>
      <svg viewBox="0 0 8 8" className="absolute inset-0 h-full w-full" shapeRendering="crispEdges" aria-hidden>
        {Array.from({ length: 64 }, (_, i) => (
          (i % 8 + Math.floor(i / 8)) % 2 ? <rect key={i} x={i % 8} y={Math.floor(i / 8)} width="1" height="1" style={{ fill: DARK }} /> : null
        ))}
        {last && [last.from, last.to].map((sq) => {
          const [x, y] = xy(sq);
          return <rect key={sq} x={x} y={y} width="1" height="1" style={{ fill: MARK }} />;
        })}
        {kingInCheck && (() => {
          const [x, y] = xy(kingInCheck as Square);
          return <rect x={x} y={y} width="1" height="1" style={{ fill: CHECK }} />;
        })()}
      </svg>
      {taken && (() => {
        const [x, y] = xy(taken.square);
        // Knocked off as the capturing piece arrives.
        return (
          <div
            key={`taken-${taken.id}`}
            className="absolute left-0 top-0 h-[12.5%] w-[12.5%] animate-[chess-taken_0.35s_ease-in_0.3s_forwards] motion-reduce:hidden"
            style={{ transform: `translate(${x * 100}%, ${y * 100}%)` }}
          >
            <Piece type={taken.type} color={taken.color} />
          </div>
        );
      })()}
      {pieces.map((p) => {
        const [x, y] = xy(p.square);
        return (
          <div
            key={p.id}
            // Eases in and out: a gentle start and a soft landing; the piece that just moved travels above the others.
            className={`absolute left-0 top-0 h-[12.5%] w-[12.5%] transition-transform duration-[560ms] ease-[cubic-bezier(0.45,0,0.2,1)] will-change-transform motion-reduce:transition-none ${p.square === last?.to ? "z-10" : ""}`}
            style={{ transform: `translate(${x * 100}%, ${y * 100}%)` }}
          >
            <Piece type={p.type} color={p.color} />
          </div>
        );
      })}
    </div>
  );
}
