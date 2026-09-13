import { useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const pieces: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

function App() {
  const [game, setGame] = useState(() => new Chess());
  const [history, setHistory] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [message, setMessage] = useState("White to move");

  const board = useMemo(() => game.board(), [game]);

  function resetGame() {
    setGame(new Chess());
    setHistory([]);
    setSelected(null);
    setPossibleMoves([]);
    setMessage("White to move");
  }

  function undoMove() {
    if (history.length === 0) return;

    const previousFen = history[history.length - 1];
    const previousGame = new Chess(previousFen);
    setGame(previousGame);
    setHistory((current) => current.slice(0, -1));
    setSelected(null);
    setPossibleMoves([]);

    if (previousGame.isCheck()) {
      setMessage(`${previousGame.turn() === "w" ? "White" : "Black"} is in check`);
    } else {
      setMessage(`${previousGame.turn() === "w" ? "White" : "Black"} to move`);
    }
  }

  function handleSquareClick(square: string) {
    if (game.isGameOver()) return;

    if (!selected) {
      const piece = game.get(square);
      if (!piece || piece.color !== game.turn()) return;
      setSelected(square);
      setPossibleMoves(game.moves({ square: square as Square, verbose: true }).map((move) => move.to));
      return;
    }

    try {
      const next = new Chess(game.fen());
      next.move({ from: selected, to: square, promotion: "q" });

      // Save the current position before making the move so Undo can restore it.
      setHistory((current) => [...current, game.fen()]);
      setGame(next);
      setSelected(null);
      setPossibleMoves([]);

      if (next.isCheckmate()) {
        setMessage(`${next.turn() === "w" ? "Black" : "White"} wins by checkmate`);
      } else if (next.isDraw()) {
        setMessage("Game drawn");
      } else if (next.isCheck()) {
        setMessage(`${next.turn() === "w" ? "White" : "Black"} is in check`);
      } else {
        setMessage(`${next.turn() === "w" ? "White" : "Black"} to move`);
      }
    } catch {
      const piece = game.get(square);
      if (piece?.color === game.turn()) {
        setSelected(square);
        setPossibleMoves(game.moves({ square: square as Square, verbose: true }).map((move) => move.to));
      } else {
        setSelected(null);
        setPossibleMoves([]);
      }
    }
  }

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <div className="brand">♟ ChessArena</div>
          <div className="tagline">Your first real-time chess platform</div>
        </div>
        <div className="status">{message}</div>
      </header>

      <section className="game-layout">
        <div className="player-card">
          <div className="avatar">♟</div>
          <div>
            <strong>Black</strong>
            <span>Local player</span>
          </div>
        </div>

        <div className="board-wrap">
          <div className="board">
            {board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const square = `${files[colIndex]}${8 - rowIndex}`;
                const isDark = (rowIndex + colIndex) % 2 === 1;
                const isSelected = selected === square;
                const isPossibleMove = possibleMoves.includes(square);

                return (
                  <button
                    key={square}
                    className={`square ${isDark ? "dark" : "light"} ${isSelected ? "selected" : ""} ${isPossibleMove ? "possible-move" : ""}`}
                    onClick={() => handleSquareClick(square)}
                    aria-label={square}
                  >
                    {piece && (
                      <span className={`piece ${piece.color === "w" ? "white-piece" : "black-piece"}`}>
                        {pieces[`${piece.color}${piece.type.toUpperCase()}`]}
                      </span>
                    )}
                    {colIndex === 0 && <span className="rank-label">{8 - rowIndex}</span>}
                    {rowIndex === 7 && <span className="file-label">{files[colIndex]}</span>}
                  </button>
                );
              })
            )}
          </div>

          <div className="board-actions">
            <button className="action-button undo" onClick={undoMove} disabled={history.length === 0}>
              ↶ Undo Move
            </button>
            <button className="action-button reset" onClick={resetGame}>New Game</button>
          </div>
        </div>

        <div className="player-card">
          <div className="avatar">♙</div>
          <div>
            <strong>White</strong>
            <span>Local player</span>
          </div>
        </div>
      </section>

      <footer>
        <span>Milestone 1: Playable Chess</span>
        <span>Next: online multiplayer</span>
      </footer>
    </main>
  );
}

export default App;
