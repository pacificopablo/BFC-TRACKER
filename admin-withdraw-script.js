<script>
function renderWithdrawals() {
  const requests = JSON.parse(localStorage.getItem('withdrawRequests') || '[]');
  const tbody = document.getElementById('withdrawalTableBody');
  tbody.innerHTML = '';

  if (!requests.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No withdrawal requests.</td></tr>`;
    return;
  }

  requests.forEach((req, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="border border-gray-600 p-2">${req.email}</td>
      <td class="border border-gray-600 p-2">₱${req.amount}</td>
      <td class="border border-gray-600 p-2">${req.note || ''}</td>
      <td class="border border-gray-600 p-2">${new Date(req.date).toLocaleString()}</td>
      <td class="border border-gray-600 p-2 space-x-2">
        <button onclick="approveWithdrawal(${index})" class="bg-green-600 px-2 py-1 rounded">Approve</button>
        <button onclick="rejectWithdrawal(${index})" class="bg-red-600 px-2 py-1 rounded">Reject</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function approveWithdrawal(index) {
  const requests = JSON.parse(localStorage.getItem('withdrawRequests') || '[]');
  const approved = JSON.parse(localStorage.getItem('withdrawalLog') || '[]');

  const item = requests.splice(index, 1)[0];
  approved.push(item);

  localStorage.setItem('withdrawRequests', JSON.stringify(requests));
  localStorage.setItem('withdrawalLog', JSON.stringify(approved));
  renderWithdrawals();
}

function rejectWithdrawal(index) {
  const requests = JSON.parse(localStorage.getItem('withdrawRequests') || '[]');
  requests.splice(index, 1);
  localStorage.setItem('withdrawRequests', JSON.stringify(requests));
  renderWithdrawals();
}

renderWithdrawals();
</script>
