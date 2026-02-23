/* =====================================
   Block2 保存・復元
===================================== */

const columns = document.querySelectorAll(".column");

/* ---------- 保存 ---------- */
function saveBlock2() {
  const allData = [];

  columns.forEach(column => {
    const title = column.querySelector("h2").innerText;
    const rows = [];

    column.querySelectorAll(".table-row").forEach(row => {
      const textCell = row.querySelector(".text-cell");

      rows.push({
        text: textCell.innerText,
        link: textCell.dataset.link || ""
      });
    });

    allData.push({ title, rows });
  });

  localStorage.setItem("block2Data", JSON.stringify(allData));
}

/* ---------- 読込 ---------- */
function loadBlock2() {
  const saved = JSON.parse(localStorage.getItem("block2Data"));
  if (!saved) return;

  saved.forEach((colData, index) => {
    const column = columns[index];
    const body = column.querySelector(".table-body");
    const title = column.querySelector("h2");

    title.innerText = colData.title;
    body.innerHTML = "";

    colData.rows.forEach(rowData => {
      const newRow = createRow(rowData.text, rowData.link);
      body.appendChild(newRow);
    });
  });
}
/* =====================================
   行生成
===================================== */

function createRow(text = "", link = "") {

  const row = document.createElement("div");
  row.className = "table-row";
  row.draggable = true;

  /* ---- 1列目（テキスト） ---- */
  const textCell = document.createElement("div");
  textCell.className = "text-cell";
  textCell.contentEditable = true;
  textCell.innerText = text;

  if (link) {
    textCell.dataset.link = link;
    textCell.classList.add("linked");
    textCell.onclick = () => window.open(link, "_blank");
  }

  textCell.addEventListener("input", saveBlock2);

  /* ---- 2列目（リンク） ---- */
  const linkBtn = document.createElement("div");
  linkBtn.className = "link-btn";
  linkBtn.innerHTML = `<img src="link.jpeg">`;

  linkBtn.onclick = () => {
    const url = prompt("URLを入力してください");
    if (url) {
      textCell.dataset.link = url;
      textCell.classList.add("linked");
      textCell.onclick = () => window.open(url, "_blank");
      saveBlock2();
    }
  };

  /* ---- 3列目（削除） ---- */
  const delBtn = document.createElement("div");
  delBtn.className = "delete-btn";
  delBtn.innerHTML = `<img src="trash.jpeg">`;

  delBtn.onclick = () => {
    row.remove();
    saveBlock2();
  };

  /* ---- ドラッグ開始 ---- */
  row.addEventListener("dragstart", () => {
    row.classList.add("dragging");
  });

  /* ---- ドラッグ終了 ---- */
  row.addEventListener("dragend", () => {
    row.classList.remove("dragging");
    saveBlock2();
  });

  row.append(textCell, linkBtn, delBtn);
  return row;
}
/* =====================================
   ドラッグ並び替え制御
===================================== */

document.querySelectorAll(".table-body").forEach(body => {

  body.addEventListener("dragover", e => {
    e.preventDefault();

    const dragging = document.querySelector(".dragging");
    const afterElement = getDragAfterElement(body, e.clientY);

    if (!dragging) return;

    if (afterElement == null) {
      body.appendChild(dragging);
    } else {
      body.insertBefore(dragging, afterElement);
    }
  });

});

function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll(".table-row:not(.dragging)")];

  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* =====================================
   列初期化
===================================== */

columns.forEach(column => {

  const body = column.querySelector(".table-body");
  const addBtn = column.querySelector(".add-row");
  const title = column.querySelector("h2");

  title.addEventListener("input", saveBlock2);

  addBtn.onclick = () => {
    body.appendChild(createRow());
    saveBlock2();
  };

});

loadBlock2();
/* =====================================
   カレンダー機能
===================================== */

const calendar = document.getElementById("calendar");
const yearSelect = document.getElementById("yearSelect");
const monthSelect = document.getElementById("monthSelect");
const refreshBtn = document.getElementById("refreshBtn");

const today = new Date();

/* 年月選択生成 */
for (let y = today.getFullYear() - 2; y <= today.getFullYear() + 1; y++) {
  yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
}
for (let m = 1; m <= 12; m++) {
  monthSelect.innerHTML += `<option value="${m}">${m}</option>`;
}

yearSelect.value = today.getFullYear();
monthSelect.value = today.getMonth() + 1;

/* ---------- 描画 ---------- */
function generateCalendar() {

  calendar.innerHTML = "";

  const year = parseInt(yearSelect.value);
  const month = parseInt(monthSelect.value) - 1;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const stampData = JSON.parse(localStorage.getItem("stampData")) || {};

  for (let i = 0; i < first.getDay(); i++) {
    calendar.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= last.getDate(); d++) {

    const key = `${year}-${month+1}-${d}`;
    const day = document.createElement("div");
    day.className = "day";

    const dateObj = new Date(year, month, d);

    if (dateObj.getDay() === 0 || dateObj.getDay() === 6) {
      day.classList.add("weekend");
    }

    if (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      d === today.getDate()
    ) {
      day.classList.add("today");
    }

    const num = document.createElement("div");
    num.className = "day-number";
    num.innerText = d;

    const btn = document.createElement("div");
    btn.className = "stamp-btn";

    btn.onclick = () => {
      stampData[key] = !stampData[key];
      localStorage.setItem("stampData", JSON.stringify(stampData));
      generateCalendar();
    };

    day.append(num, btn);

    if (stampData[key]) {
      const img = document.createElement("img");
      img.src = "onkou_ryu.jpg";
      day.appendChild(img);
    }

    calendar.appendChild(day);
  }
}

/* ---------- 自動削除（2年以上前） ---------- */
function cleanupOldData() {

  const now = new Date();

  if (now.getMonth() === 0) {

    const stampData = JSON.parse(localStorage.getItem("stampData")) || {};
    const filtered = {};

    Object.keys(stampData).forEach(key => {
      const y = parseInt(key.split("-")[0]);

      if (y >= now.getFullYear() - 1) {
        filtered[key] = stampData[key];
      }
    });

    localStorage.setItem("stampData", JSON.stringify(filtered));
  }
}

/* ---------- イベント ---------- */

yearSelect.onchange = generateCalendar;
monthSelect.onchange = generateCalendar;
refreshBtn.onclick = generateCalendar;

cleanupOldData();
generateCalendar();


