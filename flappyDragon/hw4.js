"use strict";
let myGamePiece;
let myObstacles = [];  // an array of obstacles
let scoreWidth = 150;  // width of the score board on the right of the canvas
let frameCounter = 0;  // used to determine (1) score (2) game piece animation

// image
let bgImage = new Image();  // background image
bgImage.src = "background.png";

// audio
let pressAudio = new Audio("button.mp3");
let scoreAudio = new Audio("score.mp3");
let gameoverAudio = new Audio("gameover.mp3");
let swingAudio = new Audio("swing.mp3");

function play(audio) {
    audio.pause();  // stop the audio of the same type if it's still playing
    audio.currentTime = 0;
    audio.play();
}

let myGameArea = {  // an object to hold the game area
    canvas : document.createElement("canvas"),
    start : function() {  // create the canvas
        this.canvas.width = 750 + scoreWidth; // scoreWidth: for score board
        this.canvas.height = 375;
        this.canvas.style.border = "2px solid black";
        this.context = this.canvas.getContext("2d");

        // insert <canvas> to the beginning of <body>
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);

        // animation
        this.interval = setInterval(updateGameArea, 20);

        // control the movement of the component
        window.addEventListener("keydown", function (e) {
            myGameArea.keys = (myGameArea.keys || []);
            if (!myGameArea.keys[e.keyCode]) {
                play(swingAudio);  // only play when the key is first pressed down
            }
            myGameArea.keys[e.keyCode] = true;
        });
        window.addEventListener("keyup", function (e) {
            myGameArea.keys[e.keyCode] = false;
        });
    },
    clear : function() {  // clear the canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    stop : function() {  // game-over, play a sound
        clearInterval(this.interval);
        play(gameoverAudio);
        showGameOver();  // show the game-over screen
    }
}

// base class: shared by obstacle and pieceComponent
class component {
    constructor(width, height, x, y) {
        this.width = width;
        this.height = height;
        this.x = x;  // pos-X
        this.y = y;  // pos-Y
        this.deltaX = undefined;  // defined in child class constructor
    }

    moveLeft() { this.x -= this.deltaX; }

    // detect collision with other component
    crashWith(otherobj) {
        let buffer = 5;  // the hitbox is slightly smaller than the actual box

        // my hitbox
        let myleft = this.x + buffer;
        let myright = this.x + this.width - buffer;
        let mytop = this.y + buffer;
        let mybottom = this.y + this.height - buffer;

        // other hitbox
        let otherleft = otherobj.x + buffer;
        let otherright = otherobj.x + otherobj.width - buffer;
        let othertop = otherobj.y + buffer;
        let otherbottom = otherobj.y + otherobj.height - buffer;
        
        // determine if there is a crash
        let crash = true;
        if ((mybottom < othertop) || (mytop > otherbottom) ||
            (myright < otherleft) || (myleft > otherright)) {
            crash = false;
        }
        return crash;
    }
}

// obstacle: only needs to move left and be drawn as a rectangle
class obstacle extends component {
    constructor(width, height, source, x, y, deltaX, type) {
        super(width, height, x, y);
        this.deltaX = 1.5;  // obstacle always moves left at speed 1.5
        this.src = source;
        this.type = type;  // type: "upper" or "lower"
    }

    // redraw the component on the canvas
    update() {
        let ctx = myGameArea.context;
        this.image = new Image();
        this.image.src = this.src;
        
        if (this.type === "upper") {  // cut the left part of the image
            ctx.drawImage(this.image, 0, 0, this.image.width / 2, this.image.height, this.x, this.y, this.width, this.height);
        } else {  // lower obstacle: cut the right part of the image
            ctx.drawImage(this.image, this.image.width / 2, 0, this.image.width / 2, this.image.height, this.x, this.y, this.width, this.height);
        }
    }
}

// pieceComponent (inherited from component)
class pieceComponent extends component {
    constructor(width, height, src, x, y, deltaX, deltaUp, accDown, gravity, bounce) {
        super(width, height, x, y);
        this.deltaX = deltaX;
        this.deltaUp = deltaUp;  // set gravitySpeed = deltaUp when moveUp() is called
        this.accDown = accDown;  // increase gravitySpeed by accDown when moveDown() is called
        this.gravity = gravity;
        this.gravitySpeed = 0;  // speed caused by gravity
        this.bounce = bounce;  // bounce when hit the bottom border

        // for image
        this.src = src;
        this.wingDown = false;
        this.facing = "left";
    }

    // redraw the component on the canvas
    update() {
        let ctx = myGameArea.context;
        this.image = new Image();
        this.image.src = this.src;
        if (frameCounter % 10 === 0) {this.wingDown = !this.wingDown;}

        // cut the image
        let sw = this.image.width / 2;
        let sh = this.image.height / 2;
        let sx = 0, sy = 0;

        // facing left / right
        if (this.facing === "left") {sx = 0;}
        else {sx = sw;}

        // wingDown / wingUp
        if (this.wingDown) {sy = sh;}
        else {sy = 0;}

        ctx.drawImage(this.image, sx, sy, sw, sh, this.x, this.y, 75, 75);
    }

    moveRight() {this.x += this.deltaX;}
    moveUp() {this.gravitySpeed = this.deltaUp;}
    moveDown() {this.gravitySpeed += this.accDown;}

    // calculate the new pos of the component
    newPos() {
        this.gravitySpeed += this.gravity;
        this.y += this.gravitySpeed;
    }

    hitBorder() {
        let topBorder = 0, leftBorder = 0;
        let bottomBorder = myGameArea.canvas.height - this.height;
        let rightBorder = myGameArea.canvas.width - this.width - scoreWidth;
        if (this.x > rightBorder) { this.x = rightBorder; }
        if (this.x < leftBorder) { this.x = leftBorder; }
        if (this.y < topBorder) { this.y = topBorder; }
        if (this.y > bottomBorder) {
            this.y = bottomBorder;
            this.gravitySpeed = -(this.gravitySpeed * this.bounce);
        }
    }
}


// update: clear and redraw the game area and the component
function updateGameArea() {
    for (let i = 0; i < myObstacles.length; i++) {
        if (myGamePiece.crashWith(myObstacles[i])) {
            myGameArea.stop();  // game-over
            return;
        }
    }

    // redraw the background image
    myGameArea.clear();
    let ctx = myGameArea.context;
    ctx.drawImage(  // draw the background image
        bgImage, 0, 0, myGameArea.canvas.width, myGameArea.canvas.height
    );

    // redraw the component according to the keyboard input
    updateByKeyBoard();

    // redraw the gamePiece
    myGamePiece.newPos();
    myGamePiece.update();
    myGamePiece.hitBorder();

    // generate new obstacles
    frameCounter++;
    if (frameCounter % 200 == 0) {  // play the sound
        play(scoreAudio);
    }
    let interval = 150;
    if (frameCounter == 1 || everyinterval(interval)) {  // add new obstacles every fixed intervals
        let x = myGameArea.canvas.width - scoreWidth;  // generate the obstacle at the right-most of the canvas
        let minGap = 120, maxGap = 225;
        let gap = Math.floor(Math.random()*(maxGap - minGap + 1) + minGap);
        let minBar = 20;  // the minimum height of the upper / lower obstacle
        let gapUpper = Math.floor(Math.random() * (myGameArea.canvas.height - gap - 2 * minBar) + minBar);
        myObstacles.push(new obstacle(30, gapUpper, "obstacle.png", x, 0, 1.5, "upper"));
        myObstacles.push(new obstacle(30, myGameArea.canvas.height - gapUpper - gap, "obstacle.png", x, gapUpper + gap, 1.5, "lower"));
    }

    // if the obstacle goes out of the canvas, remove it from the array
    while (myObstacles.length > 0 && myObstacles[0].x < -myObstacles[0].width) {
        myObstacles.shift();  // remove the first element
    }

    // redraw each obstacle
    for (let i = 0; i < myObstacles.length; i++) {
        myObstacles[i].moveLeft();
        myObstacles[i].update();
    }

    // renew score = frameCounter, with a line separating it from the game area
    ctx.beginPath();
    ctx.moveTo(myGameArea.canvas.width - scoreWidth, 0);
    ctx.lineTo(myGameArea.canvas.width - scoreWidth, myGameArea.canvas.height);
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.font = "20px 'Segoe UI', sans-serif";
    ctx.fillStyle = "black";
    ctx.fillText("SCORE: " + frameCounter, myGameArea.canvas.width - scoreWidth + 10, 30);
}


// external control
function updateByKeyBoard() {
    if (myGameArea.keys) {
        if (myGameArea.keys[37]) {
            myGamePiece.moveLeft();
            myGamePiece.facing = "left";
        }
        if (myGameArea.keys[39]) {
            myGamePiece.moveRight();
            myGamePiece.facing = "right";
        }
        if (myGameArea.keys[38]) {
            myGamePiece.moveUp();
        }
        if (myGameArea.keys[40]) {
            myGamePiece.moveDown();
        }
    }
}

function everyinterval(n) {
    if ((frameCounter / n) % 1 == 0) {return true;}
    return false;
}

// show the instruction screen on page load (do NOT call startGame here)
showInstructions();

function showInstructions() {
    document.getElementById("start-screen").style.display = "flex";
}

function launchGame() {
    // play an audio
    play(pressAudio);

    // hide all overlay screens
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("gameover-screen").style.display = "none";

    // reset game state
    myObstacles = [];
    frameCounter = 0;

    // start the game
    myGameArea.start();
    myGamePiece = new pieceComponent(75, 75, "dragon.png", 15, 180, 2.25, -2.25, 0.075, 0.075, 0.6);
}

function showGameOver() {
    document.getElementById("final-score").textContent = "SCORE: " + frameCounter;
    document.getElementById("gameover-screen").style.display = "flex";
}