"use client";

import { useEffect, useState } from "react";
import { ChessBoard } from "@/components/chess-board";
import { PanelWindow, usePanelLayout } from "@/components/panel-window";

const FAST_MS = 1_000; // while I'm playing, so moves land within about a second
const SLOW_MS = 5_000; // otherwise, to notice a game starting within a few seconds

type Game = { playing: boolean; color?: "white" | "black"; start?: string; moves?: string[] };

/** My live chess game, in a window on the home page's landing view only. It keeps checking while a view (Work,
 * About...) is open, so the board is up to date the moment you come back. Nothing is checked while the tab is hidden. */
export function ChessLive({ show }: { show: boolean }) {
  const [game, setGame] = useState<Game>({ playing: false });
  const [seen, setSeen] = useState(false); // the window mounts the first time a game shows, then stays (keeping its spot)
  const [closed, setClosed] = useState(false); // closed by the visitor: stays shut until the next game

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let playing = false;
    const check = async () => {
      clearTimeout(timer);
      if (stopped || document.hidden) return;
      try {
        const next: Game = await fetch("/api/chess-status", { cache: "no-store" }).then((r) => r.json());
        playing = next.playing === true;
        // Same moves as before: keep the old object, so the board doesn't redraw.
        setGame((g) =>
          g.playing === playing && g.color === next.color && g.start === next.start && g.moves?.join() === next.moves?.join() ? g : next,
        );
      } catch {
        // keep what we had; the next check tries again
      }
      if (!stopped) timer = setTimeout(check, playing ? FAST_MS : SLOW_MS);
    };
    check();
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  if (game.playing && !seen) setSeen(true);
  if (!game.playing && closed) setClosed(false);

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {game.playing ? "I'm playing a live chess game right now." : ""}
      </p>
      {seen && <ChessWindow game={game} open={show && game.playing && !closed} onClose={() => setClosed(true)} />}
    </>
  );
}

/** The board in the site's usual window. On a wide screen it opens left of the dial, about halfway between the screen's
 * edge and the menu and roughly halfway down, nudged a little at random so it doesn't look placed. Where there's no room
 * beside the dial (phones, tablets), it opens under the dial instead, sized to the room above the bottom labels. */
function ChessWindow({ game, open, onClose }: { game: Game; open: boolean; onClose: () => void }) {
  const { W, H, dial } = usePanelLayout();
  const [nudge] = useState(() => ({ x: (Math.random() - 0.5) * 48, y: (Math.random() - 0.3) * 70 }));
  const BAR = 41 + 2 * 18 + 12; // the title bar's height, plus the two player names

  const room = W / 2 - dial; // from the screen's left edge to the menu's left edge
  let spot;
  if (room - 60 >= 160) {
    const width = Math.min(300, room - 60);
    spot = {
      left: Math.round((room - width) / 2 + nudge.x),
      top: Math.round(Math.max(72, Math.min(H - width - BAR - 72, H / 2 - (width + BAR) / 2 + nudge.y))),
      width,
    };
  } else {
    const top = H / 2 + dial + 12;
    const footer = W >= 640 ? 132 : 112; // the edition and availability labels along the bottom
    const width = Math.round(Math.max(150, Math.min(240, H - top - footer - BAR)));
    spot = { left: Math.round((W - width) / 2 + nudge.x / 4), top: Math.round(top), width };
  }

  const moves = game.moves ?? [];
  const mine = game.color ?? "white"; // my pieces are at the bottom
  // A game picked up halfway has no move count from the start, so it just says it's live.
  const status = game.start ? "Live" : moves.length ? `Move ${Math.ceil(moves.length / 2)}` : "Starting";
  // Narrower windows have less room in the title bar: "Live game · Move 17", then "Move 17", then just "Live".
  const title = spot.width < 190 ? "Live" : status === "Live" ? "Live game" : spot.width < 240 ? status : `Live game · ${status}`;
  return (
    <PanelWindow open={open} spot={spot} z={20} onClose={onClose} title={title} label="My live chess game">
      <div className="p-1.5">
        <Player name="Probably a genius" color={mine === "white" ? "black" : "white"} />
        <ChessBoard moves={moves} start={game.start} side={mine} />
        <Player name="Prad" color={mine} />
      </div>
    </PanelWindow>
  );
}

/** A player's name beside a small chip of the colour they're playing: my opponent above the board, me below. */
function Player({ name, color }: { name: string; color: "white" | "black" }) {
  return (
    <p className="flex h-[18px] items-center gap-1.5 truncate px-0.5 text-[12px] leading-none text-ink-soft">
      <span
        aria-hidden
        className={`h-2 w-2 shrink-0 rounded-full border border-ink-dim ${color === "white" ? "bg-[#f4f4f1]" : "bg-[#121211]"}`}
      />
      <span className="truncate">{name}</span>
      <span className="sr-only">, playing {color}</span>
    </p>
  );
}
