"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Package, Utensils, Banknote, Download } from "lucide-react"
import { getData } from "@/lib/firestoreService"

interface Article {
  id: string
  name: string
  category: string
  stock: number
  priceBar: number
  priceSnackbar: number
}

interface Table {
  id: string
  status: "occupied" | "free"
}

interface Payment {
  id: string
  amount: number
  date: string
  mode: "bar" | "snackbar"
}

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

export default function Dashboard({
  mode,
  currentUser,
}: {
  mode: "bar" | "snackbar"
  currentUser?: string
}) {
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

  const [articles, setArticles] = useState<Article[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    loadData()
    // Refresh stats every 5 sec
    const interval = setInterval(calculateStats, 5000)
    return () => clearInterval(interval)
  }, [mode])

  const loadData = async () => {
    try {
      const articlesData = await getData("bar_articles")
      const tablesData = await getData("bar_tables")
      const paymentsData = await getData("bar_payments")

      setArticles(articlesData as Article[])
      setTables(tablesData as Table[])
      setPayments(paymentsData as Payment[])

      calculateStats(articlesData as Article[], tablesData as Table[], paymentsData as Payment[])
    } catch (error) {
      console.error("Erreur chargement dashboard:", error)
    }
  }

  const calculateStats = (
    articlesData: Article[] = articles,
    tablesData: Table[] = tables,
    paymentsData: Payment[] = payments
  ) => {
    const lowStock = articlesData.filter(a => a.stock < 10).length
    const occupied = tablesData.filter(t => t.status === "occupied").length
    const total = paymentsData.reduce((sum, p) => sum + p.amount, 0)

    const barPayments = paymentsData.filter(p => p.mode === "bar")
    const snackbarPayments = paymentsData.filter(p => p.mode === "snackbar")
    const barTotal = barPayments.reduce((sum, p) => sum + p.amount, 0)
    const snackbarTotal = snackbarPayments.reduce((sum, p) => sum + p.amount, 0)

    const modePayments = paymentsData.filter(p => p.mode === mode)
    const modeTotal = modePayments.reduce((sum, p) => sum + p.amount, 0)

    const today = new Date().toDateString()
    const todayPayments = paymentsData.filter(p => new Date(p.date).toDateString() === today)
    const todayTotal = todayPayments.reduce((sum, p) => sum + p.amount, 0)

    const modeTodayPayments = todayPayments.filter(p => p.mode === mode)
    const modeTodayTotal = modeTodayPayments.reduce((sum, p) => sum + p.amount, 0)

    setStats({
      totalSales: total,
      todaySales: todayTotal,
      occupiedTables: occupied,
      totalTables: tablesData.length,
      lowStockItems: lowStock,
      totalArticles: articlesData.length,
      barSales: barTotal,
      snackbarSales: snackbarTotal,
      modeTotalSales: modeTotal,
      modeTodaySales: modeTodayTotal,
    })
  }

  const exportStockToExcel = () => {
    const today = new Date().toDateString()
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/1999/xhtml">
      <head><meta charset="utf-8"><style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
        th { background-color: #1e3a5f; color: white; font-weight: bold; padding: 12px; text-align: left; border:1px solid #000; }
        td { padding: 10px; border:1px solid #000; }
        tr:nth-child(even){background-color:#f2f2f2;}
        .negative{color:red;font-weight:bold;}
        .positive{color:green;font-weight:bold;}
      </style></head><body>
      <h2>Rapport de Stock - ${new Date().toLocaleDateString("fr-FR")}</h2>
      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th>Catégorie</th>
            <th>Stock</th>
            <th>Prix Bar (FCFA)</th>
            <th>Prix Snackbar (FCFA)</th>
          </tr>
        </thead>
        <tbody>
    `

    articles.forEach(a => {
      htmlContent += `
        <tr>
          <td>${a.name}</td>
          <td>${a.category}</td>
          <td>${a.stock}</td>
          <td>${a.priceBar.toLocaleString()}</td>
          <td>${a.priceSnackbar.toLocaleString()}</td>
        </tr>
      `
    })

    htmlContent += `</tbody></table></body></html>`

    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `stock_${today.replace(/\//g, "-")}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        {/* Reuse the Cards from your original component */}
      </div>
    </div>
  )
}
