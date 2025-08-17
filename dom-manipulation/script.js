// ====== INITIAL QUOTES ======
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { id: 1, text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { id: 2, text: "Don't let yesterday take up too much of today.", category: "Inspiration" },
  { id: 3, text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "Wisdom" },
  { id: 4, text: "Believe you can and you're halfway there.", category: "Motivation" }
];

// ====== DOM ELEMENTS ======
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const conflictNotice = document.createElement("div");
conflictNotice.style.color = "red";
conflictNotice.style.margin = "10px 0";
document.body.insertBefore(conflictNotice, quoteDisplay);

// ====== LOCAL STORAGE FUNCTIONS ======
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ====== CATEGORY FUNCTIONS ======
function populateCategories() {
  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
}

function filterQuote(category) {
  if (category === "all") return quotes;
  return quotes.filter(q => q.category === category);
}

// ====== QUOTE DISPLAY ======
function showRandomQuote() {
  const filtered = filterQuote(categoryFilter.value);
  if (!filtered.length) {
    quoteDisplay.textContent = "No quotes available in this category!";
    return;
  }
  const quote = filtered[Math.floor(Math.random() * filtered.length)];
  quoteDisplay.textContent = `"${quote.text}" — ${quote.category}`;
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

// ====== ADD QUOTE ======
function addQuote(text, category) {
  if (text && category) {
    const id = quotes.length ? Math.max(...quotes.map(q => q.id)) + 1 : 1;
    const newQuote = { id, text: text.trim(), category: category.trim() };
    quotes.push(newQuote);
    saveQuotes();
    populateCategories();
    showRandomQuote();
    alert("New quote added successfully!");
    postQuoteToServer(newQuote); // send to server
  } else alert("Please fill in both fields.");
}

function createAddQuoteForm(containerId) {
  const container = document.getElementById(containerId);
  const textInput = document.createElement("input");
  textInput.id = "newQuoteText";
  textInput.type = "text";
  textInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", () => addQuote(textInput.value, categoryInput.value));

  container.appendChild(textInput);
  container.appendChild(categoryInput);
  container.appendChild(addBtn);
}

// ====== JSON IMPORT/EXPORT ======
function exportToJson() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert("Quotes imported successfully!");
      } else alert("Invalid JSON format.");
    } catch (err) {
      alert("Error parsing JSON file.");
    }
  };
  reader.readAsText(event.target.files[0]);
}

// ====== SERVER INTERACTION ======
async function fetchQuotesFromServer() {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts");
  const data = await response.json();
  return data.slice(0, 10).map(item => ({
    id: item.id,
    text: item.title,
    category: "Server"
  }));
}

async function postQuoteToServer(quote) {
  try {
    await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
  } catch (err) {
    console.error("Error posting to server:", err);
  }
}

// ====== SYNC QUOTES FUNCTION ======
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  let conflicts = 0;

  serverQuotes.forEach(sq => {
    const local = quotes.find(lq => lq.id === sq.id);
    if (local) {
      local.text = sq.text;
      local.category = sq.category;
      conflicts++;
    } else {
      quotes.push(sq);
    }
  });

  saveQuotes();
  populateCategories();

  if (conflicts > 0) {
    conflictNotice.textContent = `⚠ ${conflicts} conflict(s) resolved with server data.`;
    setTimeout(() => { conflictNotice.textContent = ""; }, 5000);
  }
}

// ====== INITIALIZATION ======
createAddQuoteForm("formContainer");
populateCategories();
newQuoteBtn.addEventListener("click", showRandomQuote);
categoryFilter.addEventListener("change", showRandomQuote);
document.getElementById("exportBtn").addEventListener("click", exportToJson);
document.getElementById("importFile").addEventListener("change", importFromJsonFile);

// Restore last viewed quote
const lastQuote = JSON.parse(sessionStorage.getItem("lastQuote"));
if (lastQuote) {
  quoteDisplay.textContent = `"${lastQuote.text}" — ${lastQuote.category}`;
}

// Periodically sync with server every 10s
setInterval(syncQuotes, 10000);
