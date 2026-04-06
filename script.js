/* Prompt Builder (vanilla JS)
   - No inline JS in HTML
   - Clean functions per requirements
*/

const MIN_CONTEXT_LEN = 20;

const els = {
  role: document.getElementById("role"),
  taskType: document.getElementById("taskType"),
  context: document.getElementById("context"),
  constraints: document.getElementById("constraints"),
  outputFormat: document.getElementById("outputFormat"),

  generateBtn: document.getElementById("generateBtn"),
  charCount: document.getElementById("charCount"),

  generatedPrompt: document.getElementById("generatedPrompt"),
  copyBtn: document.getElementById("copyBtn"),
  clearPromptBtn: document.getElementById("clearPromptBtn"),
  copyToast: document.getElementById("copyToast"),

  aiAnswer: document.getElementById("aiAnswer"),

  qaItems: Array.from(document.querySelectorAll(".qa-item")),
  scoreText: document.getElementById("scoreText"),
  scoreBadge: document.getElementById("scoreBadge"),
  scoreProgress: document.getElementById("scoreProgress"),

  suggestBtn: document.getElementById("suggestBtn"),
  suggestions: document.getElementById("suggestions"),
};

function getContextTrimmed() {
  return (els.context.value || "").trim();
}

function isContextValid() {
  return getContextTrimmed().length >= MIN_CONTEXT_LEN;
}

function updateCharCount() {
  const count = getContextTrimmed().length;
  if (els.charCount) els.charCount.textContent = `${count} / ${MIN_CONTEXT_LEN}`;

  // Color feedback (Bootstrap utility classes)
  if (els.charCount) {
    els.charCount.classList.remove("text-danger", "text-success", "text-secondary");
    if (count === 0) els.charCount.classList.add("text-secondary");
    else if (count < MIN_CONTEXT_LEN) els.charCount.classList.add("text-danger");
    else els.charCount.classList.add("text-success");
  }
}

function updateGenerateButtonState() {
  const ctx = getContextTrimmed();
  const shouldEnable = ctx.length >= MIN_CONTEXT_LEN;
  els.generateBtn.disabled = !shouldEnable;

  updateCharCount();
}

// =========================
// Required functions
// =========================

function generatePrompt() {
  const context = getContextTrimmed();
  if (context.length === 0) return "";
  if (!isContextValid()) return "";

  const role = els.role.value;
  const taskType = els.taskType.value;
  const constraints = (els.constraints.value || "").trim();
  const outputFormat = els.outputFormat.value;

  // Structured prompt (consistent, predictable)
  const lines = [
    `Role: ${role}`,
    `Task: ${taskType}`,
    `Context:`,
    context,
    ``,
    `Constraints:`,
    constraints.length ? constraints : "(none)",
    ``,
    `Output format: ${outputFormat}`,
  ];

  return lines.join("\n");
}

function calculateScore() {
  const total = els.qaItems.length;
  const passed = els.qaItems.filter((c) => c.checked).length;
  const pct = total === 0 ? 0 : Math.round((passed / total) * 100);

  els.scoreText.textContent = `${passed}/${total} passed`;
  els.scoreBadge.textContent = `${pct}%`;

  els.scoreBadge.classList.remove("text-bg-success", "text-bg-warning", "text-bg-danger");
  if (pct >= 75) els.scoreBadge.classList.add("text-bg-success");
  else if (pct >= 50) els.scoreBadge.classList.add("text-bg-warning");
  else els.scoreBadge.classList.add("text-bg-danger");

  return { passed, total, pct };
}

function suggestImprovements() {
  const suggestions = [];
  const unchecked = els.qaItems.filter((c) => !c.checked).map((c) => c.id);

  const add = (text) => {
    if (suggestions.length >= 4) return;
    if (!suggestions.includes(text)) suggestions.push(text);
  };

  // Simple rules based on missing QA signals
  if (unchecked.includes("qaMatches")) {
    add("Коротко перефразуй задачу й переконайся, що відповідь напряму її покриває (без зайвих відхилень).");
  }
  if (unchecked.includes("qaStructure")) {
    add("Додай чітку структуру: заголовки + маркований список (або короткий план), щоб відповідь легко читалась.");
  }
  if (unchecked.includes("qaNoHallucinations")) {
    add("Явно познач невизначеність і запропонуй спосіб перевірки фактів (джерела, припущення або чек-пункти).");
  }
  if (unchecked.includes("qaSpecifics")) {
    add("Додай конкретику: чіткі кроки, приклади та точні формулювання/фрагменти коду там, де це доречно.");
  }
  if (unchecked.includes("qaFormatFollowed")) {
    add("Переформатуй результат під запитаний формат (наприклад: bullet list / table / JSON).");
  }
  if (unchecked.includes("qaConstraints")) {
    add("Перевір обмеження ще раз і додай короткий блок відповідності (що виконано, що потребує уточнення).");
  }
  if (unchecked.includes("qaRisks")) {
    add("Додай ризики/edge cases і способи їх мінімізації (залежності, фейл-моди, обмеження).");
  }
  if (unchecked.includes("qaNextSteps")) {
    add("Додай наступні кроки: що робити далі, що протестувати/перевірити, і які дані потрібні, якщо є блокери.");
  }

  // If everything is checked, still be helpful.
  if (unchecked.length === 0) {
    add("Додай короткий блок «Припущення» та явний чекліст перевірки/тестування.");
    add("Підчисти формулювання: прибери зайве, залиш ключові кроки й приклади та зроби результат готовим до копіювання.");
  }

  renderSuggestions(suggestions.slice(0, 4));
  return suggestions.slice(0, 4);
}

async function copyToClipboard(text) {
  const value = (text ?? "").toString();
  if (!value.trim()) return false;

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Fallback for older/stricter environments
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

// =========================
// UI helpers (not required, but keeps code clean)
// =========================

function renderSuggestions(items) {
  els.suggestions.innerHTML = "";

  if (!items.length) {
    const li = document.createElement("li");
    li.className = "list-group-item text-secondary";
    li.textContent = "Поки що немає пропозицій. Позначте кілька пунктів і натисніть “Suggest improvements”.";
    els.suggestions.appendChild(li);
    return;
  }

  for (const s of items) {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = s;
    els.suggestions.appendChild(li);
  }
}

function showCopyToast() {
  els.copyToast.classList.remove("d-none");
  window.clearTimeout(showCopyToast._t);
  showCopyToast._t = window.setTimeout(() => els.copyToast.classList.add("d-none"), 1200);
}

function clearPrompt() {
  els.generatedPrompt.value = "";
}

function wireEvents() {
  // Form validation / button enablement
  els.context.addEventListener("input", updateGenerateButtonState);
  updateGenerateButtonState();

  // Generate prompt
  els.generateBtn.addEventListener("click", () => {
    const prompt = generatePrompt();
    if (!prompt) return;
    els.generatedPrompt.value = prompt;
  });

  // Copy / Clear prompt
  els.copyBtn.addEventListener("click", async () => {
    const ok = await copyToClipboard(els.generatedPrompt.value);
    if (ok) showCopyToast();
  });

  els.clearPromptBtn.addEventListener("click", () => {
    clearPrompt();
  });

  // Score updates
  for (const item of els.qaItems) {
    item.addEventListener("change", calculateScore);
  }
  calculateScore();

  // Suggestions
  els.suggestBtn.addEventListener("click", () => {
    suggestImprovements();
  });

  renderSuggestions([]);
}

wireEvents();

