// --- CENTRAL DATA REGISTRY ---
const tileContainer = document.getElementById('tileContainer');
const scoreDisplay = document.getElementById('currentScore');
const highDisplay = document.getElementById('highScore');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const retryButton = document.getElementById('retryButton');

let currentScore = 0;
let highScore = localStorage.getItem('2048_highScore∞') ? parseInt(localStorage.getItem('2048_highScore∞')) : 0;
highDisplay.innerText = highScore;

let activeTilesList = [];
let nextUniqueTileId = 0;
let isSessionActive = true; 
const pixelMap = [12, 121.5, 231, 340.5];

class GameTile {
    constructor(row, col, value) {
        this.row = row;
        this.col = col;
        this.value = value;
        this.id = nextUniqueTileId++;
        this.isMerged = false;
        
        this.element = document.createElement('div');
        this.element.innerText = value;
        this.updateVisualStyles();
        this.element.classList.add('animate-spawn');
        tileContainer.appendChild(this.element);
    }

    updatePosition(newRow, newCol) {
        this.row = newRow;
        this.col = newCol;
        this.updateVisualStyles();
    }

    updateVisualStyles() {
        this.element.className = 'tile-element';
        this.element.classList.add(`tile-${this.value > 2048 ? 'super' : this.value}`);
        this.element.style.top = `${pixelMap[this.row]}px`;
        this.element.style.left = `${pixelMap[this.col]}px`;
    }

    triggerMergeAnimation(newValue) {
        this.value = newValue;
        this.element.innerText = newValue;
        this.updateVisualStyles();
        this.element.classList.remove('animate-spawn');
        this.element.classList.add('animate-merge');
    }

    destroyWithDelay() {
        setTimeout(() => { this.element.remove(); }, 120);
    }
}

function getVirtualMatrixMap() {
    let map = Array(4).fill(null).map(() => Array(4).fill(null));
    activeTilesList.forEach(tile => {
        if (!tile.isMerged) map[tile.row][tile.col] = tile;
    });
    return map;
}

function spawnRandomTile() {
    let matrix = getVirtualMatrixMap();
    let emptyCellsList = [];
    
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (matrix[r][c] === null) emptyCellsList.push({r, c});
        }
    }
    
    if (emptyCellsList.length > 0) {
        let picked = emptyCellsList[Math.floor(Math.random() * emptyCellsList.length)];
        let val = Math.random() < 0.9 ? 2 : 4;
        activeTilesList.push(new GameTile(picked.r, picked.c, val));
    }
}

function handleGridMovementVector(direction) {
    if (!isSessionActive) return;
    
    let hasMoved = false;
    let matrix = getVirtualMatrixMap();
    activeTilesList.forEach(t => t.isMerged = false);

    let rowSequence = direction === 'DOWN' ? [3, 2, 1, 0] : [0, 1, 2, 3];
    let colSequence = direction === 'RIGHT' ? [3, 2, 1, 0] : [0, 1, 2, 3];

    rowSequence.forEach(r => {
        colSequence.forEach(c => {
            let currentTile = matrix[r][c];
            if (currentTile === null) return;

            let nextR = r;
            let nextC = c;
            let stepR = direction === 'UP' ? -1 : direction === 'DOWN' ? 1 : 0;
            let stepC = direction === 'LEFT' ? -1 : direction === 'RIGHT' ? 1 : 0;

            while (true) {
                let testR = nextR + stepR;
                let testC = nextC + stepC;
                
                if (testR < 0 || testR > 3 || testC < 0 || testC > 3) break;
                
                let targetCell = matrix[testR][testC];
                if (targetCell === null) {
                    nextR = testR;
                    nextC = testC;
                    hasMoved = true;
                } else if (targetCell.value === currentTile.value && !targetCell.isMerged && !currentTile.isMerged) {
                    nextR = testR;
                    nextC = testC;
                    
                    currentTile.updatePosition(nextR, nextC);
                    currentTile.destroyWithDelay();
                    
                    let newMergeSum = targetCell.value * 2;
                    setTimeout(() => { targetCell.triggerMergeAnimation(newMergeSum); }, 100);
                    
                    targetCell.isMerged = true;
                    activeTilesList = activeTilesList.filter(t => t.id !== currentTile.id);
                    currentScore += newMergeSum;
                    scoreDisplay.innerText = currentScore;
                    
                    if (currentScore > highScore) {
                        highScore = currentScore;
                        highDisplay.innerText = highScore;
                        localStorage.setItem('2048_highScore∞', highScore);
                    }

                    matrix = getVirtualMatrixMap();
                    hasMoved = true;
                    return;
                } else {
                    break;
                }
            }

            if (nextR !== r || nextC !== c) {
                currentTile.updatePosition(nextR, nextC);
                matrix = getVirtualMatrixMap();
                hasMoved = true;
            }
        });
    });

    if (hasMoved) {
        setTimeout(() => { 
            spawnRandomTile(); 
            if (checkIsGameOver()) {
                // FIXED: Freeze layout immediately but hold overlay window for exactly 1 second (1000ms)
                isSessionActive = false; 
                setTimeout(triggerGameOverState, 1000);
            }
        }, 120);
    }
}

function checkIsGameOver() {
    let matrix = getVirtualMatrixMap();
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (matrix[r][c] === null) return false;
        }
    }
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            let val = matrix[r][c].value;
            if (r < 3 && matrix[r+1][c] && matrix[r+1][c].value === val) return false;
            if (c < 3 && matrix[r][c+1] && matrix[r][c+1].value === val) return false;
        }
    }
    return true; 
}

function triggerGameOverState() {
    gameOverOverlay.classList.add('active');
}

function bootGame() {
    tileContainer.innerHTML = '';
    activeTilesList = [];
    currentScore = 0;
    scoreDisplay.innerText = currentScore;
    isSessionActive = true;
    gameOverOverlay.classList.remove('active');
    
    spawnRandomTile();
    spawnRandomTile();
}

window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'KeyW'].includes(event.code))    { event.preventDefault(); handleGridMovementVector('UP'); }
    if (['ArrowDown', 'KeyS'].includes(event.code))  { event.preventDefault(); handleGridMovementVector('DOWN'); }
    if (['ArrowLeft', 'KeyA'].includes(event.code))  { event.preventDefault(); handleGridMovementVector('LEFT'); }
    if (['ArrowRight', 'KeyD'].includes(event.code)) { event.preventDefault(); handleGridMovementVector('RIGHT'); }
});

retryButton.addEventListener('click', bootGame);
bootGame();

