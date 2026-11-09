
// ==========================================
// SKILLSPHERE - MAIN JAVASCRIPT
// AI COACH + NOTES + MAIN QUIZ
// ==========================================

const $ = (selector, parent = document) =>
  parent.querySelector(selector);


// ==========================================
// 1. AI STUDENT COACH
// ==========================================

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
    return "Server se connection nahi ho paya.";
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
}


// ==========================================
// 2. SKILLSPHERE NOTES
// ==========================================

const noteTitle = $("#noteTitle");
const noteContent = $("#noteContent");
const saveNote = $("#saveNote");
const notesList = $("#notesList");
const noteStatus = $("#noteStatus");

let notes = [];

try {
  notes = JSON.parse(localStorage.getItem("skillsphereNotes") || "[]");

  if (!Array.isArray(notes)) {
    notes = [];
  }
} catch (error) {
  console.error("Notes loading error:", error);
  notes = [];
}

function renderNotes() {
  if (!notesList) return;

  notesList.innerHTML = "";

  notes.forEach((note, index) => {
    const item = document.createElement("div");
    item.className = "note-card";

    const title = document.createElement("h3");
    title.textContent = note.title || "Untitled";

    const content = document.createElement("p");
    content.textContent = note.content || "";

    const remove = document.createElement("button");
    remove.textContent = "Delete";
    remove.type = "button";

    remove.addEventListener("click", () => {
      notes.splice(index, 1);

      localStorage.setItem(
        "skillsphereNotes",
        JSON.stringify(notes)
      );

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
      if (noteStatus) {
        noteStatus.textContent = "Pehle note likho.";
      }
      return;
    }

    notes.push({ title, content });

    localStorage.setItem(
      "skillsphereNotes",
      JSON.stringify(notes)
    );

    noteTitle.value = "";
    noteContent.value = "";

    if (noteStatus) {
      noteStatus.textContent = "Note saved!";
    }

    renderNotes();
  });

  renderNotes();
}


// ==========================================
// 3. MAIN SKILLSPHERE QUIZ
// ==========================================

const mainQuizQuestions = [
  {
    question: "Which language gives a webpage its structure?",
    options: ["HTML", "CSS", "JavaScript", "Python"],
    answer: "HTML"
  },
  {
    question: "Which language is used to style a webpage?",
    options: ["HTML", "CSS", "Python", "SQL"],
    answer: "CSS"
  },
  {
    question: "Which language adds interactivity to a webpage?",
    options: ["HTML", "CSS", "JavaScript", "XML"],
    answer: "JavaScript"
  },
  {
    question: "What does CSS stand for?",
    options: [
      "Creative Style System",
      "Cascading Style Sheets",
      "Computer Style Setup",
      "Colorful Style Sheets"
    ],
    answer: "Cascading Style Sheets"
  },
  {
    question: "Which HTML tag creates a hyperlink?",
    options: ["<p>", "<img>", "<a>", "<h1>"],
    answer: "<a>"
  }
];

const quizQuestion = $("#quizQuestion");
const quizOptions = $("#quizOptions");
const quizCount = $("#quizCount");
const quizProgress = $("#quizProgress");
const quizFeedback = $("#quizFeedback");
const nextQuestion = $("#nextQuestion");

let mainQuizIndex = 0;
let mainQuizScore = 0;
let mainQuizAnswered = false;

function updateQuizProgress() {
  if (quizCount) {
    quizCount.textContent =
      `QUESTION ${mainQuizIndex + 1} / ${mainQuizQuestions.length}`;
  }

  if (quizProgress) {
    quizProgress.style.width =
      `${((mainQuizIndex + 1) / mainQuizQuestions.length) * 100}%`;
  }
}

function loadMainQuiz() {
  if (!quizQuestion || !quizOptions) {
    console.error("Main Quiz HTML elements nahi mile.");
    return;
  }

  const current = mainQuizQuestions[mainQuizIndex];

  mainQuizAnswered = false;

  quizQuestion.textContent = current.question;
  quizOptions.innerHTML = "";

  // Make answer options visible
  quizOptions.style.display = "grid";
  quizOptions.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  quizOptions.style.gap = "12px";
  quizOptions.style.marginTop = "20px";

  current.options.forEach((option) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "quiz-option";
    button.textContent = option;

    button.style.display = "block";
    button.style.width = "100%";
    button.style.padding = "14px";
    button.style.border = "1px solid #59617a";
    button.style.borderRadius = "12px";
    button.style.background = "#1b2238";
    button.style.color = "#ffffff";
    button.style.cursor = "pointer";
    button.style.fontSize = "15px";

    button.addEventListener("click", () => {
      checkMainQuizAnswer(option, button);
    });

    quizOptions.appendChild(button);
  });

  if (quizFeedback) {
    quizFeedback.textContent = "Choose the best answer to continue.";
  }

  if (nextQuestion) {
    nextQuestion.disabled = true;
    nextQuestion.textContent = "Next question →";
  }

  updateQuizProgress();
}

function checkMainQuizAnswer(selected, selectedButton) {
  if (mainQuizAnswered) return;

  mainQuizAnswered = true;

  const current = mainQuizQuestions[mainQuizIndex];
  const buttons = quizOptions.querySelectorAll("button");

  buttons.forEach((button) => {
    button.disabled = true;
    button.style.cursor = "default";

    if (button.textContent === current.answer) {
      button.style.background = "#14532d";
      button.style.borderColor = "#22c55e";
    }
  });

  if (selected === current.answer) {
    mainQuizScore++;

    selectedButton.style.background = "#14532d";

    if (quizFeedback) {
      quizFeedback.textContent = "Correct answer! Great work!";
    }

  } else {
    selectedButton.style.background = "#7f1d1d";

    if (quizFeedback) {
      quizFeedback.textContent =
        `Incorrect. Correct answer: ${current.answer}`;
    }
  }

  if (nextQuestion) {
    nextQuestion.disabled = false;

    nextQuestion.textContent =
      mainQuizIndex === mainQuizQuestions.length - 1
        ? "See results →"
        : "Next question →";
  }
}

function showMainQuizResult() {
  quizQuestion.textContent = "Quiz completed!";

  quizOptions.innerHTML = "";

  quizOptions.style.display = "block";

  const result = document.createElement("h2");
  result.textContent =
    `Your score: ${mainQuizScore} / ${mainQuizQuestions.length}`;

  result.style.color = "#22d3ee";
  result.style.marginTop = "20px";

  const message = document.createElement("p");

  message.textContent =
    mainQuizScore === 5
      ? "Excellent! Perfect score!"
      : "Good effort! Keep learning and try again.";

  const restart = document.createElement("button");

  restart.type = "button";
  restart.textContent = "Play Again";
  restart.className = "button button-primary";
  restart.style.marginTop = "15px";

  restart.addEventListener("click", restartMainQuiz);

  quizOptions.append(result, message, restart);

  if (quizCount) {
    quizCount.textContent = "QUIZ COMPLETED";
  }

  if (quizProgress) {
    quizProgress.style.width = "100%";
  }

  if (quizFeedback) {
    quizFeedback.textContent = "Thanks for playing!";
  }

  if (nextQuestion) {
    nextQuestion.disabled = true;
    nextQuestion.style.display = "none";
  }
}

function goToNextQuestion() {
  if (!mainQuizAnswered) return;

  if (mainQuizIndex < mainQuizQuestions.length - 1) {
    mainQuizIndex++;
    loadMainQuiz();

  } else {
    showMainQuizResult();
  }
}

function restartMainQuiz() {
  mainQuizIndex = 0;
  mainQuizScore = 0;
  mainQuizAnswered = false;

  if (nextQuestion) {
    nextQuestion.style.display = "";
  }

  loadMainQuiz();
}

if (nextQuestion && quizQuestion && quizOptions) {
  nextQuestion.addEventListener("click", goToNextQuestion);
  loadMainQuiz();

} else {
  console.error(
    "Main Quiz elements missing. Check quizQuestion, quizOptions and nextQuestion IDs in index.html."
  );
}

console.log("SkillSphere JavaScript loaded successfully.");
