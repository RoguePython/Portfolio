const API_BASE = "https://change-calculator-benj.azurewebsites.net/api";

const form = document.getElementById('form');
const amountInput = document.getElementById('amount');
const errorBox = document.getElementById('error');
const resultBox = document.getElementById('result');
const tableBody = document.querySelector('#table tbody');
const copyBtn = document.getElementById('copyBtn');
const raw = document.getElementById('raw');
const btn = document.getElementById('btn');

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
  resultBox.hidden = true;
}
function clearError() { errorBox.hidden = true; }

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  btn.disabled = true;

  const amount = Number(amountInput.value);
  if (Number.isNaN(amount) || amount < 0) {
    showError('Please enter a valid non-negative amount.');
    btn.disabled = false;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/change/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data?.error || 'Request failed.');
      return;
    }

    tableBody.innerHTML = '';
    Object.entries(data).forEach(([denom, count]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${denom}</td><td>${count}</td>`;
      tableBody.appendChild(tr);
    });

    raw.textContent = 'JSON: ' + JSON.stringify(data);
    resultBox.hidden = false;
  } catch (err) {
    showError('Network error. Check your connection and API URL.');
  } finally {
    btn.disabled = false;
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    const json = raw.textContent.replace(/^JSON:\s*/, '');
    await navigator.clipboard.writeText(json);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy JSON', 1200);
  } catch {}
});
