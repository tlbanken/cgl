// global configs
const CELL_COLOR_ON = "rgb(200, 200, 200)";
const CELL_COLOR_OFF = "rgb(0, 0, 0)";

// get canvas element and fill browser window
let canvas = document.querySelector('.myCanvas');
let width = canvas.width = Math.round(window.innerWidth * .95);
let height = canvas.height = Math.round(window.innerHeight * .80);
console.log(`Canvas: ${width}x${height}`);

// get 2d context
const ctx = canvas.getContext('2d');

// *** Button state ***
const playPauseButton = document.querySelector('.playPause');
let paused = true;
playPauseButton.onclick = () => {
    if (paused) {
        console.log("Resuming");
        playPauseButton.innerHTML = "Pause";
    } else {
        console.log("Pausing");
        playPauseButton.innerHTML = "Play";
    }
    paused = !paused;
};
const generateButton = document.querySelector('.generate');
generateButton.onclick = () => {
    console.log("Randomizing cells");
    generateCells();
};
const clearButton = document.querySelector('.clear');
clearButton.onclick = () => {
    console.log("Clearing all cells");
    model.fill(0);
};

// *** Slider State ***
const speedSlider = document.getElementById('speedRange');
speedSlider.onchange = () => {
    frameDelay = parseInt(speedSlider.max) - speedSlider.value;
    console.log("Setting frame delay to " + frameDelay);
};
let frameDelay = parseInt(speedSlider.max - speedSlider.value);
const resolutionSlider = document.getElementById('resolutionRange');
resolutionSlider.onchange = () => {
    cellSize = parseInt(resolutionSlider.max) - resolutionSlider.value;
    resizeModel(pxToCell(width) * pxToCell(height));
};
let cellSize = parseInt(resolutionSlider.max) - resolutionSlider.value;

// *** MODEL ***
let model = new Array(pxToCell(width) * pxToCell(height)).fill(0);
let aliveCells = new Array;
let deadCells = new Array;
function resizeModel(newSize) {
    let newArr = new Array;
    let i = 0;
    while (newArr.length < newSize) {
        // TODO: fix the way the cells are cleared so it visually meets expectations
        if (i < model.length) {
            newArr.push(model[i]);
            i += 1;
        } else {
            newArr.push(0);
        }
    }
    console.log(`Model resized: ${model.length} -> ${newArr.length}`);
    model = newArr;
}
window.addEventListener('resize', (e) => {
    width = canvas.width = Math.round(window.innerWidth * .80);
    // width = canvas.width;
    height = canvas.height = Math.round(window.innerHeight * .80);
    // height = canvas.height;
    resizeModel(pxToCell(width) * pxToCell(height));
});
canvas.addEventListener('mousedown', (e) => {
    let coord = getCellClicked(e);
    setCell(coord[0], coord[1]);
});

// *** MAIN ***
let loopNum = 0;
/*
 * Main game loop.
 */
function loop() {
    loopNum = (loopNum + 1) % frameDelay;
    // draw
    for (let x in [...Array(pxToCell(width)).keys()]) {
        for (let y in [...Array(pxToCell(height)).keys()]) {
            let xi = parseInt(x);
            let yi = parseInt(y);
            drawCellAt(xi, yi);
            if (!paused && loopNum == 0) {
                testCell(xi, yi);
            }
        }
    }

    // push the new changes from testCell()
    for (let coord of aliveCells) {
        setCell(coord[0], coord[1]);
        drawCellAt(coord[0], coord[1]);
    }
    for (let coord of deadCells) {
        clearCell(coord[0], coord[1]);
        drawCellAt(coord[0], coord[1]);
    }
    aliveCells = new Array;
    deadCells = new Array;

    requestAnimationFrame(loop);
}
loop();

// *** Game Logic ***
/*
 * Checks if the given cell should be set or cleared at the end of the round.
 *
 * Rules:
 * 1. Any live cell with two or three live neighbours survives.
 * 2. Any dead cell with three live neighbours becomes a live cell.
 * 3. All other live cells die in the next generation. Similarly, all other dead cells stay dead.
 */
function testCell(x, y) {
    let neighborStates = getStateOfNeighbors(x, y);
    let numAliveNeighbors = getAliveNeighbors(neighborStates);
    let alive = getCellValueAt(x, y) != 0;

    // rule 1
    if (alive && (numAliveNeighbors == 2) || (numAliveNeighbors == 3)) {
        if (!alive) {
            aliveCells.push([x, y]);
        }
        return;
    }
    // rule 2
    if (!alive && (numAliveNeighbors == 3)) {
        if (!alive) {
            aliveCells.push([x, y]);
        }
        return;
    }
    // rule 3
    if (alive) {
        deadCells.push([x, y]);
    }
}

function getAliveNeighbors(neighborStates) {
    let numLive = 0;
    for (let ns of neighborStates) {
        numLive += ns;
    }
    return numLive;
}

// *** Helpers ***
/*
 * Convert from pixel space to cell space.
 */
function pxToCell(x) {
    return Math.round(x / cellSize);
}
/*
 * Convert from cell space to pixel space.
 */
function cellToPx(x) {
    return x * cellSize;
}

function setCell(x, y) {
    let index = y * pxToCell(width) + x;
    if (index > model.length || index < 0) {
        throw (`Attempting to access cell outside window (${x}, ${y}) -- Size: ${model.length}`);
    }
    model[index] = 1;
}

function clearCell(x, y) {
    let index = y * pxToCell(width) + x;
    if (index > model.length || index < 0) {
        throw (`Attempting to access cell outside window (${x}, ${y}) -- Size: ${model.length}`);
    }
    model[index] = 0;
}

function getCellValueAt(x, y) {
    let index = y * pxToCell(width) + x;
    if (index > model.length || index < 0) {
        // console.warn(`Attempting to access cell outside window (${x}, ${y}) -- Size: ${model.length}`);
        return 0;
    }
    return model[index];
}

/*
 * Draw the cell at the given (x,y) cell coordinates.
 */
function drawCellAt(x, y) {
    let xPx = cellToPx(x);
    let yPx = cellToPx(y);
    if (xPx >= width || yPx >= height) {
        throw(`Attempting to draw offscreen! (${xPx}, ${yPx}) >= (${width}, ${height})`);
    }
    
    // draw the current value of the cell
    let val = getCellValueAt(x, y);
    if (getCellValueAt(x, y) == 0) {
        // nothing here
        ctx.fillStyle = CELL_COLOR_OFF;
    } else {
        ctx.fillStyle = CELL_COLOR_ON;
    }
    ctx.fillRect(xPx, yPx, cellSize, cellSize);
}


/*
 * Returns the coordinate of the cell clicked.
 */
function getCellClicked(event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    let cellX = pxToCell(x);
    let cellY = pxToCell(y);
    console.log(`Clicked cell (${cellX}, ${cellY})`);

    return [cellX, cellY];
}

function getStateOfNeighbors(x, y) {
    let states = new Array;
    states.push(getCellValueAt(x + 1, y));
    states.push(getCellValueAt(x - 1, y));
    states.push(getCellValueAt(x, y + 1));
    states.push(getCellValueAt(x, y - 1));
    states.push(getCellValueAt(x + 1, y + 1));
    states.push(getCellValueAt(x - 1, y + 1));
    states.push(getCellValueAt(x + 1, y - 1));
    states.push(getCellValueAt(x - 1, y - 1));
    return states;
}

function generateCells() {
    for (let i in [...Array(model.length)]) {
        model[i] = Math.round(Math.random());
    }
}