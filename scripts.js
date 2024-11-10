let articles = [];

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("dark-mode", savedTheme === "dark");
  document.getElementById("themeToggle").checked = savedTheme === "dark";

  document.getElementById("themeToggle").addEventListener("change", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark-mode") ? "dark" : "light"
    );
  });
  loadArticles();

  document.getElementById("sortOptions").addEventListener("change", (event) => {
    sortAndRenderArticles(event.target.value);
  });

  document
    .getElementById("newArticleForm")
    .addEventListener("submit", handleNewArticle);
  document
    .getElementById("editArticleForm")
    .addEventListener("submit", handleEditArticle);
});

async function loadArticles() {
  try {
    const savedArticles = localStorage.getItem("articles");
    if (savedArticles) {
      articles = JSON.parse(savedArticles);
      sortAndRenderArticles(document.getElementById("sortOptions").value);
      return;
    }

    const response = await fetch("Articles.json");
    const data = await response.json();
    articles = Array.isArray(data.articles) ? data.articles : [];
    localStorage.setItem("articles", JSON.stringify(articles));
    sortAndRenderArticles(document.getElementById("sortOptions").value);
  } catch (error) {
    console.error("Error loading articles:", error);
    articles = [];
    renderArticles(articles);
  }
}

function saveArticles() {
  try {
    localStorage.setItem("articles", JSON.stringify(articles));
    return true;
  } catch (error) {
    console.error("Error saving articles:", error);
    alert("Failed to save changes. Please try again.");
    return false;
  }
}

function handleNewArticle(event) {
  event.preventDefault();

  const newArticle = {
    id: Date.now(),
    title: document.getElementById("articleTitle").value,
    category: document.getElementById("articleCategory").value,
    content: document.getElementById("articleContent").value,
    views: parseInt(document.getElementById("articleViews").value),
    wordCount: parseInt(document.getElementById("articleWordCount").value),
    date: new Date().toISOString().split("T")[0],
  };

  articles.push(newArticle);
  if (saveArticles()) {
    sortAndRenderArticles(document.getElementById("sortOptions").value);
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("newArticleModal")
    );
    modal.hide();
    document.getElementById("newArticleForm").reset();
  }
}

function handleEditArticle(event) {
  event.preventDefault();

  const articleId = parseInt(event.target.dataset.articleId);
  const articleIndex = articles.findIndex((a) => a.id === articleId);

  if (articleIndex !== -1) {
    articles[articleIndex] = {
      ...articles[articleIndex],
      title: document.getElementById("editArticleTitle").value,
      category: document.getElementById("editArticleCategory").value,
      content: document.getElementById("editArticleContent").value,
      views: parseInt(document.getElementById("editArticleViews").value),
      wordCount: parseInt(
        document.getElementById("editArticleWordCount").value
      ),
    };

    if (saveArticles()) {
      sortAndRenderArticles(document.getElementById("sortOptions").value);
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editArticleModal")
      );
      modal.hide();
    }
  }
}

function editArticle(event) {
  const articleId = parseInt(event.target.getAttribute("data-id"));
  const article = articles.find((a) => a.id === articleId);

  if (article) {
    document.getElementById("editArticleTitle").value = article.title;
    document.getElementById("editArticleCategory").value = article.category;
    document.getElementById("editArticleContent").value = article.content;
    document.getElementById("editArticleViews").value = article.views;
    document.getElementById("editArticleWordCount").value = article.wordCount;
    document.getElementById("editArticleForm").dataset.articleId = article.id;

    const modal = new bootstrap.Modal(
      document.getElementById("editArticleModal")
    );
    modal.show();
  }
}

function deleteArticle(event) {
  const articleId = parseInt(event.target.getAttribute("data-id"));

  if (confirm("Are you sure you want to delete this article?")) {
    articles = articles.filter((article) => article.id !== articleId);
    if (saveArticles()) {
      sortAndRenderArticles(document.getElementById("sortOptions").value);
    }
  }
}

function sortArticles(articlesToSort, sortBy) {
  return [...articlesToSort].sort((a, b) => {
    switch (sortBy) {
      case "views":
        return b.views - a.views;
      case "wordCount":
        return b.wordCount - a.wordCount;
      case "date":
      default:
        return new Date(b.date) - new Date(a.date);
    }
  });
}

function sortAndRenderArticles(sortBy) {
  const sortedArticles = sortArticles(articles, sortBy);
  renderArticles(sortedArticles);
}

function renderArticles(articlesToRender) {
  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = "";

  if (!Array.isArray(articlesToRender) || articlesToRender.length === 0) {
    mainContent.innerHTML = "<p>No articles available.</p>";
    return;
  }

  const groupedArticles = articlesToRender.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {});

  for (const category in groupedArticles) {
    const categoryArticles = groupedArticles[category];

    const categoryHTML = `
      <h3>${category}</h3>
      <div class="category-articles">
        ${categoryArticles
          .map((article) => {
            const readingTimeInSeconds = Math.round(
              (article.wordCount / 200) * 60
            );
            const minutes = Math.floor(readingTimeInSeconds / 60);
            const seconds = readingTimeInSeconds % 60;
            const formattedReadingTime = `${minutes} min ${seconds} seconds`;

            return `
              <div class="card mb-4" data-id="${article.id}">
                <div class="card-body">
                  <h5 class="card-title">${article.title}</h5>
                  <p class="card-text"><small>${article.date} - ${article.category}</small></p>
                  <p>${article.content}</p>
                  <p><small>Views: ${article.views} | Words: ${article.wordCount} | Estimated Reading Time: ${formattedReadingTime}</small></p>
                  <button class="btn btn-warning edit-btn" data-id="${article.id}">Edit</button>
                  <button class="btn btn-danger delete-btn" data-id="${article.id}">Delete</button>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;

    mainContent.innerHTML += categoryHTML;
  }

  document
    .querySelectorAll(".edit-btn")
    .forEach((button) => button.addEventListener("click", editArticle));
  document
    .querySelectorAll(".delete-btn")
    .forEach((button) => button.addEventListener("click", deleteArticle));
}

const articleContent = document.getElementById("articleContent");
const articleWordCount = document.getElementById("articleWordCount");

function updateWordCount() {
  const text = articleContent.value.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  articleWordCount.value = wordCount;
}

articleContent.addEventListener("input", updateWordCount);

updateWordCount();
