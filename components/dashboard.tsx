"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Package, Utensils, Banknote, Download } from "lucide-react"

interface Stats {
  totalSales: number
  todaySales: number
  occupiedTables: number
  totalTables: number
  lowStockItems: number
  totalArticles: number
  barSales: number
  snackbarSales: number
  modeTotalSales: number
  modeTodaySales: number
}

export default function Dashboard({ mode, currentUser }: { mode: "bar" | "snackbar"; currentUser?: string }) {
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    todaySales: 0,
    occupiedTables: 0,
    totalTables: 0,
    lowStockItems: 0,
    totalArticles: 0,
    barSales: 0,
    snackbarSales: 0,
    modeTotalSales: 0,
    modeTodaySales: 0,
  })

  useEffect(() => {
    calculateStats()
    saveStockSnapshot() // Save snapshot when dashboard loads

    // Refresh stats every 5 seconds
    const interval = setInterval(calculateStats, 5000)
    return () => clearInterval(interval)
  }, [mode])

  const calculateStats = () => {
    // Get articles
    const articles = JSON.parse(localStorage.getItem("bar_articles") || "[]")
    const lowStock = articles.filter((a: any) => a.stock < 10).length

    // Get tables
    const tables = JSON.parse(localStorage.getItem("bar_tables") || "[]")
    const occupied = tables.filter((t: any) => t.status === "occupied").length

    // Get payments
    const payments = JSON.parse(localStorage.getItem("bar_payments") || "[]")
    const total = payments.reduce((sum: number, p: any) => sum + p.amount, 0)

    const barPayments = payments.filter((p: any) => p.mode === "bar")
    const snackbarPayments = payments.filter((p: any) => p.mode === "snackbar")
    const barTotal = barPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
    const snackbarTotal = snackbarPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

    const modePayments = payments.filter((p: any) => p.mode === mode)
    const modeTotal = modePayments.reduce((sum: number, p: any) => sum + p.amount, 0)

    // Today's sales
    const today = new Date().toDateString()
    const todayPayments = payments.filter((p: any) => new Date(p.date).toDateString() === today)
    const todayTotal = todayPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

    const modeTodayPayments = todayPayments.filter((p: any) => p.mode === mode)
    const modeTodayTotal = modeTodayPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

    setStats({
      totalSales: total,
      todaySales: todayTotal,
      occupiedTables: occupied,
      totalTables: tables.length,
      lowStockItems: lowStock,
      totalArticles: articles.length,
      barSales: barTotal,
      snackbarSales: snackbarTotal,
      modeTotalSales: modeTotal,
      modeTodaySales: modeTodayTotal,
    })
  }

  const exportStockToExcel = () => {
    const articles = JSON.parse(localStorage.getItem("bar_articles") || "[]")

    // Get initial stock from a snapshot taken at start of day (if exists)
    const stockSnapshot = JSON.parse(localStorage.getItem("bar_stock_snapshot") || "{}")
    const today = new Date().toDateString()
    const todaySnapshot = stockSnapshot[today] || {}

    // Create HTML table content with styling
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta charset="utf-8">
        <style>
          table {
            border-collapse: collapse;
            width: 100%;
            font-family: Arial, sans-serif;
          }
          th {
            background-color: #1e3a5f;
            color: white;
            font-weight: bold;
            padding: 12px;
            text-align: left;
            border: 1px solid #000;
          }
          td {
            padding: 10px;
            border: 1px solid #000;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .negative {
            color: red;
            font-weight: bold;
          }
          .positive {
            color: green;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <h2>Rapport de Stock - ${new Date().toLocaleDateString("fr-FR")}</h2>
        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th>Catégorie</th>
              <th>Stock Initial</th>
              <th>Stock Actuel</th>
              <th>Différence</th>
              <th>Prix Bar (FCFA)</th>
              <th>Prix Snackbar (FCFA)</th>
            </tr>
          </thead>
          <tbody>
    `

    articles.forEach((article: any) => {
      const initialStock = todaySnapshot[article.id] !== undefined ? todaySnapshot[article.id] : article.stock
      const currentStock = article.stock
      const difference = currentStock - initialStock
      const diffClass = difference < 0 ? "negative" : difference > 0 ? "positive" : ""

      htmlContent += `
        <tr>
          <td>${article.name}</td>
          <td>${article.category || "Non catégorisé"}</td>
          <td>${initialStock}</td>
          <td>${currentStock}</td>
          <td class="${diffClass}">${difference > 0 ? "+" : ""}${difference}</td>
          <td>${(article.priceBar || 0).toLocaleString()}</td>
          <td>${(article.priceSnackbar || 0).toLocaleString()}</td>
        </tr>
      `
    })

    htmlContent += `
          </tbody>
        </table>
      </body>
      </html>
    `

    // Create blob and download as .xls file
    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `stock_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.xls`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const saveStockSnapshot = () => {
    const articles = JSON.parse(localStorage.getItem("bar_articles") || "[]")
    const stockSnapshot = JSON.parse(localStorage.getItem("bar_stock_snapshot") || "{}")
    const today = new Date().toDateString()

    // Only save if no snapshot exists for today
    if (!stockSnapshot[today]) {
      const todaySnapshot: any = {}
      articles.forEach((article: any) => {
        todaySnapshot[article.id] = article.stock
      })
      stockSnapshot[today] = todaySnapshot
      localStorage.setItem("bar_stock_snapshot", JSON.stringify(stockSnapshot))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Tableau de bord</h2>
          <p className="text-muted-foreground mt-1 text-sm">Vue d'ensemble de votre activité</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {currentUser === "patron" && (
            <Button onClick={exportStockToExcel} className="bg-accent hover:bg-accent/90 text-white gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exporter Stock</span>
              <span className="sm:hidden">Export</span>
            </Button>
          )}
          <div
            className={`px-4 py-2 rounded-lg font-semibold text-sm ${
              mode === "bar"
                ? "bg-blue-500/20 text-blue-700 border border-blue-500/30"
                : "bg-purple-500/20 text-purple-700 border border-purple-500/30"
            }`}
          >
            Mode actif: {mode === "bar" ? "Bar (Journée)" : "Snackbar (Soirée)"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Today's Sales */}
        <Card className="p-6 bg-primary/10 border-primary/20 hover:bg-primary/15 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Ventes du jour ({mode === "bar" ? "Bar" : "Snackbar"})
              </p>
              <p className="text-3xl font-bold mt-2 text-primary">{stats.modeTodaySales.toLocaleString()} FCFA</p>
            </div>
            <div className="bg-primary/20 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        {/* Total Sales */}
        <Card className="p-6 bg-accent/10 border-accent/20 hover:bg-accent/15 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Ventes totales ({mode === "bar" ? "Bar" : "Snackbar"})
              </p>
              <p className="text-3xl font-bold mt-2 text-accent">{stats.modeTotalSales.toLocaleString()} FCFA</p>
            </div>
            <div className="bg-accent/20 p-3 rounded-lg">
              <Banknote className="w-6 h-6 text-accent" />
            </div>
          </div>
        </Card>

        {/* Tables Status */}
        <Card className="p-6 bg-secondary/10 border-secondary/20 hover:bg-secondary/15 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Tables occupées</p>
              <p className="text-3xl font-bold mt-2 text-secondary">
                {stats.occupiedTables} / {stats.totalTables}
              </p>
            </div>
            <div className="bg-secondary/20 p-3 rounded-lg">
              <Utensils className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>

        {/* Stock Alert */}
        <Card className="p-6 bg-destructive/10 border-destructive/20 hover:bg-destructive/15 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Stock faible</p>
              <p className="text-3xl font-bold mt-2 text-destructive">{stats.lowStockItems} articles</p>
            </div>
            <div className="bg-destructive/20 p-3 rounded-lg">
              <Package className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card
          className={`p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20 ${
            mode === "bar" ? "ring-2 ring-blue-500" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Ventes Mode Bar</h3>
            <div className="bg-blue-500/20 px-3 py-1 rounded-full">
              <span className="text-xs font-medium text-blue-700">Journée</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.barSales.toLocaleString()} FCFA</p>
          {mode === "bar" && <p className="text-xs text-blue-600 mt-2 font-medium">Mode actif</p>}
        </Card>

        <Card
          className={`p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20 ${
            mode === "snackbar" ? "ring-2 ring-purple-500" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Ventes Mode Snackbar</h3>
            <div className="bg-purple-500/20 px-3 py-1 rounded-full">
              <span className="text-xs font-medium text-purple-700">Soirée</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600">{stats.snackbarSales.toLocaleString()} FCFA</p>
          {mode === "snackbar" && <p className="text-xs text-purple-600 mt-2 font-medium">Mode actif</p>}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Activité récente</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm text-foreground">
                Mode actif: {mode === "bar" ? "Bar (Journée)" : "Snackbar (Soirée)"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Maintenant</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
