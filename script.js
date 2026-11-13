
// ==========================================
// SKILLSPHERE - MAIN JAVASCRIPT
// AI COACH + NOTES + QUIZ
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

    if (!data.answer || typeof data.answer !== "string") {
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
}


// ==========================================
// 2. SKILLSPHERE NOTES
// ==========================================

const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const saveNote = document.getElementById("saveNote");
const notesList = document.getElementById("notesList");
const noteStatus = document.getElementById("noteStatus");

let notes = [];

try {
  notes = JSON.parse(
    localStorage.getItem("skillsphereNotes") || "[]"
  );

  if (!Array.isArray(notes)) notes = [];

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

      if (noteStatus) {
        noteStatus.textContent = "Note deleted.";
      }
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
    options: ["CSS", "HTML", "JavaScript", "Python"],
    answer: "HTML"
  },

  {
    question: "Which language styles a webpage?",
    options: ["HTML", "CSS", "SQL", "Python"],
    answer: "CSS"
  },

  {
    question: "Which language adds interactivity to webpages?",
    options: ["JavaScript", "HTML", "CSS", "XML"],
    answer: "JavaScript"
  },

  {
    question: "Which HTML tag creates a paragraph?",
    options: ["<h1>", "<p>", "<br>", "<img>"],
    answer: "<p>"
  },

  {
    question: "Which CSS property changes text color?",
    options: ["font-size", "background", "color", "margin"],
    answer: "color"
  }

];

let mainQuizIndex = 0;
let mainQuizScore = 0;
let mainQuizAnswered = false;

const quizQuestion = document.getElementById("quizQuestion");
const quizCount = document.getElementById("quizCount");
const quizProgress = document.getElementById("quizProgress");
const quizFeedback = document.getElementById("quizFeedback");
const quizOptions = document.getElementById("quizOptions");
const nextQuestion = document.getElementById("nextQuestion");

function renderMainQuiz() {

  if (
    !quizQuestion ||
    !quizCount ||
    !quizProgress ||
    !quizFeedback ||
    !quizOptions ||
    !nextQuestion
  ) {
    console.error("Quiz HTML elements nahi mile. Check index.html IDs.");
    return;
  }

  const question = mainQuizQuestions[mainQuizIndex];

  quizQuestion.textContent = question.question;

  quizCount.textContent =
    `QUESTION ${mainQuizIndex + 1} / ${mainQuizQuestions.length}`;

  quizProgress.style.width =
    `${(mainQuizIndex / mainQuizQuestions.length) * 100}%`;

  quizFeedback.textContent =
    "Choose the best answer to continue.";

  quizOptions.innerHTML = "";

  question.options.forEach((option) => {

    const button = document.createElement("button");

    button.type = "button";
    button.className = "quiz-option";
    button.textContent = option;

    button.addEventListener("click", () => {
      checkMainAnswer(option, button);
    });

    quizOptions.appendChild(button);
  });

  mainQuizAnswered = false;

  nextQuestion.disabled = true;
  nextQuestion.textContent = "Next question →";
}

function checkMainAnswer(selected, selectedButton) {

  if (mainQuizAnswered) return;

  mainQuizAnswered = true;

  const question = mainQuizQuestions[mainQuizIndex];

  const buttons = quizOptions.querySelectorAll("button");

  buttons.forEach((button) => {

    button.disabled = true;

    if (button.textContent === question.answer) {
      button.classList.add("correct");
    }
  });

  if (selected === question.answer) {

    mainQuizScore++;

    quizFeedback.textContent =
      "Correct! Great job! 🎉";

  } else {

    selectedButton.classList.add("incorrect");

    quizFeedback.textContent =
      `Not quite! Correct answer: ${question.answer}`;
  }

  quizProgress.style.width =
    `${((mainQuizIndex + 1) / mainQuizQuestions.length) * 100}%`;

  nextQuestion.disabled = false;
}

function completeMainQuiz() {

  quizQuestion.textContent = "Quiz completed! 🎉";

  quizOptions.innerHTML = "";

  quizCount.textContent = "COMPLETED";

  quizProgress.style.width = "100%";

  quizFeedback.textContent =
    `Your score: ${mainQuizScore} / ${mainQuizQuestions.length}`;

  nextQuestion.textContent = "Play again ↻";

  nextQuestion.disabled = false;

  mainQuizAnswered = false;
}

function resetMainQuiz() {

  mainQuizIndex = 0;
  mainQuizScore = 0;
  mainQuizAnswered = false;

  renderMainQuiz();
}

if (nextQuestion) {

  nextQuestion.addEventListener("click", () => {

    // Restart quiz after completion
    if (mainQuizIndex >= mainQuizQuestions.length) {
      resetMainQuiz();
      return;
    }

    if (!mainQuizAnswered) return;

    mainQuizIndex++;

    if (mainQuizIndex >= mainQuizQuestions.length) {

      completeMainQuiz();

      return;
    }

    renderMainQuiz();

  });
}

// Start quiz only when quiz section exists
if (quizQuestion && quizOptions) {
  renderMainQuiz();
}

console.log("SkillSphere JavaScript loaded successfully!");


// MOBILE + DESKTOP REVEAL FIX

function revealSections() {
  const revealElements = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries, observerInstance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observerInstance.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05 }
  );

  revealElements.forEach((element) => {
    observer.observe(element);
  });
}

revealSections();
