const socket = io();

let currentPlayer = "";
let gameId = "";
const currentPlayerSpan = document.getElementById("current-player");
const gameStatus = document.getElementById("game-status");
const cells = document.querySelectorAll(".cell");
const createGameButton = document.getElementById("create-game");
const joinGameButton = document.getElementById("join-game");
const gameIdInput = document.getElementById("game-id-input");

createGameButton.addEventListener("click", () => {
    socket.emit("create_game");
});

joinGameButton.addEventListener("click", () => {
    const gameIdValue = gameIdInput.value;
    if (gameIdValue) {
        socket.emit("join_game", gameIdValue);
    }
});

socket.on('game_created', (id) => {
    gameId = id;
    currentPlayer = "X";
    currentPlayerSpan.textContent = "Current player: X";
    gameStatus.textContent = "Waiting for second player..." + id;
});

socket.on('game_started', (id) => {
    gameId = id;
    currentPlayer = "O";
    currentPlayerSpan.textContent = "Current player: O";
    gameStatus.textContent = "Game started!";
});

socket.on('game_full', () => {
    gameStatus.textContent = "Game is full!";
});

socket.on('update_board', (board) => {
    board.forEach((mark, index) => {
        cells[index].textContent = mark;
    });
});

socket.on('game_over', (message) => {
    gameStatus.textContent = message;
});

cells.forEach(cell => {
    cell.addEventListener("click", () => {
        const index = cell.getAttribute("data-cell-index");
        if (!cell.textContent && currentPlayer !== "") {
            socket.emit('make_move', gameId, index);
        }
    });
});
