"use strict";

const COUNT = 6;     // 開獎號碼 (小球) 數量
const TOTAL = 49;    // 總號碼數量 (1~49)
const ROLL_MS = 50;    // 滾動更新速率 (ms)
const REVEAL_MS = 1000;  // 每顆開獎間隔 (ms)

let lotto = null;
let rollTimer = null;
let revealTimer = null;

const statusText = document.getElementById("statusText");
const restartBtn = document.getElementById("restartBtn");

function ball(i) {  // 取得第 i 顆球的 DOM element
    return document.getElementById("ball-" + i);
}

// 產生 6 個不重複號碼
function generateLotto() {
    let pool = new Array(COUNT);  // 初始化
    let currentBall = 0;
    while (currentBall < COUNT) {  // 次數不固定，直到產生六個不同數字為止
        let n = Math.floor(Math.random() * TOTAL) + 1;
        if (!pool.includes(n)) {
            pool[currentBall] = n;
            currentBall++;
        }
    }
    return pool;
}

function startLotto() {
    lotto = generateLotto();
    let revealIdx = 0;  // 由左到右目前第幾顆球將要開獎

    // 重置球
    for (let i = 0; i < COUNT; i++) {
        ball(i).textContent = "?";
        ball(i).classList.remove("locked");  // 這顆球的 class 初始化移除 locked
    }

    statusText.textContent = "開獎進行中…";
    restartBtn.disabled = true;  // 不可以點擊

    // 視覺滾動 (針對還沒開獎的球)
    clearInterval(rollTimer);
    rollTimer = setInterval(function() {
        for (let i = revealIdx; i < COUNT; i++) {
            ball(i).textContent = Math.floor(Math.random() * TOTAL) + 1;
        }
    }, ROLL_MS);

    // 依序開獎
    function revealNext() {
        ball(revealIdx).textContent = lotto[revealIdx];
        ball(revealIdx).classList.add("locked");  // 這顆球的 class 加入 locked
        revealIdx++;

        if (revealIdx === COUNT) {  // 全部開獎完成
            clearInterval(rollTimer);
            statusText.textContent = "開獎完成！號碼：" + lotto.join("、");
            restartBtn.disabled = false;  // 可以點擊 restartBtn
        } 
        else {  // 還沒結束 -> 設定下一次開獎的 timer
            revealTimer = setTimeout(revealNext, REVEAL_MS);
        }
    }

    clearTimeout(revealTimer);
    revealTimer = setTimeout(revealNext, REVEAL_MS);
}

restartBtn.addEventListener("click", function() {  // 點擊重新開獎按鈕
    clearInterval(rollTimer);
    clearTimeout(revealTimer);
    startLotto();
});

window.addEventListener("load", function() {  // 頁面載入後自動開始
    setTimeout(startLotto, 800);
});