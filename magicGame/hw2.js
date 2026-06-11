"use strict";

let html = "<h1>Magic Game</h1><p class = 'instruction'>心中默想一個 1 到 63 間的任一個數, 不要讓我知道...<br>但是告訴我有沒有在以下哪幾張卡片中?我可以很快找出來喔!<br><button onclick='showAnswer()'>顯示答案</button><span id = 'result-box'>?</span></p>";

html += "<div class = 'cards'>";
for (let card = 1; card <= 6; card++) {  // 0-31 (32個數字), 在右邊數來第 card 個 bit 插入 "1"
    html += "<table>";
    html += `<tr><th colspan = "8">第 ${card} 張卡片 <input type = "checkbox" class = "card-check"></th></tr>`;
    for (let row = 1; row <= 4; row++) {
        html += "<tr>";
        for (let col = 0; col < 8; col++) {
            let num = (row - 1) * 8 + col;  // card 中第 num (0-31)個數字
            let low  = num & ((1 << (card-1)) - 1);  // num 右邊 (card-1) 個 bit
            let high = num >> (card-1);  // num 右邊 (card-1) 個 bit 以外部分 (左邊部分)
            let newNum = (high << card) | (1 << (card-1)) | low;
            html += `<td data-num="${newNum}">${newNum}</td>`;
            // store newNum in data-num for future use (not covered in class -> just for fun)
        }
        html += "</tr>";
    }
    html += "</table>";
}
html += "</div>";
document.write(html);


/*
after sent -> show the answer
(not covered in class -> just for fun)
*/
function showAnswer() {
    let checks = document.querySelectorAll(".card-check");
    let result = 0;

    checks.forEach((chk, i) => {
        if (chk.checked) {
            result += (1 << i);
        }
    });

    document.getElementById("result-box").textContent = result;
    let cells = document.querySelectorAll("td[data-num]");
    cells.forEach(cell => {
        let num = Number(cell.dataset.num);
        if (num === result) {  // ans -> change color
            cell.style.backgroundColor = "red";
            cell.style.color = "white";
            cell.style.fontWeight = "bold";
        } else {  // restore
            cell.style.backgroundColor = "";
            cell.style.color = "";
        }
    });
}