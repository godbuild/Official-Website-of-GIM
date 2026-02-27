// ========== Poll Banner and Modal ==========
// (Add this to your existing script.js)

// Create poll modal dynamically
const pollModal = document.createElement('div');
pollModal.className = 'poll-view-modal';
pollModal.innerHTML = `
  <div class="poll-view-content">
    <div class="poll-view-header">
      <h3 id="pollQuestion"></h3>
      <button class="close-poll-view">&times;</button>
    </div>
    <div class="poll-options" id="pollOptions"></div>
    <div class="poll-footer">
      <button class="btn btn-primary" id="submitVote">Submit Vote</button>
    </div>
  </div>
`;
document.body.appendChild(pollModal);

// CSS for poll modal
const style = document.createElement('style');
style.textContent = `
  .poll-view-modal {
    display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 10002;
    justify-content: center; align-items: center;
  }
  .poll-view-modal.show { display: flex; }
  .poll-view-content {
    background: #0f1a2a; color: #e6eef6; max-width: 500px; width: 90%; padding: 2rem;
    border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  }
  .poll-view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .poll-view-header h3 { color: #ffaa00; margin: 0; }
  .close-poll-view { background: none; border: none; color: #9aa4b2; font-size: 2rem; cursor: pointer; }
  .close-poll-view:hover { color: #ff4444; }
  .poll-options { margin: 1.5rem 0; }
  .poll-option {
    display: flex; align-items: center; gap: 1rem; padding: 0.8rem;
    background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 0.5rem;
    cursor: pointer; transition: background 0.2s;
  }
  .poll-option:hover { background: rgba(255,170,0,0.2); }
  .poll-option input { width: 18px; height: 18px; cursor: pointer; }
  .poll-option span { flex: 1; }
  .poll-footer { text-align: right; }
  .poll-footer .btn { padding: 10px 20px; background: linear-gradient(135deg, #ff4444, #ffaa00); color: white; border: none; border-radius: 8px; cursor: pointer; }
  .poll-banner {
    position: fixed; top: 80px; right: 20px; background: linear-gradient(135deg, #ff4444, #ffaa00);
    color: white; padding: 15px 20px; border-radius: 50px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    cursor: pointer; z-index: 10001; display: flex; align-items: center; gap: 10px; font-weight: bold;
  }
`;
document.head.appendChild(style);

let currentPoll = null;
let pollBanner = null;

function showPollBanner(poll) {
  currentPoll = poll;
  if (pollBanner) pollBanner.remove();
  pollBanner = document.createElement('div');
  pollBanner.className = 'poll-banner';
  pollBanner.innerHTML = `<i class="fa-solid fa-square-poll-vertical"></i> Join Live Poll: ${poll.question}`;
  pollBanner.onclick = () => openPollModal();
  document.body.appendChild(pollBanner);
}

function openPollModal() {
  if (!currentPoll) return;
  fetch('/api/poll/active')
    .then(res => res.json())
    .then(data => {
      if (data.active) {
        document.getElementById('pollQuestion').textContent = data.question;
        const optionsDiv = document.getElementById('pollOptions');
        optionsDiv.innerHTML = '';
        data.options.forEach((opt, idx) => {
          const div = document.createElement('div');
          div.className = 'poll-option';
          const inp = document.createElement('input');
          inp.type = data.type === 'single' ? 'radio' : 'checkbox';
          inp.name = 'pollOption';
          inp.value = idx;
          div.appendChild(inp);
          const span = document.createElement('span');
          span.textContent = opt.text;
          div.appendChild(span);
          div.onclick = (e) => { if (e.target.tagName !== 'INPUT') inp.checked = !inp.checked; };
          optionsDiv.appendChild(div);
        });
        pollModal.dataset.pollId = data.id;
        pollModal.dataset.pollType = data.type;
        pollModal.classList.add('show');
      } else {
        alert('Poll has ended.');
        if (pollBanner) pollBanner.remove();
      }
    });
}

document.querySelector('.close-poll-view').addEventListener('click', () => pollModal.classList.remove('show'));

document.getElementById('submitVote').addEventListener('click', () => {
  const pollId = parseInt(pollModal.dataset.pollId);
  const selected = [];
  document.querySelectorAll('#pollOptions input:checked').forEach(cb => selected.push(parseInt(cb.value)));
  if (selected.length === 0) { alert('Please select an option.'); return; }
  fetch('/api/poll/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pollId, selectedOptions: selected })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('Vote submitted!');
        pollModal.classList.remove('show');
      } else {
        alert('Error submitting vote.');
      }
    });
});

// On page load, check for active poll
fetch('/api/poll/active')
  .then(res => res.json())
  .then(data => {
    if (data.active) {
      showPollBanner({ id: data.id, question: data.question });
    }
  });

// Modify SSE handler to listen for new_poll events
// (Assuming you have an EventSource connection already)
// Add this inside your existing onmessage:
/*
eventSource.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === 'new_poll') {
    showPollBanner(data.poll);
  } else {
    // your existing broadcast handling
  }
};
*/
