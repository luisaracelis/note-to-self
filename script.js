const STORAGE_KEY = 'noteToSelfIdeas';
const textarea = document.getElementById('ideaText');
const dictateBtn = document.getElementById('dictateBtn');
const statusEl = document.getElementById('status');
const askGrokBtn = document.getElementById('askGrokBtn');

function loadIdeas() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveIdeas(ideas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function renderIdeas() {
  const container = document.getElementById('ideasContainer');
  const ideas = loadIdeas();

  askGrokBtn.disabled = ideas.length === 0;

  if (ideas.length === 0) {
    container.innerHTML = '<div class="empty">No ideas yet. Dump the first one above.</div>';
    return;
  }

  container.innerHTML = ideas
    .slice()
    .reverse()
    .map((idea) => `
      <div class="idea" data-id="${idea.id}">
        <div class="idea-text">${escapeHtml(idea.text)}</div>
        <div class="idea-meta">
          <span>${formatDate(idea.created)}</span>
          <button class="delete-btn" data-id="${idea.id}">Delete</button>
        </div>
      </div>
    `).join('');

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const remaining = loadIdeas().filter(idea => idea.id !== id);
      saveIdeas(remaining);
      renderIdeas();
    });
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Ask Grok button
askGrokBtn.addEventListener('click', async () => {
  const ideas = loadIdeas();
  if (ideas.length === 0) return;

  const list = ideas
    .map((idea, i) => `${i + 1}. ${idea.text}`)
    .join('\n');

  const prompt = `Here are my app ideas:\n\n${list}\n\nPlease review them and pick the 2 that are most feasible to create as simple web apps. Explain why those two, and briefly note why the others are less practical right now.`;

  try {
    await navigator.clipboard.writeText(prompt);
    const original = askGrokBtn.textContent;
    askGrokBtn.textContent = 'Copied! Paste in Grok';
    setTimeout(() => {
      askGrokBtn.textContent = original;
    }, 2000);
  } catch (err) {
    // Fallback: show the prompt in an alert or prompt
    prompt('Copy this and paste it into Grok:', prompt);
  }
});

// Speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    dictateBtn.textContent = '🛑 Stop';
    dictateBtn.classList.add('listening');
    statusEl.textContent = 'Listening… speak now';
  };

  recognition.onend = () => {
    isListening = false;
    dictateBtn.textContent = '🎙️ Dictate';
    dictateBtn.classList.remove('listening');
    statusEl.textContent = '';
  };

  recognition.onerror = (e) => {
    console.error(e);
    statusEl.textContent = e.error === 'not-allowed' ? 'Mic permission denied' : 'Could not hear you — try again';
    isListening = false;
    dictateBtn.textContent = '🎙️ Dictate';
    dictateBtn.classList.remove('listening');
  };

  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interim += transcript;
      }
    }
    if (finalTranscript) {
      const current = textarea.value.trim();
      textarea.value = current ? current + ' ' + finalTranscript.trim() : finalTranscript.trim();
    }
    if (interim) {
      statusEl.textContent = 'Listening… ' + interim;
    }
  };

  dictateBtn.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        statusEl.textContent = 'Mic already active or not available';
      }
    }
  });
} else {
  dictateBtn.disabled = true;
  dictateBtn.textContent = 'Dictate (not supported)';
  statusEl.textContent = 'Voice input works best in Chrome or Safari';
}

document.getElementById('ideaForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = textarea.value.trim();
  if (!text) return;

  const ideas = loadIdeas();
  ideas.push({
    id: Date.now().toString(),
    text,
    created: Date.now()
  });
  saveIdeas(ideas);

  textarea.value = '';
  renderIdeas();
});

// Initial render
renderIdeas();
