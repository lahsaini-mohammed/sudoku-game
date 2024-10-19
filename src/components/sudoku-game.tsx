import React, { useState, useEffect } from 'react';
import { Undo2, Redo2, PlayCircle, Brain, RefreshCcw, Pause, Play, Sun, Moon, Lightbulb } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Utility functions for Sudoku logic
const generateSudoku = (difficulty: number): number[][] => {
  const board = Array(9).fill(null).map(() => Array(9).fill(0));
  const emptyCount = Math.floor(20 + (difficulty * 5)); // More empty cells for higher difficulty

  // Fill diagonal boxes first (they're independent)
  for (let i = 0; i < 9; i += 3) {
    fillBox(board, i, i);
  }
  // Solve the rest of the board
  solveSudoku(board);
  // Remove numbers based on difficulty
  let count = emptyCount;
  while (count > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (board[row][col] !== 0) {
      board[row][col] = 0;
      count--;
    }
  }
  
  return board;
};

const fillBox = (board: number[][], row: number, col: number): void => {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const idx = Math.floor(Math.random() * nums.length);
      board[row + i][col + j] = nums[idx];
      nums.splice(idx, 1);
    }
  }
};

const isValid = (board: number[][], row: number, col: number, num: number): boolean => {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }
  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[boxRow + i][boxCol + j] === num) return false;
    }
  }
  
  return true;
};

const solveSudoku = (board: number[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const getCandidates = (board: number[][], row: number, col: number) => {
  if (board[row][col] !== 0) return [];
  const candidates = [];
  for (let num = 1; num <= 9; num++) {
    if (isValid(board, row, col, num)) {
      candidates.push(num);
    }
  }
  return candidates;
};

const getAllCandidates = (board: number[][]) => {
  const candidates: number[][][] = Array(9).fill(null).map(() => 
    Array(9).fill(null).map(() => [])
  );
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        candidates[row][col] = getCandidates(board, row, col);
      }
    }
  }
  return candidates;
};

const findHint = (board: number[][]) => {
  const candidates = getAllCandidates(board);
  let minCandidates = 10;
  let hintCell: [number, number] | null = null;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0 && candidates[row][col].length > 0 && candidates[row][col].length < minCandidates) {
        minCandidates = candidates[row][col].length;
        hintCell = [row, col];
      }
    }
  }
  return hintCell;
};

const SudokuGame = () => {
  const [board, setBoard] = useState<number[][]>([]);
  const [originalBoard, setOriginalBoard] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [difficulty, setDifficulty] = useState(5);
  const [history, setHistory] = useState<number[][][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [conflicts, setConflicts] = useState<[number, number][]>([]);
  const [autoCandidates, setAutoCandidates] = useState<boolean>(false);
  const [candidates, setCandidates] = useState<number[][][]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [time, setTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [hintCell, setHintCell] = useState<[number, number] | null>(null);

  useEffect(() => {
    newGame();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isTimerActive && !isPaused) {
      interval = setInterval(() => {
        setTime((time) => time + 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTimerActive, isPaused]);


  useEffect(() => {
    if (autoCandidates) {
      setCandidates(getAllCandidates(board));
    } else {
      setCandidates([]);
    }
  }, [board, autoCandidates]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const newGame = () => {
    const newBoard = generateSudoku(difficulty);
    setBoard(newBoard.map(row => [...row]));
    setOriginalBoard(newBoard.map(row => [...row]));
    setHistory([newBoard.map(row => [...row])]);
    setHistoryIndex(0);
    setConflicts([]);
    setTime(0);
  };

  const handleCellClick = (row: number, col: number) => {
    if (originalBoard[row][col] === 0) {
      setSelectedCell([row, col]);
    }
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;

    const [row, col] = selectedCell;
    if (originalBoard[row][col] !== 0) return;

    const newConflicts = checkConflicts(row, col, num);
    if (newConflicts.length > 0) {
      setConflicts([...newConflicts, selectedCell]);
      setTimeout(() => setConflicts([]), 1000);
      return;
    }

    const newBoard = board.map(row => [...row]);
    newBoard[selectedCell[0]][selectedCell[1]] = num;

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBoard.map(row => [...row]));
    setHistory(newHistory);
    setHistoryIndex(historyIndex + 1);

    setBoard(newBoard);
    setConflicts([]);
  };


  const checkConflicts = (row: number, col: number, num: number): [number, number][] => {
    const conflicts: [number, number][] = [];
    
    for (let i = 0; i < 9; i++) {
      if (i !== col && board[row][i] === num) {
        conflicts.push([row, i]);
      }
    }
    
    for (let i = 0; i < 9; i++) {
      if (i !== row && board[i][col] === num) {
        conflicts.push([i, col]);
      }
    }
    
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (boxRow + i !== row || boxCol + j !== col) {
          if (board[boxRow + i][boxCol + j] === num) {
            conflicts.push([boxRow + i, boxCol + j]);
          }
        }
      }
    }
    
    return conflicts;
  };

  const revealCell = () => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    if (originalBoard[row][col] !== 0) return;
    
    const solvedBoard = board.map(row => [...row]);
    solveSudoku(solvedBoard);
    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = solvedBoard[row][col];
    setBoard(newBoard);
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBoard.map(row => [...row]));
    setHistory(newHistory);
    setHistoryIndex(historyIndex + 1);
  };

  const showHint = () => {
    const hint = findHint(board);
    if (hint) {
      setHintCell(hint);
      setTimeout(() => setHintCell(null), 2000);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBoard(history[historyIndex - 1].map(row => [...row]));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBoard(history[historyIndex + 1].map(row => [...row]));
    }
  };

  const solve = () => {
    const solvedBoard = board.map(row => [...row]);
    solveSudoku(solvedBoard);
    setBoard(solvedBoard);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(solvedBoard.map(row => [...row]));
    setHistory(newHistory);
    setHistoryIndex(historyIndex + 1);
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-0 sm:p-4 transition-colors duration-200
      ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className={`rounded-lg shadow-lg p-2 sm:p-6 space-y-4 sm:space-y-6 w-auto max-w-xl mx-auto
        ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">Sudoku Game</h1>
          <div className="flex items-center gap-4">
            <div className='flex items-center space-x-2'>
              <div className="text-base sm:text-lg font-mono">{formatTime(time)}</div>
              <Button variant="outline" size="icon" onClick={togglePause}>
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
                className="data-[state=checked]:bg-blue-600"
              />
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Switch
              checked={autoCandidates}
              onCheckedChange={setAutoCandidates}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label className="text-sm sm:text-base">Candidates</Label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base">Difficulty:</span>
            <Slider
              value={[difficulty]}
              onValueChange={(value) => setDifficulty(value[0])}
              max={10}
              min={1}
              step={1}
              className="w-24 sm:w-32"
            />
            <span className="text-sm sm:text-base">{difficulty}</span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        <div className={`grid grid-cols-9 gap-0 border-2 mx-auto max-w-[27rem] ${isDarkMode ? 'border-gray-600' : 'border-gray-800'}`}>
          {board.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  w-[min(11vw,3rem)] h-[min(11vw,3rem)] sm:w-12 sm:h-12
                  flex items-center justify-center relative
                  border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
                  cursor-pointer
                  ${rowIndex % 3 === 0 && isDarkMode ? 'border-t-2 border-t-gray-600' : rowIndex % 3 === 0 ? 'border-t-2' : ''}
                  ${colIndex % 3 === 0 && isDarkMode ? 'border-l-2 border-l-gray-600' : colIndex % 3 === 0 ? 'border-l-2' : ''}
                  ${selectedCell?.[0] === rowIndex && selectedCell?.[1] === colIndex ? 
                    isDarkMode ? 'bg-blue-900' : 'bg-blue-100' : ''}
                  ${originalBoard[rowIndex][colIndex] !== 0 ? 
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100' : ''}
                  ${conflicts.some(([r, c]) => r === rowIndex && c === colIndex) ? 
                    isDarkMode ? 'bg-red-900' : 'bg-red-200' : ''}
                  ${hintCell?.[0] === rowIndex && hintCell?.[1] === colIndex ?
                    isDarkMode ? 'bg-green-900' : 'bg-green-200' : ''}
                `}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {cell !== 0 ? (
                  <span className={`text-sm sm:text-lg ${originalBoard[rowIndex][colIndex] !== 0 ? 
                    'font-bold' : isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {cell}
                  </span>
                ) : autoCandidates && candidates[rowIndex]?.[colIndex]?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-x-1 sm:gap-x-2 gap-y-0 text-[8px] sm:text-[9px] p-0">
                    {[1,2,3,4,5,6,7,8,9].map(num => (
                      <div key={num} className={candidates[rowIndex][colIndex].includes(num) ? 
                        isDarkMode ? 'text-gray-400' : 'text-gray-600' : 'invisible'}>
                        {num}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          ))}
        </div>

        <div className={`grid grid-cols-9 gap-1 mt-4 mx-auto max-w-md ${isDarkMode ? 'text-white' : ''}`}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <Button
              key={num}
              variant={isDarkMode ? "outline" : "secondary"}
              onClick={() => handleNumberInput(num)}
              className="w-10 h-10 text-sm"
            >
              {num}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center mt-4 gap-1">
          <Button
            variant="outline"
            onClick={newGame}
            className="flex items-center gap-1 text-sm"
          >
            <RefreshCcw className="h-3 w-3" />
            <span>New Game</span>
          </Button>
          <Button
            variant="outline"
            onClick={revealCell}
            disabled={!selectedCell}
            className="flex items-center gap-1 text-sm"
          >
            <PlayCircle className="h-3 w-3" />
            <span>Reveal Cell</span>
          </Button>
          <Button
            variant="outline"
            onClick={showHint}
            className="flex items-center gap-1 text-sm"
          >
            <Lightbulb className="h-3 w-3 " />
            <span>Hint</span>
          </Button>
          <Button
            variant="outline"
            onClick={solve}
            className="flex items-center gap-1 text-sm"
          >
            <Brain className="h-3 w-3" />
            <span>Solve</span>
          </Button>
        </div>
      </div>

      <Dialog open={isPaused} onOpenChange={setIsPaused}>
        <DialogContent className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle>Game Paused</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <p className="text-lg">Time: {formatTime(time)}</p>
            <Button onClick={togglePause} className="w-32">
              Resume Game
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SudokuGame;