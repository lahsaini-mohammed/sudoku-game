import React, { useState, useEffect } from 'react';
import { Undo2, Redo2, PlayCircle, Brain, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
// import { Alert, AlertDescription } from "@/components/ui/alert";

// Utility functions for Sudoku logic
const generateSudoku = (difficulty: number): number[][]=> {
  // This is a simplified version - in real implementation you'd want a more sophisticated generator
  const board: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));
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

const SudokuGame = () => {
  const [board, setBoard] = useState<number[][]>([]);
  const [originalBoard, setOriginalBoard] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [difficulty, setDifficulty] = useState(5);
  const [history, setHistory] = useState<number[][][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [conflicts, setConflicts] = useState<[number, number][]>([]);

  useEffect(() => {
    newGame();
  }, []);

  const newGame = () => {
    const newBoard = generateSudoku(difficulty);
    setBoard(newBoard.map(row => [...row]));
    setOriginalBoard(newBoard.map(row => [...row]));
    setHistory([newBoard.map(row => [...row])]);
    setHistoryIndex(0);
    setConflicts([]);
  };

  const handleCellClick = (row: number, col: number): void => {
    if (originalBoard[row][col] === 0) {
      setSelectedCell([row, col]);
    }
  };

  const checkConflicts = (row: number, col: number, num: number): [number, number][] => {
    const conflicts: [number, number][] = [];
    
    // Check row
    for (let i = 0; i < 9; i++) {
      if (i !== col && board[row][i] === num) {
        conflicts.push([row, i]);
      }
    }
    
    // Check column
    for (let i = 0; i < 9; i++) {
      if (i !== row && board[i][col] === num) {
        conflicts.push([i, col]);
      }
    }
    
    // Check 3x3 box
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

  const handleNumberInput = (num: number): void => {
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
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBoard.map(row => [...row]));
    setHistory(newHistory);
    setHistoryIndex(historyIndex + 1);
    
    setBoard(newBoard);
    setConflicts([]);
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
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(solvedBoard.map(row => [...row]));
    setHistory(newHistory);
    setHistoryIndex(historyIndex + 1);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Sudoku Game</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={undo} disabled={historyIndex <= 0}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <span className="text-sm text-gray-600">Difficulty:</span>
          <Slider
            value={[difficulty]}
            onValueChange={(value) => setDifficulty(value[0])}
            max={10}
            min={1}
            step={1}
            className="w-32"
          />
          <span className="text-sm text-gray-600">{difficulty}</span>
        </div>

        <div className="grid grid-cols-9 gap-0 border-2 border-gray-800">
          {board.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  w-10 h-10 flex items-center justify-center
                  border border-gray-300 cursor-pointer
                  ${rowIndex % 3 === 0 && 'border-t-2'}
                  ${colIndex % 3 === 0 && 'border-l-2'}
                  ${selectedCell?.[0] === rowIndex && selectedCell?.[1] === colIndex ? 'bg-blue-100' : ''}
                  ${originalBoard[rowIndex][colIndex] !== 0 ? 'bg-gray-100' : ''}
                  ${conflicts.some(([r, c]) => r === rowIndex && c === colIndex) ? 'bg-red-200' : ''}
                `}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                <span className={`
                  text-lg
                  ${originalBoard[rowIndex][colIndex] !== 0 ? 'font-bold text-gray-800' : 'text-blue-600'}
                `}>
                  {cell !== 0 ? cell : ''}
                </span>
              </div>
            ))
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <Button
              key={num}
              variant="outline"
              onClick={() => handleNumberInput(num)}
              className="w-full"
            >
              {num}
            </Button>
          ))}
        </div>

        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={newGame}
            className="flex items-center space-x-2"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>New Game</span>
          </Button>
          <Button
            variant="outline"
            onClick={solve}
            className="flex items-center space-x-2"
          >
            <Brain className="h-4 w-4" />
            <span>Solve</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SudokuGame;