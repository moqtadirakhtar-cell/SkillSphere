
const $ = (selector, parent = document) => parent.querySelector(selector);

const chatForm = $("#chatForm");
const chatInput = $("#chatInput");
const chatMessages = $("#chatMessages");
const coachStatus = $("#coachStatus");

function addChatMessage(text, role) {
  const message = document.createElement("div");
  message.className = `chat-message ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;

  message.appendChild(bubble);
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return message;
}

async function askCoach(question) {
  coachStatus.textContent = "Connecting to AI...";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      coachStatus.textContent = "AI backend error";
      return data.error || `Server error: ${response.status}`;
    }

    if (typeof data.answer !== "string" || !data.answer.trim()) {
      coachStatus.textContent = "Empty AI response";
      return "AI se readable answer nahi mila. Dobara try karo.";
    }

    coachStatus.textContent = "AI connected";
    return data.answer.trim();
  } catch (error) {
    console.error("AI Coach error:", error);
    coachStatus.textContent = "Connection failed";
    return "Server se connection nahi ho paya. Terminal mein error check karo.";
  }
}

if (chatForm && chatInput && chatMessages && coachStatus) {
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = chatInput.value.trim();
    if (!question) return;

    addChatMessage(question, "user");

    chatInput.value = "";
    chatInput.disabled = true;

    const waiting = addChatMessage("Soch raha hoon...", "bot");
    const sendButton = $('button[type="submit"]', chatForm);

    if (sendButton) sendButton.disabled = true;

    try {
      const answer = await askCoach(question);
      waiting.querySelector(".message-bubble").textContent = answer;
    } catch (error) {
      console.error(error);
      waiting.querySelector(".message-bubble").textContent =
        "Unexpected error. Terminal check karo.";
    } finally {
      chatInput.disabled = false;
      if (sendButton) sendButton.disabled = false;
      chatInput.focus();
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });
} else {
  console.error(
    "AI Coach elements nahi mile. index.html mein chatForm, chatInput, chatMessages aur coachStatus IDs check karo."
  );
}
// SkillSphere Notes
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const saveNote = document.getElementById("saveNote");
const notesList = document.getElementById("notesList");
const noteStatus = document.getElementById("noteStatus");

let notes = JSON.parse(localStorage.getItem("skillsphereNotes") || "[]");

function renderNotes() {
  notesList.innerHTML = "";

  notes.forEach((note, index) => {
    const item = document.createElement("div");
    item.className = "note-card";

    const title = document.createElement("h3");
    title.textContent = note.title || "Untitled";

    const content = document.createElement("p");
    content.textContent = note.content;

    const remove = document.createElement("button");
    remove.textContent = "Delete";
    remove.type = "button";
    remove.addEventListener("click", () => {
      notes.splice(index, 1);
      localStorage.setItem("skillsphereNotes", JSON.stringify(notes));
      renderNotes();
    });

    item.append(title, content, remove);
    notesList.appendChild(item);
  });
}

if (saveNote && noteTitle && noteContent && notesList) {
  saveNote.addEventListener("click", () => {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();

    if (!title && !content) {
      if (noteStatus) noteStatus.textContent = "Pehle note likho.";
      return;
    }

    notes.push({ title, content });
    localStorage.setItem("skillsphereNotes", JSON.stringify(notes));

    noteTitle.value = "";
    noteContent.value = "";
    if (noteStatus) noteStatus.textContent = "Note saved!";
    renderNotes();
  });

  renderNotes();
}