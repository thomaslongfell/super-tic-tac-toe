import { Key, useState } from 'react';
import { X, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SuperTicTacToe = () => {
  // Initialize the big board and small game boards
  const initializeBoards = () => {
    return Array(9).fill(null).map(() => ({
      board: Array(9).fill(null),
      winner: null
    }));
  };

  const [smallBoards, setSmallBoards] = useState(initializeBoards());
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [nextValidBoard, setNextValidBoard] = useState<number | null>(null);
  const [bigBoardWinner, setBigBoardWinner] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });

  // Check for a win in a small board
  const checkSmallBoardWinner = (board: any[]) => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    return board.every(cell => cell !== null) ? 'Draw' : null;
  };

  // Check for a win in the big board
  const checkBigBoardWinner = (boards: { winner: any; }[]) => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (
        boards[a].winner && 
        boards[a].winner === boards[b].winner && 
        boards[a].winner === boards[c].winner
      ) {
        return boards[a].winner;
      }
    }

    return null;
  };

  const handleCellClick = (boardIndex: string | number, cellIndex: number) => {
    // Game is already won
    if (bigBoardWinner) return;

    // Check if this board can be played
    const isValidMove = 
      nextValidBoard === null || 
      nextValidBoard === boardIndex ||
      smallBoards[nextValidBoard].winner !== null;

    if (!isValidMove) return;

    // Copy current state
    const newSmallBoards = [...smallBoards];
    const currentBoard = [...newSmallBoards[boardIndex as number].board];

    // Can't play in an already filled cell
    if (currentBoard[cellIndex]) return;

    // Make the move
    currentBoard[cellIndex] = currentPlayer;
    newSmallBoards[boardIndex as number] = {
      ...newSmallBoards[boardIndex as number],
      board: currentBoard
    };

    // Check if this small board is now won
    const smallBoardWinner = checkSmallBoardWinner(currentBoard);
    if (smallBoardWinner && smallBoardWinner !== 'Draw') {
      newSmallBoards[boardIndex as number].winner = smallBoardWinner;
      
      // Update scores
      setScores(prevScores => ({
        ...prevScores,
        [smallBoardWinner]: prevScores[smallBoardWinner as keyof typeof prevScores] + 1
      }));
    }

    // Determine next valid board
    let nextBoard = null;
    if (smallBoardWinner === null || smallBoardWinner === 'Draw') {
      nextBoard = cellIndex;
    }

    // If the next board is already won, allow playing on any open board
    if (nextBoard !== null && newSmallBoards[nextBoard]?.winner !== null) {
      nextBoard = null;
    }

    setNextValidBoard(nextBoard);

    // Check big board winner
    const potentialBigBoardWinner = checkBigBoardWinner(newSmallBoards);
    if (potentialBigBoardWinner) {
      setBigBoardWinner(potentialBigBoardWinner);
    }

    // Update state
    setSmallBoards(newSmallBoards);
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  };

  const renderSmallBoard = (boardIndex: Key | null | undefined) => {
    const smallBoard = smallBoards[boardIndex as number];
    const isCurrentBoard = 
      nextValidBoard === null || 
      nextValidBoard === boardIndex || 
      smallBoards[nextValidBoard].winner !== null;

    // Determine board scale based on its state
    const getBoardScale = () => {
      if (smallBoard.winner) return 0.9; // Smaller for won boards
      if (!isCurrentBoard) return 0.95; // Slightly smaller for unplayable boards
      return 1; // Full size for playable boards
    };

    return (
      <motion.div 
        key={boardIndex} 
        initial={false}
        animate={{ 
          scale: getBoardScale(),
          opacity: smallBoard.winner ? 0.5 : 1
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 20 
        }}
        className={`
          grid grid-cols-3 border-2 relative overflow-hidden
          ${isCurrentBoard ? 'cursor-pointer' : ''}
        `}
      >
        {smallBoard.board.map((cell, cellIndex) => (
          <motion.div 
            key={cellIndex} 
            whileHover={{ 
              backgroundColor: !cell && isCurrentBoard ? '#f3f4f6' : 'transparent' 
            }}
            className={`
              w-16 h-16 border flex items-center justify-center 
              ${cell ? 'text-xl font-bold' : ''}
            `}
            onClick={() => handleCellClick(boardIndex as number, cellIndex)}
          >
            <AnimatePresence>
              {cell === 'X' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <X className="w-10 h-10 text-blue-500" />
                </motion.div>
              ) : cell === 'O' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <Circle className="w-8 h-8 text-red-500 stroke-[2.5]" />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ))}
        {smallBoard.winner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
              absolute inset-0 flex items-center justify-center 
              text-6xl font-extrabold pointer-events-none
              ${smallBoard.winner === 'X' ? 'text-blue-700' : 'text-red-700'}
            `}
          >
            {smallBoard.winner === 'X' ? (
              <X className="w-24 h-24 stroke-[3]" />
            ) : (
              <Circle className="w-20 h-20 stroke-[3]" />
            )}
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderPlayerIcon = (player: string) => {
    const xIconProps = {
      className: "w-10 h-10 text-blue-500"
    };
    const oIconProps = {
      className: "w-8 h-8 text-red-500 stroke-[2.5]"
    };
    return player === 'X' ? <X {...xIconProps} /> : <Circle {...oIconProps} />;
  };

  const resetGame = () => {
    setSmallBoards(initializeBoards());
    setCurrentPlayer('X');
    setNextValidBoard(null);
    setBigBoardWinner(null);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Super Tic-Tac-Toe</h1>
      
      <AnimatePresence>
        {bigBoardWinner ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-2xl font-bold mb-4 flex items-center"
          >
            <span>Winner:</span>
            {renderPlayerIcon(bigBoardWinner)}
            <button 
              onClick={resetGame}
              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Reset Game
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={false}
            className="text-xl mb-4 flex items-center"
          >
            <span className="mr-2">Current Player:</span> 
            {renderPlayerIcon(currentPlayer)}
            {(nextValidBoard !== null && smallBoards[nextValidBoard].winner === null) && (
              <span className="ml-4 text-sm">
                (Must play in board {nextValidBoard + 1})
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-2 relative">
        {smallBoards.map((_, boardIndex) => renderSmallBoard(boardIndex))}
      </div>

      <div className="mt-4 flex justify-center space-x-4 w-full">
        <div className="text-center flex flex-col items-center">
          <div className="flex justify-center"><X className="w-10 h-10 text-blue-500" /></div>
          <div className="text-3xl font-bold">{scores.X}</div>
        </div>
        <div className="text-center flex flex-col items-center">
          <div className="flex justify-center"><Circle className="w-8 h-8 text-red-500 stroke-[2.5]" /></div>
          <div className="text-3xl font-bold">{scores.O}</div>
        </div>
      </div>
    </div>
  );
};

export default SuperTicTacToe;
