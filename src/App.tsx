import { Key, useState } from 'react';
// import { ThemeProvider } from "@/components/theme-provider"
import { X, Circle, Bot, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button"
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

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
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [difficulty, setDifficulty] = useState(3); // Default difficulty: "Medium"
  const [pendingAIChange, setPendingAIChange] = useState<boolean | null>(null);
  const [pendingDifficulty, setPendingDifficulty] = useState<number | null>(null);

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

    // If all cells are filled and no winner, return 'Draw'
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
        boards[a].winner !== 'Draw' &&
        boards[a].winner === boards[b].winner &&
        boards[a].winner === boards[c].winner
      ) {
        return boards[a].winner;
      }
    }

    // If no winner, check if all boards are won/drawn
    const allBoardsFilledOrDrawn = boards.every(board => board.winner !== null);

    if (allBoardsFilledOrDrawn) {
      // Count small board wins for each player
      const xWins = boards.filter(board => board.winner === 'X').length;
      const oWins = boards.filter(board => board.winner === 'O').length;

      // Tiebreaker: More small board wins determines the winner
      if (xWins > oWins) return 'X';
      if (oWins > xWins) return 'O';
      
      // Non-tiebreaker: If somehow they both equal, it is a true draw
      if (xWins === oWins) return 'Draw';
    }

    return null;
  };

  const handleCellClick = (boardIndex: number, cellIndex: number) => {
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
    const currentBoard = [...newSmallBoards[boardIndex].board];

    // Can't play in an already filled cell
    if (currentBoard[cellIndex]) return;

    // Make the move with the current player
    currentBoard[cellIndex] = currentPlayer;
    newSmallBoards[boardIndex] = {
      ...newSmallBoards[boardIndex],
      board: currentBoard
    };

    // Check if this small board is now won
    const smallBoardWinner = checkSmallBoardWinner(currentBoard);
    if (smallBoardWinner) {
      // For draws, set winner to a neutral state
      newSmallBoards[boardIndex].winner = smallBoardWinner === 'Draw' ? 'Draw' : smallBoardWinner;

      // Update scores only for actual wins (not draws)
      if (smallBoardWinner !== 'Draw') {
        setScores(prevScores => ({
          ...prevScores,
          [smallBoardWinner]: prevScores[smallBoardWinner as keyof typeof prevScores] + 1
        }));
      }
    }

    // Determine next valid board
    let nextBoard = null;
    if (smallBoardWinner === null || smallBoardWinner === 'Draw') {
      nextBoard = cellIndex;
    }

    // If the next board is already won or drawn, allow playing on any open board
    if (nextBoard !== null && (newSmallBoards[nextBoard]?.winner !== null)) {
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

    // Switch current player
    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
    setCurrentPlayer(nextPlayer);

    // If AI is enabled and next player is O, perform AI move
    if (isAIEnabled && nextPlayer === 'O' && !bigBoardWinner) {
      performAIMove(newSmallBoards, nextBoard)
    }
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
          ${isCurrentBoard && smallBoard.winner === null ? 'cursor-pointer' : ''}
        `}
      >
        {smallBoard.board.map((cell, cellIndex) => (
          <motion.div
            key={cellIndex}
            whileHover={{
              backgroundColor: !cell && isCurrentBoard && smallBoard.winner === null ? '#f3f4f6' : 'transparent'
            }}
            className={`
              w-16 h-16 border flex items-center justify-center
              ${cell ? 'text-xl font-bold' : ''}
              ${isCurrentBoard && !cell && smallBoard.winner === null ? 'cursor-pointer' : ''}
            `}
            onClick={() => {
              if (isCurrentBoard && smallBoard.winner === null) {
                handleCellClick(boardIndex as number, cellIndex);
              }
            }}
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
        {smallBoard.winner && smallBoard.winner !== 'Draw' && (
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
    if (player === 'Draw') {
      return null;
    }

    const xIconProps = {
      className: "w-10 h-10 text-blue-500 inline-block"
    };
    const oIconProps = {
      className: "w-8 h-8 text-red-500 stroke-[2.5] inline-block"
    };
    return player === 'X' ? <X {...xIconProps} /> : <Circle {...oIconProps} />;
  };

  const resetGame = () => {
    setSmallBoards(initializeBoards());
    setCurrentPlayer('X');
    setNextValidBoard(null);
    setBigBoardWinner(null);
    setIsResetDialogOpen(false);
  };

  // AI Stuff

  const handleAIToggle = (checked: boolean) => {
    if (bigBoardWinner || smallBoards.some(board => board.board.some(cell => cell !== null))) {
      setIsResetDialogOpen(true);
      setPendingAIChange(checked);
    } else {
      setIsAIEnabled(checked);
    }
  };

  const handleDifficultyChange = (value: number[]) => {
    // If game is in progress, show reset dialog
    if (bigBoardWinner || smallBoards.some(board => board.board.some(cell => cell !== null))) {
      setIsResetDialogOpen(true);
      setPendingDifficulty(value[0]);
    } else {
      setDifficulty(value[0]);
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Easy';
      case 3: return 'Medium';
      case 5: return 'Hard';
      default: return 'Medium';
    }
  };

  const confirmReset = () => {
    if (pendingAIChange !== null) {
      setIsAIEnabled(pendingAIChange);
      setPendingAIChange(null);
    }
    
    if (pendingDifficulty !== null) {
      setDifficulty(pendingDifficulty);
      setPendingDifficulty(null);
    }
    
    resetGame();
    setIsResetDialogOpen(false);
  };

  // Minimax algorithm for Super Tic-Tac-Toe
  const minimax = (boards: any[], depth: number, isMaximizing: boolean, alpha: number, beta: number, player: string, nextValidBoard: string | number | null) => {
    const opponent = player === 'O' ? 'X' : 'O';

    // Check if game has ended
    const bigBoardWinner = checkBigBoardWinner(boards);
    if (bigBoardWinner) {
      return bigBoardWinner === player ? 10 : bigBoardWinner === opponent ? -10 : 0;
    }

    // If depth is 0, evaluate heuristics for the current state
    if (depth === 0) {
      return evaluateBoardState(boards, player);
    }

    // Get valid boards to play
    const availableBoards = boards
      .map((board, index) => ({ board, index }))
      .filter(({ board, index }) =>
        (nextValidBoard === null || nextValidBoard === index || boards[nextValidBoard as number].winner !== null) &&
        !board.winner
      );

    // Maximizing player's turn
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const { board, index } of availableBoards) {
        const emptyCells = board.board
          .map((cell: null, cellIndex: any) => (cell === null ? cellIndex : null))
          .filter((index: null) => index !== null);

        for (const cellIndex of emptyCells) {
          const newBoards = deepCopyBoards(boards);
          newBoards[index].board[cellIndex] = player;

          // Check if this move wins the small board
          if (checkSmallBoardWinner(newBoards[index].board)) {
            newBoards[index].winner = player;
          }

          const evaluate = minimax(newBoards, depth - 1, false, alpha, beta, player, cellIndex);
          maxEval = Math.max(maxEval, evaluate);
          alpha = Math.max(alpha, evaluate);
          if (beta <= alpha) break;
        }
      }
      return maxEval;
    }

    // Minimizing opponent's turn
    else {
      let minEval = Infinity;
      for (const { board, index } of availableBoards) {
        const emptyCells = board.board
          .map((cell: null, cellIndex: any) => (cell === null ? cellIndex : null))
          .filter((index: null) => index !== null);

        for (const cellIndex of emptyCells) {
          const newBoards = deepCopyBoards(boards);
          newBoards[index].board[cellIndex] = opponent;

          // Check if this move wins the small board
          if (checkSmallBoardWinner(newBoards[index].board)) {
            newBoards[index].winner = opponent;
          }

          const evaluate = minimax(newBoards, depth - 1, true, alpha, beta, player, cellIndex);
          minEval = Math.min(minEval, evaluate);
          beta = Math.min(beta, evaluate);
          if (beta <= alpha) break;
        }
      }
      return minEval;
    }
  };

  // Evaluate the board state heuristically
  const evaluateBoardState = (boards: any[], player: string) => {
    let score = 0;
    const opponent = player === 'O' ? 'X' : 'O';
    const weight = difficulty; // Scale the impact of heuristic based on difficulty

    for (const { board, winner } of boards) {
      if (winner === player) {
        score += 5 * weight;
      } else if (winner === opponent) {
        score -= 5 * weight;
      } else {
        score += (countPotentialWins(board, player) - countPotentialWins(board, opponent)) * weight;
      }
    }
    return score;
  };

  // Count potential winning lines
  const countPotentialWins = (board: any[], player: string) => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6], // Diagonals
    ];

    return winPatterns.reduce((count, pattern) => {
      const line = pattern.map((index) => board[index]);
      if (line.filter((cell) => cell === null).length > 0 && line.includes(player)) {
        count++;
      }
      return count;
    }, 0);
  };

  // Deep copy boards for immutability
  const deepCopyBoards = (boards: any[]) => {
    return boards.map(({ board, winner }) => ({
      board: [...board],
      winner,
    }));
  };

  // Generate AI move using minimax
  const generateAIMove = (boards: any[], nextValidBoard: string | number | null) => {
    let bestMove = null;
    let bestValue = -Infinity;
    const player = 'O';

    const availableBoards = boards
      .map((board, index) => ({ board, index }))
      .filter(({ board, index }) =>
        (nextValidBoard === null || nextValidBoard === index || boards[nextValidBoard as number].winner !== null) &&
        !board.winner
      );

    for (const { board, index } of availableBoards) {
      const emptyCells = board.board
        .map((cell: null, cellIndex: any) => (cell === null ? cellIndex : null))
        .filter((index: null) => index !== null);

      for (const cellIndex of emptyCells) {
        const newBoards = deepCopyBoards(boards);
        newBoards[index].board[cellIndex] = player;

        // Check if this move wins the small board
        if (checkSmallBoardWinner(newBoards[index].board)) {
          newBoards[index].winner = player;
        }

        const moveValue = minimax(newBoards, difficulty, false, -Infinity, Infinity, player, cellIndex);

        if (moveValue > bestValue) {
          bestValue = moveValue;
          bestMove = { boardIndex: index, cellIndex };
        }
      }
    }
    return bestMove;
  };

  const performAIMove = (boards: any[], boardNext: number | null) => {
    setTimeout(() => {
      const aiMove = generateAIMove(boards, boardNext);
      const newBoards = [...boards];
      if (aiMove === null) return;

      newBoards[aiMove.boardIndex].board[aiMove.cellIndex] = 'O';
 
      // Update state with AI's move
      setSmallBoards(newBoards);
 
      // Check if AI won the small board
      const smallBoardWinner = checkSmallBoardWinner(newBoards[aiMove.boardIndex].board);
      if (smallBoardWinner && smallBoardWinner !== 'Draw') {
        newBoards[aiMove.boardIndex].winner = smallBoardWinner;
        setScores((prev) => ({
          ...prev,
          [smallBoardWinner]: prev[smallBoardWinner as keyof typeof prev] + 1,
        }));
      }
 
      // Determine the next valid board
      let nextBoard = aiMove.cellIndex;
      if (smallBoardWinner !== null || newBoards[nextBoard]?.winner) {
        nextBoard = null;
      }
 
      setNextValidBoard(nextBoard);
 
      // Check for a big board winner
      const potentialBigBoardWinner = checkBigBoardWinner(newBoards);
      if (potentialBigBoardWinner) {
        setBigBoardWinner(potentialBigBoardWinner);
        return;
      }
 
      // Switch back to the player's turn
      setCurrentPlayer('X');
    }, 500); // Delay for natural AI behavior
  };
  
  /*
    Add these for theme functionality.
    Right now dark mode is broken, and everything looks ugly (except for the actual shadcn-ui components)
    
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      Wrap everything in this
    </ThemeProvider>
  */

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
            {bigBoardWinner === 'Draw' ? (
              <span className="ml-2">Draw</span>
            ) : (
              <div className="w-10 h-10 ml-2 inline-flex items-center justify-center">
                {renderPlayerIcon(bigBoardWinner)}
            </div>
            )}
            <Button onClick={resetGame} variant="outline" className="ml-4">
              Reset Game
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={false}
            className="text-xl mb-4 flex items-center h-10" // Fixed height to prevent layout shift
          >
            <span className="mr-2">Current Player:</span>
            <div className="w-10 h-10 inline-flex items-center justify-center">
              {renderPlayerIcon(currentPlayer)}
            </div>
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
          <div className="flex justify-center h-10 items-center">
            <X className="w-10 h-10 text-blue-500" />
          </div>
          <div className="text-3xl font-bold">{scores.X}</div>
        </div>
        <div className="text-center flex flex-col items-center">
          <div className="flex justify-center h-10 items-center">
            <Circle className="w-8 h-8 text-red-500 stroke-[2.5]" />
          </div>
          <div className="text-3xl font-bold">{scores.O}</div>
        </div>
      </div>

      <Card className="mt-4 w-64">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="mr-2" /> AI Player
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Play as Circle</span>
            <Switch
              checked={isAIEnabled}
              onCheckedChange={handleAIToggle}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Gauge className="mr-2" />
              <span className="text-sm">{getDifficultyLabel(difficulty)}</span>
            </div>
            <Slider
              disabled={!isAIEnabled}
              defaultValue={[difficulty]}
              min={1}
              max={5}
              step={2}
              onValueChange={handleDifficultyChange}
            />
          </div>
        </CardContent>
      </Card>

     <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Game?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing the AI setting will reset the current game. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingAIChange(null);
              setPendingDifficulty(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuperTicTacToe;
