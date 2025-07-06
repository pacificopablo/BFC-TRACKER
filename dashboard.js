// dashboard.js
import { auth, db } from './firebase-config.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import Chart from "https://cdn.jsdelivr.net/npm/chart.js";

const provider = new GoogleAuthProvider();

const loginModal = document.getElementById('loginModal');
const dashboard = document.getElementById('dashboard');
const googleSignInBtn = document.getElementById('googleSignInBtn');

let allMembers = [];
let fundChartInstance;

googleSignInBtn.addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert("Google Sign-In failed: " + error.message);
  }
});

onAuthStateChanged(auth, user => {
  if (user) {
    user.getIdTokenResult().then(({ claims }) => {
      if (claims.admin) {
        loginModal.classList.add('hidden');
        dashboard.classList.remove('hidden');
        initDashboard();
      } else {
        alert('Access denied. You are not an admin.');
        auth.signOut();
      }
    });
  } else {
    loginModal.classList.remove('hidden');
    dashboard.classList.add('hidden');
  }
});

function formatCurrency(value) {
  return parseFloat(value).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

async function initDashboard() {
  const now = Date.now();
  const cutoff = now - 7 * 24 * 60 * 60 * 1000;

  // Clean up old pending users
  const usersSnap = await getDocs(collection(db, 'users'));
  usersSnap.forEach(async s => {
    const d = s.data();
    if (d.status === 'pending' && d.createdAt?.toMillis() < cutoff) {
      await deleteDoc(doc(db, 'users', s.id));
    }
  });

  // Clean up old pending transactions
  const txSnap = await getDocs(collection(db, 'transactions'));
  txSnap.forEach(async s => {
    const d = s.data();
    if (d.status === 'pending' && d.timestamp?.toMillis() < cutoff) {
      await deleteDoc(doc(db, 'transactions', s.id));
    }
  });

  loadMembers();
  listenForRequests();
  initializeFundChart();
  setupSearchFilter();
}

async function loadMembers() {
  const q = query(collection(db, "users"));
  onSnapshot(q, (snapshot) => {
    allMembers = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      allMembers.push({ id: docSnap.id, ...data });
    });
    displayMembers(allMembers);
    updateTopShareholders();
  });
}

function displayMembers(members) {
  let memberCount = 0, shareTotal = 0, balanceTotal = 0;
  const membersList = document.getElementById("membersList");
  membersList.innerHTML = "";

  members.forEach(m => {
    memberCount++;
    shareTotal += m.shares || 0;
    balanceTotal += m.balance || 0;

    const div = document.createElement("div");
    div.className = "bg-gray-800 p-4 rounded shadow";
    div.innerHTML = `
      <p><strong>Name:</strong> ${m.name}</p>
      <p><strong>Email:</strong> ${m.email}</p>
      <p><strong>Status:</strong> <span class="px-2 py-1 rounded ${m.status === 'approved' ? 'bg-green-600' : m.status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'}">${m.status}</span></p>
      <p><strong>Shares:</strong> ${m.shares || 0}</p>
      <p><strong>Balance:</strong> ₱${formatCurrency(m.balance || 0)}</p>
    `;
    membersList.appendChild(div);
  });

  document.getElementById("totalMembers").textContent = memberCount;
  document.getElementById("totalShares").textContent = shareTotal;
  document.getElementById("totalBalance").textContent = formatCurrency(balanceTotal);
}

function updateTopShareholders() {
  const topShareholders = document.getElementById("topShareholders");
  const top = [...allMembers]
    .filter(m => m.status === 'approved')
    .sort((a, b) => (b.shares || 0) - (a.shares || 0))
    .slice(0, 5);

  topShareholders.innerHTML = "";
  top.forEach(m => {
    const li = document.createElement("li");
    li.textContent = `${m.name} — ${m.shares || 0} shares`;
    topShareholders.appendChild(li);
  });
}

function listenForRequests() {
  const requestsList = document.getElementById("requestsList");
  const q = query(collection(db, "transactions"), orderBy("timestamp", "desc"));
  onSnapshot(q, snapshot => {
    requestsList.innerHTML = "";
    let hasPending = false;
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.status === "pending") {
        hasPending = true;
        const div = document.createElement("div");
        div.className = "bg-gray-700 p-4 rounded";
        div.innerHTML = `
          <p><strong>Member:</strong> ${data.memberName}</p>
          <p><strong>Type:</strong> ${data.type}</p>
          <p><strong>Amount:</strong> ₱${formatCurrency(data.amount)}</p>
          <p><strong>Date:</strong> ${data.timestamp?.toDate().toLocaleString() || "N/A"}</p>
        `;
        requestsList.appendChild(div);
      }
    });
    if (!hasPending) {
      requestsList.innerHTML = '<p class="text-gray-400">No pending requests.</p>';
    }
  });
}

function initializeFundChart() {
  const ctx = document.getElementById('fundChart').getContext('2d');
  if (fundChartInstance) {
    fundChartInstance.destroy();
  }
  fundChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Fund Balance',
        data: [15000, 18000, 21000, 25000, 29000, 34000],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: 'white' } } },
      scales: {
        x: { ticks: { color: 'white' } },
        y: { ticks: { color: 'white' }, beginAtZero: true }
      }
    }
  });
}

function setupSearchFilter() {
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    const filtered = allMembers.filter(m => 
      (m.name && m.name.toLowerCase().includes(term)) ||
      (m.email && m.email.toLowerCase().includes(term)) ||
      (m.status && m.status.toLowerCase().includes(term))
    );
    displayMembers(filtered);
    updateTopShareholders();
  });
}

function downloadCSV(filename, rows) {
  if (!rows.length) {
    alert("No data to export!");
    return;
  }
  const header = Object.keys(rows[0]).join(",") + "\n";
  const body = rows.map(r =>
    Object.values(r)
      .map(v => `"${v}"`)
      .join(",")
  ).join("\n");
  const blob = new Blob([header + body], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

document.getElementById('exportMembers').addEventListener('click', () => {
  const data = allMembers.map(m => ({
    id: m.id,
    name: m.name,
    email: m.email,
    status: m.status,
    shares: m.shares,
    balance: m.balance
  }));
  downloadCSV('members.csv', data);
});

document.getElementById('exportTransactions').addEventListener('click', async () => {
  const snaps = await getDocs(collection(db, 'transactions'));
  const rows = [];
  snaps.forEach(s => rows.push({ id: s.id, ...s.data() }));
  downloadCSV('transactions.csv', rows);
});
