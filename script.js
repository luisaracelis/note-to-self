const STORAGE_KEY = 'noteToSelfIdeas';

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

  if (ideas.length === 0) {
    container.innerHTML = '<div class="empty">No ideas yet. Dump the first one above.</div>';
    return;
  }

  container.innerHTML = ideas
    .slice()
    .reverse()
    .map((idea, i) => `
      <div class="idea" data-id="${idea.id}">
        <div class="idea-text">${escapeHtml(idea.text)}</div>
        <div class="idea-meta">
          <span>${formatDate(idea.created)}</span>
          <button class="delete-btn" data-id="${idea.id}">Delete</button>
        </div>
      </div>
    `).join('');

  // Attach delete handlers
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

document.getElementById('ideaForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = document.getElementById('ideaText').value.trim();
  if (!text) return;

  const ideas = loadIdeas();
  ideas.push({
    id: Date.now().toString(),
    text,
    created: Date.now()
  });
  saveIdeas(ideas);

  document.getElementById('ideaText').value = '';
  renderIdeas();
});

// Initial render
renderIdeas();
