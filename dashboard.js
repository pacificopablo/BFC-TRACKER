<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Baccarat Fund Admin Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
</head>
<body class="bg-gray-900 text-white p-4">
  <button id="logoutBtn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded mb-4 float-right">Logout</button>
  <h1 class="text-3xl font-bold mb-6">👑 Baccarat Fund Admin Dashboard</h1>

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <div class="bg-gray-800 p-4 rounded shadow">
      <p class="text-sm">Total Members</p>
      <p class="text-2xl font-bold" id="totalMembers">0</p>
    </div>
    <div class="bg-gray-800 p-4 rounded shadow">
      <p class="text-sm">Total Shares</p>
      <p class="text-2xl font-bold" id="totalShares">0</p>
    </div>
    <div class="bg-gray-800 p-4 rounded shadow">
      <p class="text-sm">Total Balance</p>
      <p class="text-2xl font-bold">₱<span id="totalBalance">0.00</span></p>
    </div>
  </div>

  <!-- Financial Chart -->
  <div class="bg-gray-800 p-4 rounded shadow mb-6">
    <h2 class="text-xl font-bold mb-2">📊 Fund Growth</h2>
    <canvas id="fundChart" height="100"></canvas>
  </div>

  <!-- Member Search -->
  <input type="text" id="searchInput" placeholder="Search by name, email, or status..." class="mb-4 p-2 w-full rounded bg-gray-700 text-white" />

  <!-- Member List -->
  <div id="membersList" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4"></div>

  <!-- Top 5 Shareholders -->
  <div class="bg-gray-800 p-4 mt-8 rounded shadow">
    <h2 class="text-xl font-bold mb-2">🏆 Top 5 Shareholders</h2>
    <ul id="topShareholders" class="list-disc list-inside text-sm"></ul>
  </div>

  <!-- Transaction Requests -->
  <h2 class="text-2xl font-bold mt-10 mb-4">💰 Deposit & Cash Out Requests</h2>
  <div id="requestsList" class="space-y-4 max-h-96 overflow-auto bg-gray-800 p-4 rounded"></div>

  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
    import {
      getAuth, onAuthStateChanged, signOut
    } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
    import {
      getFirestore, collection, getDocs, doc, updateDoc,
      query, orderBy, onSnapshot
    } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "AIzaSyCN0dBQXoaWh_13lF0ON25otUpeH3OGINQ",
      authDomain: "bfc-tracker.firebaseapp.com",
      projectId: "bfc-tracker",
      storageBucket: "bfc-tracker.appspot.com",
      messagingSenderId: "127052459580",
      appId: "1:127052459580:web:c3d5caa9302238c11cdd39"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const adminEmails = [
      "youradmin@email.com",  // 🔁 Replace this with your email
      "secondadmin@email.com"
    ];

    onAuthStateChanged(auth, (user) => {
      if (!user || !adminEmails.includes(user.email)) {
        alert("Access denied. Admins only.");
        window.location.href = "login.html";
      }
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
      signOut(auth).then(() => {
        localStorage.removeItem("isAdmin");
        window.location.href = "login.html";
      });
    });

    const totalMembers = document.getElementById("totalMembers");
    const totalShares = document.getElementById("totalShares");
    const totalBalance = document.getElementById("totalBalance");
    const membersList = document.getElementById("membersList");
    const topShareholders = document.getElementById("topShareholders");
    const searchInput = document.getElementById("searchInput");
    const requestsList = document.getElementById("requestsList");

    let allMembers = [];

    function formatCurrency(value) {
      return parseFloat(value).toLocaleString("en-PH", { minimumFractionDigits: 2 });
    }

    async function loadMembers() {
      const snapshot = await getDocs(collection(db, "users"));
      allMembers = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        allMembers.push({ id: docSnap.id, ...data });
      });
      displayMembers(allMembers);
      updateTopShareholders();
    }

    function displayMembers(members) {
      let memberCount = 0, shareTotal = 0, balanceTotal = 0;
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
          <p><strong>Shares:</strong> ${m.shares}</p>
          <p><strong>Balance:</strong> ₱${formatCurrency(m.balance)}</p>
        `;
        membersList.appendChild(div);
      });

      totalMembers.textContent = memberCount;
      totalShares.textContent = shareTotal;
      totalBalance.textContent = formatCurrency(balanceTotal);
    }

    function updateTopShareholders() {
      const top = [...allMembers]
        .filter(m => m.status === 'approved')
        .sort((a, b) => b.shares - a.shares)
        .slice(0, 5);

      topShareholders.innerHTML = "";
      top.forEach(m => {
        const li = document.createElement("li");
        li.textContent = `${m.name} — ${m.shares} shares`;
        topShareholders.appendChild(li);
      });
    }

    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const filtered = allMembers.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.status.toLowerCase().includes(query)
      );
      displayMembers(filtered);
    });

    function listenForRequests() {
      const q = query(collection(db, "transactions"), orderBy("timestamp", "desc"));
      onSnapshot(q, (snapshot) => {
        requestsList.innerHTML = "";
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.status === "pending") {
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
        if (requestsList.innerHTML === "") {
          requestsList.innerHTML = '<p class="text-gray-400">No pending requests.</p>';
        }
      });
    }

    loadMembers();
    listenForRequests();

    // Static chart for demo
    const ctx = document.getElementById('fundChart').getContext('2d');
    new Chart(ctx, {
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
        plugins: {
          legend: { labels: { color: 'white' } }
        },
        scales: {
          x: { ticks: { color: 'white' } },
          y: { ticks: { color: 'white' }, beginAtZero: true }
        }
      }
    });
  </script>
</body>
</html>
