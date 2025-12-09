const API_BASE = "https://change-calculator-benj.azurewebsites.net/api";

// DOM Elements - validate they exist
const form = document.getElementById('form');
const amountInput = document.getElementById('amount');
const errorBox = document.getElementById('error');
const resultBox = document.getElementById('result');
const tableBody = document.querySelector('#table tbody');
const copyBtn = document.getElementById('copyBtn');
const raw = document.getElementById('raw');
const btn = document.getElementById('btn');

// Validate required DOM elements exist
if (!form || !amountInput || !errorBox || !resultBox || !tableBody || !copyBtn || !raw || !btn) {
  console.error('Required DOM elements not found. Please check the HTML structure.');
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
  resultBox.hidden = true;
}
function clearError() { errorBox.hidden = true; }

if (form) {
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

    if (!res.ok) {
      let errorMessage = 'Request failed.';
      try {
        const errorData = await res.json();
        errorMessage = errorData?.error || errorMessage;
      } catch (parseError) {
        errorMessage = `Server error: ${res.status} ${res.statusText}`;
      }
      showError(errorMessage);
      btn.disabled = false;
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      showError('Invalid response from server. Please try again.');
      btn.disabled = false;
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
    if (btn) btn.disabled = false;
  }
  });
}

if (copyBtn && raw) {
  copyBtn.addEventListener('click', async () => {
    try {
      const json = raw.textContent.replace(/^JSON:\s*/, '');
      if (!json) {
        console.warn('No JSON data to copy');
        return;
      }
      await navigator.clipboard.writeText(json);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        if (copyBtn) copyBtn.textContent = 'Copy JSON';
      }, 1200);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback: show the JSON in an alert or console
      console.log('JSON data:', raw.textContent.replace(/^JSON:\s*/, ''));
    }
  });
}
