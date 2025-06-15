let currentChatUser = "";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB4-Da_F-lKW2z5EJF-ZJBf3fCgdyIMfzo",
  authDomain: "aptitude-checklist.firebaseapp.com",
  projectId: "aptitude-checklist",
  storageBucket: "aptitude-checklist.firebasestorage.app",
  messagingSenderId: "603581773263",
  appId: "1:603581773263:web:d6d04f01b9ea7917dd4eba"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Topics
const topics = [
  "1. Number System", "2. H.C.F. and L.C.M.", "3. Decimal Fractions", "4. Simplification",
  "5. Square Roots and Cube Roots", "6. Average", "7. Problems on Numbers", "8. Problems on Ages",
  "9. Surds and Indices", "10. Logarithms", "11. Percentage", "12. Profit and Loss",
  "13. Ratio and Proportion", "14. Partnership", "15. Chain Rule", "16. Pipes and Cisterns",
  "17. Time and Work", "18. Time and Distance", "19. Boats and Streams", "20. Problems on Trains",
  "21. Alligation or Mixture", "22. Simple Interest", "23. Compound Interest", "24. Area",
  "25. Volume and Surface Area", "26. Races and Games of Skill", "27. Calendar", "28. Clocks",
  "29. Stocks and Shares", "30. Permutations and Combinations", "31. Probability",
  "32. True Discount", "33. Banker’s Discount", "34. Heights and Distances",
  "35. Odd Man Out and Series", "36. Tabulation", "37. Bar Graphs", "38. Pie Chart", "39. Line Graphs"
];
const topicPages = [
  3,51,69,95,180,206,240,264,278,297,308,374,426,476,493,510,526,562,600,612,
  633,641,663,688,766,814,819,823,834,841,850,861,866,870,877,887,905,923,937
];

let username = "", completion = 0, xoState = [];

// Login & start
function startApp() {
  const input = document.getElementById("username");
  const rawName = input.value.trim();
username = rawName.toLowerCase(); // for internal use
localStorage.setItem("shweyupaw-user", username); // normalized for login
localStorage.setItem("displayName", rawName);     // optional: for showing nicely

  if (!username) return alert("Enter your name");

  document.getElementById("login").classList.add("hidden");
 document.getElementById("sidebar-title").innerText = `${rawName}'s Todo`;

  localStorage.setItem("shweyupaw-user", username);

  showSection('checklist');
  loadChecklist();
  loadProgress();
  loadNotes();
  initXOBoard();
  populateChatUsers(); // 👈 Add this
  updateLeaderboard();
}


// Navigation
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  if (id === "progress") loadProgress();
  if (id === "notes") loadNotes();
  if (id === "leaderboard") updateLeaderboard();
}

// Checklist rendering
function loadChecklist() {
  const container = document.getElementById("checklist-container");
  container.innerHTML = "";

  topics.forEach((title, i) => {
    const checked = JSON.parse(localStorage.getItem(`topic-${i}`));
    const div = document.createElement("div");
    div.className = "topic-card" + (checked ? " checked" : "");
    div.innerHTML = `
      <h3>${title}</h3>
      <div class="bottom">
        <button onclick="window.open('rsagarwal.pdf#page=${topicPages[i] + 9}', '_blank')">Open Book</button>
        <input type="checkbox" ${checked ? "checked" : ""} onchange="toggleCheck(${i}, this)"/>
      </div>`;
    container.appendChild(div);
  });

  updateProgressBar();
  updateLeaderboard();
}

function toggleCheck(i, el) {
  localStorage.setItem(`topic-${i}`, el.checked);
  loadChecklist();
  loadProgress();
}

// Progress bar
function loadProgress() {
  const done = topics.filter((_, i) => JSON.parse(localStorage.getItem(`topic-${i}`))).length;
  const percent = Math.round((done / topics.length) * 100);
  const remaining = topics.length - done;
  completion = percent;

  // Badge logic
  let badge = "🥉 Beginner";
  if (done >= 26) badge = "🥇 Master";
  else if (done >= 11) badge = "🥈 Intermediate";

  // Update progress bar
  document.getElementById("progress-info").innerHTML = `
    <div class="progress-bar-container">
      <div class="progress-bar-fill" style="width: ${percent}%">${percent}%</div>
    </div>`;

  // Update summary box
  document.getElementById("progress-summary").innerHTML = `
    <p><strong>Topics Completed:</strong> ${done}</p>
    <p><strong>Topics Remaining:</strong> ${remaining}</p>
    <p><strong>Current Badge:</strong> ${badge}</p>
  `;

 const today = new Date().toDateString();
const lastCompleted = localStorage.getItem("lastCompletedDate");
let streak = parseInt(localStorage.getItem("dailyStreak") || "0");

if (done > 0) {
  if (lastCompleted !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = new Date(lastCompleted).toDateString() === yesterday.toDateString();
    streak = wasYesterday ? streak + 1 : 1;

    localStorage.setItem("dailyStreak", streak);
    localStorage.setItem("lastCompletedDate", today);
  }
}

document.getElementById("daily-streak").innerHTML = `
  <p><strong>Daily Streak:</strong> ${streak} day(s) 🏆</p>
`;

// Save streak to Firebase
if (username) {
  db.collection("leaderboard").doc(username).set({
    name: username,
    progress: completion,
    streak: streak,
    updated: Date.now()
  }, { merge: true });
}
  document.getElementById("daily-streak").innerHTML = `
    <p><strong>📅 Daily Streak:</strong> ${streak} day(s)</p>
  `;

  updateProgressBar();
  updateLeaderboard();
}

function loadOtherStreaks() {
  db.collection("leaderboard").get().then(snap => {
    const others = [];
    snap.forEach(doc => {
      const data = doc.data();
      if (data.name !== username && data.streak > 0) {
        others.push(data);
      }
    });
    if (others.length > 0) {
      document.getElementById("other-streaks").innerHTML = `
        <p><strong>🏆 Others on streak:</strong></p>
        <ul>
          ${others.map(u => `<li>${u.name} –  ${u.streak} day(s)🏆</li>`).join("")}
        </ul>
      `;
    } else {
      document.getElementById("other-streaks").innerHTML = `<p>No other users on a streak yet 🔄</p>`;
    }
  });
}






function updateProgressBar() {
  const done = topics.filter((_, i) => JSON.parse(localStorage.getItem(`topic-${i}`))).length;
  const percent = Math.round((done / topics.length) * 100);
  const bar = `
    <div class="progress-bar-container">
      <div class="progress-bar-fill" style="width: ${percent}%">${percent}%</div>
    </div>`;
  document.getElementById("home-progress-bar").innerHTML = bar;
}
// Badge + welcome message
const done = topics.filter((_, i) => JSON.parse(localStorage.getItem(`topic-${i}`))).length;
let badge = "🥉 Beginner";
if (done >= 26) badge = "🥇 Master";
else if (done >= 11) badge = "🥈 Intermediate";

const welcomeText = `Welcome, ${username} - ${badge}`;
document.getElementById("welcome-message").textContent = welcomeText;

// Notes
function loadNotes() {
  const txt = localStorage.getItem("shweyupaw-notes") || "";
  const area = document.getElementById("notes-area");
  area.value = txt;
  area.oninput = e => localStorage.setItem("shweyupaw-notes", e.target.value);
}

// Calculator
let calcExpression = "";
function press(val) {
  if (calcExpression === "0") calcExpression = "";
  calcExpression += val;
  document.getElementById("calc-display").textContent = calcExpression;
}
function calculate() {
  try {
    const result = eval(calcExpression);
    calcExpression = result.toString();
    document.getElementById("calc-display").textContent = result;
  } catch {
    document.getElementById("calc-display").textContent = "Error";
    calcExpression = "";
  }
}
function clearCalc() {
  calcExpression = "";
  document.getElementById("calc-display").textContent = "0";
}

// Chat
function getChatRoomId(userA, userB) {
  return [userA, userB].sort().join("_");
}
async function populateChatUsers() {
  const snap = await db.collection("leaderboard").get();
  const select = document.getElementById("chat-users");
  if (!select) return;

  let html = `<option value="">-- Select --</option>`;
  snap.forEach(doc => {
    const user = doc.id;
    if (user !== username) {
      html += `<option value="${user}">${user}</option>`;
    }
  });
  select.innerHTML = html;
}

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  await db.collection("chat").add({
    user: username,
    message: text,
    time: Date.now()
  });

  input.value = "";
}

function listenForChat() {
  const chatBox = document.getElementById("chat-box");
  db.collection("chat").orderBy("time").onSnapshot(snapshot => {
    chatBox.innerHTML = "";
    snapshot.forEach(doc => {
      const msg = doc.data();
      const time = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    chatBox.innerHTML += `<p><strong>${msg.user}</strong> [${time}]: ${msg.message}</p>`;
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}
// Leaderboard
async function updateLeaderboard() {
  if (!username) return;

  // update current user's record
  await db.collection("leaderboard").doc(username).set({
    name: username,
    progress: completion,
    streak: parseInt(localStorage.getItem("dailyStreak") || "0"),
    updated: Date.now()
  }, { merge: true });

  // get and sort leaderboard
  const snap = await db.collection("leaderboard").get();
  let data = [];
  snap.forEach(doc => data.push(doc.data()));

  data.sort((a, b) => b.progress - a.progress);

  // render
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = data.map((u, i) => `
    <div class="leaderboard-row">
      <span>${i + 1}</span>
      <span>${u.name}</span>
      <span>${u.progress || 0}%</span>
      <span>${u.streak || 0} 🔥</span>
    </div>
  `).join("");
}

// Update badge in sidebar
const badgeEl = document.getElementById("user-badge");
if (badgeEl) badgeEl.textContent = `${username} - ${badgeIcon}`;

// XO Game
function initXOBoard() {
  const board = document.getElementById("xo-board");
  if (!board) return;
  board.innerHTML = "";
  xoState = Array(9).fill(null);
  document.getElementById("xo-status").textContent = "Your turn (X)";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.dataset.index = i;
    cell.onclick = () => makeXOMove(i);
    board.appendChild(cell);
  }
}
function makeXOMove(index) {
  if (xoState[index]) return;
  xoState[index] = "X";
  renderXO();
  if (checkWinner("X")) return xoStatus.textContent = "You win!";
  if (xoState.every(cell => cell)) return xoStatus.textContent = "Draw!";
  setTimeout(makeComputerMove, 500);
}
function makeComputerMove() {
  const empty = xoState.map((v, i) => v ? null : i).filter(v => v !== null);
  const move = empty[Math.floor(Math.random() * empty.length)];
  xoState[move] = "O";
  renderXO();
  if (checkWinner("O")) xoStatus.textContent = "Computer wins!";
}
function renderXO() {
  const cells = document.querySelectorAll("#xo-board div");
  cells.forEach((cell, i) => cell.textContent = xoState[i] || "");
}
function checkWinner(p) {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return wins.some(w => w.every(i => xoState[i] === p));
}
function resetXO() {
  initXOBoard();
}

// Logout
function logout() {
  localStorage.removeItem("shweyupaw-user");
  location.reload();
}

// Auto login
window.onload = () => {
  const saved = localStorage.getItem("shweyupaw-user");
  if (saved) {
    username = saved;
    const displayName = localStorage.getItem("displayName") || username; // 👈 ADD THIS
    document.getElementById("login").classList.add("hidden");
    document.getElementById("sidebar-title").innerText = `${displayName}'s Todo`; // 👈 USE THIS

    showSection("checklist");
    loadChecklist();
    loadProgress();
    loadOtherStreaks();
    loadNotes();
    initXOBoard();
    listenForChat();
    updateLeaderboard();
    populateChatUsers();
  }
};


// Global access
window.startApp = startApp;
window.showSection = showSection;
window.toggleCheck = toggleCheck;
window.populateChatUsers=populateChatUsers;
window.listenForChat=listenForChat; 
window.loadOtherStreaks=loadOtherStreaks;
window.resetXO = resetXO;
window.logout = logout;
window.press = press;
window.calculate = calculate;
window.clearCalc = clearCalc;
