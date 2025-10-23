// Data Storage Keys
const STORAGE_KEYS = {
  articles: "bar_articles",
  tables: "bar_tables",
  payments: "bar_payments",
  orders: "bar_orders",
}

// Initialize data structures
let articles = []
let tables = []
let payments = []
let currentEditingArticle = null
let currentTable = null

// Load data from localStorage
function loadData() {
  articles = JSON.parse(localStorage.getItem(STORAGE_KEYS.articles)) || []
  tables = JSON.parse(localStorage.getItem(STORAGE_KEYS.tables)) || []
  payments = JSON.parse(localStorage.getItem(STORAGE_KEYS.payments)) || []
}

// Save data to localStorage
function saveData() {
  localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(articles))
  localStorage.setItem(STORAGE_KEYS.tables, JSON.stringify(tables))
  localStorage.setItem(STORAGE_KEYS.payments, JSON.stringify(payments))
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA"
}

// Format date
function formatDate(date) {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Navigation
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault()
    const page = link.dataset.page

    // Update active nav link
    document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"))
    link.classList.add("active")

    // Show corresponding page
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"))
    document.getElementById(`${page}-page`).classList.add("active")

    // Refresh page content
    if (page === "dashboard") updateDashboard()
    if (page === "articles") renderArticles()
    if (page === "tables") renderTables()
    if (page === "payments") renderPayments()
  })
})

// ===== DASHBOARD =====
function updateDashboard() {
  // Calculate daily sales
  const today = new Date().toDateString()
  const dailySales = payments
    .filter((p) => new Date(p.date).toDateString() === today)
    .reduce((sum, p) => sum + p.amount, 0)

  document.getElementById("daily-sales").textContent = formatCurrency(dailySales)

  // Calculate occupied tables
  const occupiedTables = tables.filter((t) => t.status === "occupied").length
  document.getElementById("occupied-tables").textContent = `${occupiedTables}/${tables.length}`

  // Total articles
  document.getElementById("total-articles").textContent = articles.length

  // Active orders
  const activeOrders = tables.filter((t) => t.orders && t.orders.length > 0).length
  document.getElementById("active-orders").textContent = activeOrders

  // Recent activity
  renderRecentActivity()
}

function renderRecentActivity() {
  const container = document.getElementById("recent-activity")
  const recentPayments = payments.slice(-5).reverse()

  if (recentPayments.length === 0) {
    container.innerHTML = '<p class="empty-state">Aucune activité récente</p>'
    return
  }

  container.innerHTML = recentPayments
    .map(
      (payment) => `
        <div class="recent-item">
            <div class="recent-item-info">
                <div class="recent-item-title">${payment.tableName}</div>
                <div class="recent-item-time">${formatDate(payment.date)}</div>
            </div>
            <div class="recent-item-amount">${formatCurrency(payment.amount)}</div>
        </div>
    `,
    )
    .join("")
}

// ===== ARTICLES =====
function renderArticles() {
  const container = document.getElementById("articles-list")

  if (articles.length === 0) {
    container.innerHTML = '<p class="empty-state">Aucun article. Cliquez sur "Ajouter un article" pour commencer.</p>'
    return
  }

  container.innerHTML = articles
    .map(
      (article) => `
        <div class="article-card">
            <div class="article-header">
                <div>
                    <div class="article-name">${article.name}</div>
                    <span class="article-category">${article.category}</span>
                </div>
                <div class="article-actions">
                    <button class="icon-btn" onclick="editArticle('${article.id}')">✏️</button>
                    <button class="icon-btn delete" onclick="deleteArticle('${article.id}')">🗑️</button>
                </div>
            </div>
            <div class="article-details">
                <div class="article-price">${formatCurrency(article.price)}</div>
                <div class="article-stock ${article.stock === 0 ? "stock-out" : article.stock < 10 ? "stock-low" : ""}">
                    Stock: ${article.stock} ${article.stock === 0 ? "(Rupture)" : article.stock < 10 ? "(Faible)" : ""}
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

// Article Modal
const articleModal = document.getElementById("article-modal")
const articleForm = document.getElementById("article-form")

document.getElementById("add-article-btn").addEventListener("click", () => {
  currentEditingArticle = null
  document.getElementById("article-modal-title").textContent = "Ajouter un article"
  articleForm.reset()
  articleModal.classList.add("active")
})

document.getElementById("close-article-modal").addEventListener("click", () => {
  articleModal.classList.remove("active")
})

document.getElementById("cancel-article").addEventListener("click", () => {
  articleModal.classList.remove("active")
})

articleForm.addEventListener("submit", (e) => {
  e.preventDefault()

  const articleData = {
    id: currentEditingArticle || Date.now().toString(),
    name: document.getElementById("article-name").value,
    price: Number.parseFloat(document.getElementById("article-price").value),
    category: document.getElementById("article-category").value,
    stock: Number.parseInt(document.getElementById("article-stock").value),
  }

  if (currentEditingArticle) {
    const index = articles.findIndex((a) => a.id === currentEditingArticle)
    articles[index] = articleData
  } else {
    articles.push(articleData)
  }

  saveData()
  renderArticles()
  articleModal.classList.remove("active")
})

function editArticle(id) {
  const article = articles.find((a) => a.id === id)
  if (!article) return

  currentEditingArticle = id
  document.getElementById("article-modal-title").textContent = "Modifier l'article"
  document.getElementById("article-name").value = article.name
  document.getElementById("article-price").value = article.price
  document.getElementById("article-category").value = article.category
  document.getElementById("article-stock").value = article.stock

  articleModal.classList.add("active")
}

function deleteArticle(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
    articles = articles.filter((a) => a.id !== id)
    saveData()
    renderArticles()
  }
}

// ===== TABLES =====
function renderTables() {
  const container = document.getElementById("tables-list")

  if (tables.length === 0) {
    container.innerHTML = '<p class="empty-state">Aucune table. Cliquez sur "Ajouter une table" pour commencer.</p>'
    return
  }

  container.innerHTML = tables
    .map((table) => {
      const orderTotal = table.orders
        ? table.orders.reduce((sum, order) => {
            const article = articles.find((a) => a.id === order.articleId)
            return sum + (article ? article.price * order.quantity : 0)
          }, 0)
        : 0

      const orderCount = table.orders ? table.orders.reduce((sum, order) => sum + order.quantity, 0) : 0

      return `
            <div class="table-card ${table.status}" onclick="openTableOrders('${table.id}')">
                <div class="table-header">
                    <div class="table-number">Table ${table.number}</div>
                    <span class="table-status ${table.status}">
                        ${table.status === "occupied" ? "Occupée" : "Disponible"}
                    </span>
                </div>
                <div class="table-info">
                    Capacité: ${table.capacity} personnes
                </div>
                ${
                  table.status === "occupied" && orderCount > 0
                    ? `
                    <div class="table-order-summary">
                        <div class="table-order-items">${orderCount} article(s)</div>
                        <div class="table-order-total">${formatCurrency(orderTotal)}</div>
                    </div>
                `
                    : ""
                }
                <div class="table-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-danger btn-small" onclick="deleteTable('${table.id}')">Supprimer</button>
                </div>
            </div>
        `
    })
    .join("")
}

// Table Modal
const tableModal = document.getElementById("table-modal")
const tableForm = document.getElementById("table-form")

document.getElementById("add-table-btn").addEventListener("click", () => {
  tableForm.reset()
  tableModal.classList.add("active")
})

document.getElementById("close-table-modal").addEventListener("click", () => {
  tableModal.classList.remove("active")
})

document.getElementById("cancel-table").addEventListener("click", () => {
  tableModal.classList.remove("active")
})

tableForm.addEventListener("submit", (e) => {
  e.preventDefault()

  const tableData = {
    id: Date.now().toString(),
    number: document.getElementById("table-number").value,
    capacity: Number.parseInt(document.getElementById("table-capacity").value),
    status: "available",
    orders: [],
  }

  tables.push(tableData)
  saveData()
  renderTables()
  tableModal.classList.remove("active")
})

function deleteTable(id) {
  const table = tables.find((t) => t.id === id)
  if (table && table.status === "occupied") {
    alert("Impossible de supprimer une table occupée. Veuillez d'abord enregistrer le paiement.")
    return
  }

  if (confirm("Êtes-vous sûr de vouloir supprimer cette table ?")) {
    tables = tables.filter((t) => t.id !== id)
    saveData()
    renderTables()
  }
}

// ===== ORDERS =====
const orderModal = document.getElementById("order-modal")

function openTableOrders(tableId) {
  currentTable = tables.find((t) => t.id === tableId)
  if (!currentTable) return

  document.getElementById("order-modal-title").textContent = `Commandes - Table ${currentTable.number}`

  // Render available articles
  renderOrderArticles()

  // Render current order
  renderCurrentOrder()

  orderModal.classList.add("active")
}

function renderOrderArticles() {
  const container = document.getElementById("order-articles-list")

  const availableArticles = articles.filter((a) => a.stock > 0)

  if (availableArticles.length === 0) {
    container.innerHTML = '<p class="empty-state">Aucun article disponible</p>'
    return
  }

  container.innerHTML = availableArticles
    .map(
      (article) => `
        <div class="article-select-item" onclick="addToOrder('${article.id}')">
            <div class="article-select-name">${article.name}</div>
            <div class="article-select-price">${formatCurrency(article.price)} • Stock: ${article.stock}</div>
        </div>
    `,
    )
    .join("")
}

function renderCurrentOrder() {
  const container = document.getElementById("current-order-list")

  if (!currentTable.orders || currentTable.orders.length === 0) {
    container.innerHTML = '<p class="empty-state">Aucun article dans la commande</p>'
    document.getElementById("order-total").textContent = "0 FCFA"
    return
  }

  let total = 0

  container.innerHTML = currentTable.orders
    .map((order) => {
      const article = articles.find((a) => a.id === order.articleId)
      if (!article) return ""

      const itemTotal = article.price * order.quantity
      total += itemTotal

      return `
            <div class="order-item">
                <div class="order-item-info">
                    <div class="order-item-name">${article.name}</div>
                    <div class="order-item-price">${formatCurrency(article.price)} × ${order.quantity} = ${formatCurrency(itemTotal)}</div>
                </div>
                <div class="order-item-quantity">
                    <button class="qty-btn" onclick="updateOrderQuantity('${order.articleId}', -1)">−</button>
                    <span class="qty-value">${order.quantity}</span>
                    <button class="qty-btn" onclick="updateOrderQuantity('${order.articleId}', 1)">+</button>
                </div>
            </div>
        `
    })
    .join("")

  document.getElementById("order-total").textContent = formatCurrency(total)
}

function addToOrder(articleId) {
  const article = articles.find((a) => a.id === articleId)
  if (!article || article.stock === 0) return

  if (!currentTable.orders) {
    currentTable.orders = []
  }

  const existingOrder = currentTable.orders.find((o) => o.articleId === articleId)

  if (existingOrder) {
    if (existingOrder.quantity < article.stock) {
      existingOrder.quantity++
    } else {
      alert("Stock insuffisant")
      return
    }
  } else {
    currentTable.orders.push({
      articleId: articleId,
      quantity: 1,
    })
  }

  currentTable.status = "occupied"
  saveData()
  renderCurrentOrder()
}

function updateOrderQuantity(articleId, change) {
  const order = currentTable.orders.find((o) => o.articleId === articleId)
  if (!order) return

  const article = articles.find((a) => a.id === articleId)
  if (!article) return

  const newQuantity = order.quantity + change

  if (newQuantity <= 0) {
    currentTable.orders = currentTable.orders.filter((o) => o.articleId !== articleId)
    if (currentTable.orders.length === 0) {
      currentTable.status = "available"
    }
  } else if (newQuantity <= article.stock) {
    order.quantity = newQuantity
  } else {
    alert("Stock insuffisant")
    return
  }

  saveData()
  renderCurrentOrder()
}

document.getElementById("close-order-modal").addEventListener("click", () => {
  orderModal.classList.remove("active")
  renderTables()
})

document.getElementById("cancel-order").addEventListener("click", () => {
  orderModal.classList.remove("active")
  renderTables()
})

document.getElementById("pay-order").addEventListener("click", () => {
  if (!currentTable.orders || currentTable.orders.length === 0) {
    alert("Aucune commande à payer")
    return
  }

  let total = 0
  const orderDetails = []

  // Calculate total and update stock
  currentTable.orders.forEach((order) => {
    const article = articles.find((a) => a.id === order.articleId)
    if (article) {
      total += article.price * order.quantity
      article.stock -= order.quantity
      orderDetails.push({
        name: article.name,
        quantity: order.quantity,
        price: article.price,
      })
    }
  })

  // Create payment record
  const payment = {
    id: Date.now().toString(),
    tableId: currentTable.id,
    tableName: `Table ${currentTable.number}`,
    amount: total,
    date: new Date().toISOString(),
    items: orderDetails,
  }

  payments.push(payment)

  // Reset table
  currentTable.orders = []
  currentTable.status = "available"

  saveData()

  alert(`Paiement enregistré: ${formatCurrency(total)}`)

  orderModal.classList.remove("active")
  renderTables()
  updateDashboard()
})

// ===== PAYMENTS =====
function renderPayments() {
  const container = document.getElementById("payments-list")

  // Update stats
  const today = new Date().toDateString()
  const todayPayments = payments.filter((p) => new Date(p.date).toDateString() === today)
  const todayTotal = todayPayments.reduce((sum, p) => sum + p.amount, 0)

  document.getElementById("today-total").textContent = formatCurrency(todayTotal)
  document.getElementById("payment-count").textContent = payments.length

  if (payments.length === 0) {
    container.innerHTML = '<p class="empty-state">Aucun paiement enregistré</p>'
    return
  }

  container.innerHTML = payments
    .slice()
    .reverse()
    .map(
      (payment) => `
        <div class="payment-item">
            <div class="payment-info">
                <h4>${payment.tableName}</h4>
                <div class="payment-details">
                    <div>${formatDate(payment.date)}</div>
                    <div>${payment.items.length} article(s)</div>
                </div>
            </div>
            <div class="payment-amount">${formatCurrency(payment.amount)}</div>
        </div>
    `,
    )
    .join("")
}

// Initialize app
loadData()
updateDashboard()

// Add some sample data if empty
if (articles.length === 0) {
  articles = [
    { id: "1", name: "Coca-Cola", price: 500, category: "Boissons", stock: 50 },
    { id: "2", name: "Castel Beer", price: 800, category: "Bières", stock: 30 },
    { id: "3", name: "Eau minérale", price: 300, category: "Boissons", stock: 100 },
    { id: "4", name: "Brochettes", price: 1500, category: "Plats", stock: 20 },
  ]
  saveData()
  renderArticles()
}
