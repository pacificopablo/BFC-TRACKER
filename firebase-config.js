<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { 
    getFirestore, collection, getDocs, doc, updateDoc, addDoc, getDoc,
    query, orderBy, onSnapshot 
  } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
  import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCN0dBQXoaWh_13lF0ON25otUpeH3OGINQ",
    authDomain: "bfc-tracker.firebaseapp.com",
    databaseURL: "https://bfc-tracker-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bfc-tracker",
    storageBucket: "bfc-tracker.firebasestorage.app",
    messagingSenderId: "127052459580",
    appId: "1:127052459580:web:c3d5caa9302238c11cdd39",
    measurementId: "G-PNYRCFJHYM"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const analytics = getAnalytics(app);
  const auth = getAuth();

  // Admin UID for Make Me Admin button
  const ADMIN_UID = "Dhx5CzjJPIYTaQ1jTgeRxZpdmf22";
  const makeAdminBtn = document.getElementById("makeAdminBtn");

  async function makeUserAdmin(uid) {
    const userRef = doc(db, "users", uid);
    try {
      await updateDoc(userRef, { isAdmin: true });
      alert(`User ${uid} is now an admin.`);
      makeAdminBtn.style.display = "none";
    } catch (error) {
      if (error.code === "not-found") {
        await setDoc(userRef, { isAdmin: true });
        alert(`User ${uid} document created and set as admin.`);
        makeAdminBtn.style.display = "none";
      } else {
        alert("Error setting admin flag: " + error.message);
      }
    }
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (user.uid === ADMIN_UID) {
        makeAdminBtn.style.display = "inline-block";
        makeAdminBtn.onclick = () => makeUserAdmin(user.uid);
      }
      // Load data only if user is authenticated
      loadMembers();
      populateMemberSelect();
      listenForRequests();
      updateChart();
    } else {
      alert("Please log in to access the dashboard.");
      // Redirect to login page or handle unauthenticated state
    }
  });

  // Populate member select dropdown
  async function populateMemberSelect() {
    const memberSelect = document.getElementById("memberSelect");
    try {
      const querySnapshot = await getDocs(collection(db, "members"));
      memberSelect.innerHTML = '<option value="">Select a member</option>';
      querySnapshot.forEach((doc) => {
        const member = doc.data();
        if (member.status === "approved") {
          const option = document.createElement("option");
          option.value = doc.id;
          option.textContent = `${member.name} (${member.email})`;
          memberSelect.appendChild(option);
        }
      });
    } catch (error) {
      console.error("Error populating member select:", error);
    }
  }

  // Load and display members
  async function loadMembers(searchQuery = "") {
    const membersList = document.getElementById("membersList");
    const totalMembers = document.getElementById("totalMembers");
    const totalShares = document.getElementById("totalShares");
    const totalBalance = document.getElementById("totalBalance");

    try {
      const querySnapshot = await getDocs(collection(db, "members"));
      let members = [];
      let totalSharesCount = 0;
      let totalBalanceCount = 0;

      membersList.innerHTML = "";
      querySnapshot.forEach((doc) => {
        const member = { id: doc.id, ...doc.data() };
        if (
          !searchQuery ||
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.status.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          members.push(member);
          if (member.status === "approved") {
            totalSharesCount += member.shares || 0;
            totalBalanceCount += member.balance || 0;
          }
        }
      });

      // Update summary cards
      totalMembers.textContent = members.length;
      totalShares.textContent = totalSharesCount;
      totalBalance.textContent = totalBalanceCount.toFixed(2);

      // Display members
      displayMembers(members);
      updateTopShareholders(members);
    } catch (error) {
      console.error("Error loading members:", error);
    }
  }

  // Display members in the grid
  function displayMembers(members) {
    const membersList = document.getElementById("membersList");
    membersList.innerHTML = "";
    members.forEach((member) => {
      const memberCard = document.createElement("div");
      memberCard.className = "bg-gray-700 p-4 rounded shadow";
      memberCard.innerHTML = `
        <p><strong>Name:</strong> ${member.name}</p>
        <p><strong>Email:</strong> ${member.email}</p>
        <p><strong>Status:</strong> ${member.status}</p>
        <p><strong>Shares:</strong> ${member.shares || 0}</p>
        <p><strong>Balance:</strong> ₱${(member.balance || 0).toFixed(2)}</p>
        <button class="editMember bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded mt-2" data-id="${member.id}">Edit</button>
      `;
      membersList.appendChild(memberCard);
    });

    // Add event listeners for edit buttons
    document.querySelectorAll(".editMember").forEach((button) => {
      button.addEventListener("click", () => openMemberModal(button.dataset.id));
    });
  }

  // Update top 5 shareholders
  function updateTopShareholders(members) {
    const topShareholders = document.getElementById("topShareholders");
    const approvedMembers = members
      .filter((m) => m.status === "approved")
      .sort((a, b) => (b.shares || 0) - (a.shares || 0))
      .slice(0, 5);

    topShareholders.innerHTML = "";
    approvedMembers.forEach((member) => {
      const li = document.createElement("li");
      li.textContent = `${member.name} - ${member.shares || 0} shares`;
      topShareholders.appendChild(li);
    });
  }

  // Listen for transaction requests
  function listenForRequests() {
    const requestsList = document.getElementById("requestsList");
    const q = query(collection(db, "transactions"), orderBy("timestamp", "desc"));
    onSnapshot(q, async (snapshot) => {
      requestsList.innerHTML = "";
      for (const doc of snapshot.docs) {
        const request = doc.data();
        const memberDoc = await getDoc(doc(db, "members", request.memberId));
        const memberName = memberDoc.exists() ? memberDoc.data().name : "Unknown";
        const requestCard = document.createElement("div");
        requestCard.className = "bg-gray-700 p-4 rounded shadow";
        requestCard.innerHTML = `
          <p><strong>Member:</strong> ${memberName}</p>
          <p><strong>Type:</strong> ${request.type}</p>
          <p><strong>Amount:</strong> ₱${request.amount.toFixed(2)}</p>
          <p><strong>Status:</strong> ${request.status}</p>
          <p><strong>Date:</strong> ${new Date(request.timestamp.toDate()).toLocaleString()}</p>
          ${request.status === "pending" ? `
            <button class="approveRequest bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded mt-2" data-id="${doc.id}">Approve</button>
            <button class="rejectRequest bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded mt-2" data-id="${doc.id}">Reject</button>
          ` : ""}
        `;
        requestsList.appendChild(requestCard);
      }

      // Add event listeners for approve/reject buttons
      document.querySelectorAll(".approveRequest").forEach((button) => {
        button.addEventListener("click", () => handleRequest(button.dataset.id, "approved"));
      });
      document.querySelectorAll(".rejectRequest").forEach((button) => {
        button.addEventListener("click", () => handleRequest(button.dataset.id, "rejected"));
      });
    });
  }

  // Handle transaction request approval/rejection
  async function handleRequest(requestId, status) {
    try {
      const requestRef = doc(db, "transactions", requestId);
      const request = (await getDoc(requestRef)).data();
      await updateDoc(requestRef, { status });

      if (status === "approved" && request.type === "deposit") {
        const memberRef = doc(db, "members", request.memberId);
        const member = (await getDoc(memberRef)).data();
        await updateDoc(memberRef, {
          balance: (member.balance || 0) + request.amount,
          shares: (member.shares || 0) + Math.floor(request.amount / 10) // ₱10 per share
        });
      }
      alert(`Request ${status} successfully.`);
      loadMembers(); // Refresh data
    } catch (error) {
      console.error("Error handling request:", error);
      alert("Error handling request: " + error.message);
    }
  }

  // Place shares form submission
  document.getElementById("placeSharesForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const memberId = document.getElementById("memberSelect").value;
    const shares = parseInt(document.getElementById("sharesInput").value);
    if (!memberId || shares <= 0) {
      alert("Please select a member and enter a valid number of shares.");
      return;
    }

    try {
      const memberRef = doc(db, "members", memberId);
      const member = (await getDoc(memberRef)).data();
      await updateDoc(memberRef, {
        shares: (member.shares || 0) + shares,
        balance: (member.balance || 0) + shares * 10 // ₱10 per share
      });
      await addDoc(collection(db, "transactions"), {
        memberId,
        type: "deposit",
        amount: shares * 10,
        status: "approved",
        timestamp: new Date()
      });
      alert("Shares placed successfully.");
      document.getElementById("placeSharesForm").reset();
      loadMembers();
    } catch (error) {
      console.error("Error placing shares:", error);
      alert("Error placing shares: " + error.message);
    }
  });

  // Distribute profit form submission
  document.getElementById("distributeProfitForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const type = document.getElementById("distributionType").value;
    const value = parseFloat(document.getElementById("distributionValue").value);

    if (value <= 0) {
      alert("Please enter a valid distribution value.");
      return;
    }

    try {
      const querySnapshot = await getDocs(collection(db, "members"));
      for (const doc of querySnapshot.docs) {
        const member = doc.data();
        if (member.status === "approved") {
          let profit = 0;
          if (type === "percent") {
            profit = (member.shares || 0) * 10 * (value / 100);
          } else {
            profit = value;
          }
          await updateDoc(doc.ref, {
            balance: (member.balance || 0) + profit
          });
          await addDoc(collection(db, "transactions"), {
            memberId: doc.id,
            type: "profit",
            amount: profit,
            status: "approved",
            timestamp: new Date()
          });
        }
      }
      alert("Profit distributed successfully.");
      document.getElementById("distributeProfitForm").reset();
      loadMembers();
    } catch (error) {
      console.error("Error distributing profit:", error);
      alert("Error distributing profit: " + error.message);
    }
  });

  // Member modal handling
  function openMemberModal(memberId) {
    const modal = document.getElementById("memberModal");
    const form = document.getElementById("memberDetailsForm");
    const memberIdInput = document.getElementById("memberId");
    const memberName = document.getElementById("memberName");
    const memberEmail = document.getElementById("memberEmail");
    const memberStatus = document.getElementById("memberStatus");
    const memberShares = document.getElementById("memberShares");
    const memberBalance = document.getElementById("memberBalance");

    getDoc(doc(db, "members", memberId)).then((doc) => {
      if (doc.exists()) {
        const member = doc.data();
        memberIdInput.value = memberId;
        memberName.value = member.name;
        memberEmail.value = member.email;
        memberStatus.value = member.status;
        memberShares.value = member.shares || 0;
        memberBalance.value = member.balance || 0;
        modal.classList.remove("hidden");
      }
    });

    document.getElementById("cancelModal").onclick = () => modal.classList.add("hidden");
  }

  document.getElementById("memberDetailsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const memberId = document.getElementById("memberId").value;
    const name = document.getElementById("memberName").value;
    const email = document.getElementById("memberEmail").value;
    const status = document.getElementById("memberStatus").value;
    const shares = parseInt(document.getElementById("memberShares").value);
    const balance = parseFloat(document.getElementById("memberBalance").value);

    if (!name || !email.includes("@") || shares < 0 || balance < 0) {
      alert("Please enter valid member details.");
      return;
    }

    try {
      await updateDoc(doc(db, "members", memberId), {
        name,
        email,
        status,
        shares,
        balance
      });
      document.getElementById("memberModal").classList.add("hidden");
      loadMembers();
    } catch (error) {
      console.error("Error updating member:", error);
      alert("Error updating member: " + error.message);
    }
  });

  // Search functionality
  document.getElementById("searchInput").addEventListener("input", (e) => {
    loadMembers(e.target.value);
  });

  // Initialize Chart.js
  let fundChart;
  async function updateChart() {
    const ctx = document.getElementById("fundChart").getContext("2d");
    const transactions = await getDocs(query(collection(db, "transactions"), orderBy("timestamp")));
    const dataPoints = [];
    let runningBalance = 0;

    transactions.forEach((doc) => {
      const transaction = doc.data();
      if (transaction.status === "approved") {
        if (transaction.type === "deposit") {
          runningBalance += transaction.amount;
        } else if (transaction.type === "cashout") {
          runningBalance -= transaction.amount;
        }
        dataPoints.push({
          x: new Date(transaction.timestamp.toDate()).toLocaleDateString(),
          y: runningBalance
        });
      }
    });

    if (fundChart) fundChart.destroy();
    fundChart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Fund Balance",
            data: dataPoints,
            borderColor: "#4CAF50",
            fill: false
          }
        ]
      },
      options: {
        scales: {
          x: { type: "category" },
          y: { beginAtZero: true, title: { display: true, text: "Balance (₱)" } }
        }
      }
    });
  }
</script>
