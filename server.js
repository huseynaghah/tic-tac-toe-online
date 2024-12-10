const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (your game HTML, CSS, JS)
app.use(express.static('public'));

let games = {}; // Object to hold ongoing games

// Handle new socket connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Create a new game or join an existing one
    socket.on('create_game', () => {
        const gameId = Math.random().toString(36).substring(2, 7);
        games[gameId] = { players: [socket.id], board: ["", "", "", "", "", "", "", "", ""], currentPlayer: "X", gameOver: false };
        socket.emit('game_created', gameId);
        console.log(`Game created: ${gameId}`);
    });

    socket.on('join_game', (gameId) => {
        const game = games[gameId];
        if (game && game.players.length === 1) {
            game.players.push(socket.id);
            io.to(game.players[0]).emit('game_started', gameId);
            socket.emit('game_started', gameId);
            console.log(`Player joined game: ${gameId}`);
        } else {
            socket.emit('game_full');
        }
    });

    // Handle player move
    socket.on('make_move', (gameId, index) => {
        const game = games[gameId];
        if (game && !game.gameOver && game.players.includes(socket.id) && game.board[index] === "") {
            game.board[index] = game.currentPlayer;
            io.to(game.players[0]).emit('update_board', game.board);
            io.to(game.players[1]).emit('update_board', game.board);
            checkWinner(gameId);
            game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
        }
    });

    // Check for winner
    function checkWinner(gameId) {
        const game = games[gameId];
        const winningCombinations = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];

        for (let combination of winningCombinations) {
            const [a, b, c] = combination;
            if (game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c]) {
                io.to(game.players[0]).emit('game_over', `${game.currentPlayer} wins!`);
                io.to(game.players[1]).emit('game_over', `${game.currentPlayer} wins!`);
                game.gameOver = true;
                return;
            }
        }

        if (!game.board.includes("")) {
            io.to(game.players[0]).emit('game_over', "It's a draw!");
            io.to(game.players[1]).emit('game_over', "It's a draw!");
            game.gameOver = true;
        }
    }

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        for (let gameId in games) {
            if (games[gameId].players.includes(socket.id)) {
                io.to(games[gameId].players[0]).emit('game_over', 'Your opponent has left.');
                io.to(games[gameId].players[1]).emit('game_over', 'Your opponent has left.');
                delete games[gameId];
            }
        }
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
