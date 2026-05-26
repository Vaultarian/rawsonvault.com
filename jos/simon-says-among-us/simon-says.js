// --- CORE REGISTRY CONFIGURATION ---
const previewGrid = document.getElementById('previewGrid');
const interactiveKeypad = document.getElementById('interactiveKeypad');
const scoreDisplay = document.getElementById('currentScore');
const resetBtn = document.getElementById('resetButton');
const cooldownOverlay = document.getElementById('cooldownOverlay');

let sequence = [];
let userSequence = [];
let score = 0;
let isFlashing = false;
let userTurn = false;
let skipTriggered = false;
let currentSpiralInterval = null;
let isCooldownActive = false;

function generateGrids() {
    previewGrid.innerHTML = '';
    interactiveKeypad.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const displayTile = document.createElement('div');
        displayTile.classList.add('tile');
        displayTile.dataset.index = i;
        previewGrid.appendChild(displayTile);
        
        const inputButton = document.createElement('div');
        inputButton.classList.add('tile', 'interactive-tile');
        inputButton.dataset.index = i;
        
        inputButton.addEventListener('click', () => handleUserInput(i));
        interactiveKeypad.appendChild(inputButton);
    }
}

function startNextRound() {
    userTurn = false;
    isFlashing = true;
    userSequence = [];
    
    const randomTile = Math.floor(Math.random() * 9);
    sequence.push(randomTile);
    
    let step = 0;
    const dynamicIntervalSpeed = Math.max(250, 600 - (score * 10)); 
    
    window.currentPlaybackTimer = setInterval(() => {
        if (step < sequence.length) {
            flashLeftTile(sequence[step]);
            step++;
        } else {
            clearInterval(window.currentPlaybackTimer);
            isFlashing = false;
            userTurn = true;
        }
    }, dynamicIntervalSpeed);
}

function flashLeftTile(index) {
    const targets = previewGrid.children;
    if (targets[index]) {
        targets[index].classList.add('flash-blue');
        setTimeout(() => {
            targets[index].classList.remove('flash-blue');
        }, 300);
    }
}

function handleUserInput(index) {
    if (!userTurn || isFlashing || isCooldownActive) return;
    
    userSequence.push(index);
    const expectedMatchIndex = userSequence.length - 1;
    
    if (userSequence[expectedMatchIndex] === sequence[expectedMatchIndex]) {
        if (userSequence.length === sequence.length) {
            score++;
            scoreDisplay.innerText = score;
            userTurn = false;
            
            const activePanels = document.querySelectorAll('.panel-box');
            activePanels.forEach(panel => {
                panel.classList.add('victory-pulse');
                setTimeout(() => { panel.classList.remove('victory-pulse'); }, 600);
            });
            
            setTimeout(startNextRound, 1000);
        }
    } else {
        // Condition A: Wrong sequence given -> triggers cross-panel spiral meltdown
        triggerGrandSpiralMeltdown();
    }
}

function triggerGrandSpiralMeltdown() {
    userTurn = false;
    isFlashing = true;
    
    // Lock the button down immediately for the 3-second penalty
    triggerOverlayBarrier();

    const globalSpiralOrder = [
        { panel: 'L', index: 0 }, { panel: 'L', index: 1 }, { panel: 'L', index: 2 },
        { panel: 'R', index: 0 }, { panel: 'R', index: 1 }, { panel: 'R', index: 2 },
        { panel: 'R', index: 5 }, { panel: 'R', index: 8 }, { panel: 'R', index: 7 },
        { panel: 'R', index: 6 }, { panel: 'L', index: 8 }, { panel: 'L', index: 7 },
        { panel: 'L', index: 6 }, { panel: 'L', index: 3 }, { panel: 'L', index: 4 },
        { panel: 'L', index: 5 }, { panel: 'R', index: 3 }, { panel: 'R', index: 4 }
    ];
    
    let step = 0;
    const leftTiles = previewGrid.children;
    const rightTiles = interactiveKeypad.children;
    
    currentSpiralInterval = setInterval(() => {
        if (step < globalSpiralOrder.length) {
            const target = globalSpiralOrder[step];
            if (target.panel === 'L' && leftTiles[target.index]) {
                leftTiles[target.index].classList.add('meltdown-red');
            } else if (target.panel === 'R' && rightTiles[target.index]) {
                rightTiles[target.index].classList.add('meltdown-red');
            }
            step++;
        } else {
            clearInterval(currentSpiralInterval);
            window.meltdownTimeout = setTimeout(() => {
                systemWipeLogic();
            }, 2000);
        }
    }, 70);
}

function systemWipeLogic() {
    clearInterval(window.currentPlaybackTimer);
    clearInterval(currentSpiralInterval);
    clearTimeout(window.meltdownTimeout);
    
    sequence = [];
    userSequence = [];
    score = 0;
    scoreDisplay.innerText = score;
    isFlashing = false;
    userTurn = false;
    
    const leftTiles = previewGrid.children;
    const rightTiles = interactiveKeypad.children;
    
    for (let i = 0; i < 9; i++) {
        if (leftTiles[i]) leftTiles[i].classList.remove('meltdown-red', 'flash-blue');
        if (rightTiles[i]) rightTiles[i].classList.remove('meltdown-red');
    }
    
    setTimeout(startNextRound, 600);
}

// Global 3-second overlay lock routine
function triggerOverlayBarrier() {
    if (isCooldownActive) return;
    isCooldownActive = true;
    
    cooldownOverlay.classList.add('active');
    
    let countdownTime = 3;
    cooldownOverlay.innerText = countdownTime;
    
    const countdownTimer = setInterval(() => {
        countdownTime--;
        if (countdownTime > 0) {
            cooldownOverlay.innerText = countdownTime;
        } else {
            clearInterval(countdownTimer);
            cooldownOverlay.classList.remove('active');
            
            setTimeout(() => {
                cooldownOverlay.innerText = '';
                isCooldownActive = false;
            }, 500);
        }
    }, 1000);
}

// FIXED: Condition B: Manual click -> triggers wipe AND activates the 3s overlay shield!
function handleManualResetRequest() {
    if (isCooldownActive) return;
    
    systemWipeLogic();       // Clear the board instantly
    triggerOverlayBarrier(); // Start the 3-2-1 fade mask on the button
}

resetBtn.addEventListener('click', handleManualResetRequest);

generateGrids();
setTimeout(startNextRound, 1000);

