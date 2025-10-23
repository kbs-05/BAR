"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShoppingCart, CreditCard, X, Plus, Trash2, XCircle } from "lucide-react"

interface OrderItem {
  articleId: string
  articleName: string
  quantity: number
  price: number
}

interface Table {
  id: string
  name: string
  status: "available" | "occupied"
  orders: OrderItem[]
  total: number
}

interface Article {
  id: string
  name: string
  priceBar: number // Updated to dual pricing
  priceSnackbar: number // Added snackbar price
  stock: number
}

export default function TablesManagement({
  mode,
  logActivity,
  currentUser,
}: {
  mode: "bar" | "snackbar"
  logActivity: (action: string, details?: string) => void
  currentUser: string | null // Added currentUser prop
}) {
  const [tables, setTables] = useState<Table[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false)
  const [isAddTableFormOpen, setIsAddTableFormOpen] = useState(false)
  const [newTableName, setNewTableName] = useState("")
  const [isEmployee, setIsEmployee] = useState(false)
  const [orderForm, setOrderForm] = useState({
    articleId: "",
    quantity: "1",
  })

  useEffect(() => {
    loadTables()
    loadArticles()
    checkIfEmployee() // Check if current user is an employee
  }, [])

  const checkIfEmployee = () => {
    const employees = JSON.parse(localStorage.getItem("bar_employees") || "[]")
    const isEmp = employees.some((e: { id: string }) => e.id === currentUser)
    setIsEmployee(isEmp)
  }

  const loadTables = () => {
    const stored = localStorage.getItem("bar_tables")
    if (stored) {
      setTables(JSON.parse(stored))
    } else {
      const sampleTables: Table[] = Array.from({ length: 10 }, (_, i) => ({
        id: (i + 1).toString(),
        name: `Table ${i + 1}`,
        status: "available",
        orders: [],
        total: 0,
      }))
      localStorage.setItem("bar_tables", JSON.stringify(sampleTables))
      setTables(sampleTables)
    }
  }

  const loadArticles = () => {
    const stored = localStorage.getItem("bar_articles")
    if (stored) {
      setArticles(JSON.parse(stored))
    }
  }

  const saveTables = (updatedTables: Table[]) => {
    localStorage.setItem("bar_tables", JSON.stringify(updatedTables))
    setTables(updatedTables)
  }

  const openTable = (table: Table) => {
    setSelectedTable(table)
    setIsOrderFormOpen(false)
  }

  const getCurrentPrice = (article: Article) => {
    return mode === "bar" ? article.priceBar : article.priceSnackbar
  }

  const addOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTable) return

    const article = articles.find((a) => a.id === orderForm.articleId)
    if (!article) return

    const quantity = Number.parseInt(orderForm.quantity)
    if (quantity > article.stock) {
      alert("Stock insuffisant!")
      return
    }

    const currentPrice = getCurrentPrice(article)

    const existingOrder = selectedTable.orders.find((o) => o.articleId === article.id)

    let updatedOrders: OrderItem[]
    if (existingOrder) {
      updatedOrders = selectedTable.orders.map((o) =>
        o.articleId === article.id ? { ...o, quantity: o.quantity + quantity } : o,
      )
    } else {
      updatedOrders = [
        ...selectedTable.orders,
        {
          articleId: article.id,
          articleName: article.name,
          quantity,
          price: currentPrice,
        },
      ]
    }

    const total = updatedOrders.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const updatedTable: Table = {
      ...selectedTable,
      status: "occupied",
      orders: updatedOrders,
      total,
    }

    const updatedTables = tables.map((t) => (t.id === selectedTable.id ? updatedTable : t))
    saveTables(updatedTables)
    setSelectedTable(updatedTable)

    const updatedArticles = articles.map((a) => (a.id === article.id ? { ...a, stock: a.stock - quantity } : a))
    localStorage.setItem("bar_articles", JSON.stringify(updatedArticles))
    setArticles(updatedArticles)

    logActivity("Ajout de commande", `${quantity}x ${article.name} ajouté à ${selectedTable.name}`)

    setOrderForm({ articleId: "", quantity: "1" })
    setIsOrderFormOpen(false)
  }

  const removeOrderItem = (articleId: string) => {
    if (!selectedTable) return

    const orderItem = selectedTable.orders.find((o) => o.articleId === articleId)
    if (!orderItem) return

    logActivity(
      "Annulation de commande",
      `${orderItem.quantity}x ${orderItem.articleName} annulé de ${selectedTable.name}`,
    )

    const updatedArticles = articles.map((a) =>
      a.id === articleId ? { ...a, stock: a.stock + orderItem.quantity } : a,
    )
    localStorage.setItem("bar_articles", JSON.stringify(updatedArticles))
    setArticles(updatedArticles)

    const updatedOrders = selectedTable.orders.filter((o) => o.articleId !== articleId)
    const total = updatedOrders.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const updatedTable: Table = {
      ...selectedTable,
      status: updatedOrders.length > 0 ? "occupied" : "available",
      orders: updatedOrders,
      total,
    }

    const updatedTables = tables.map((t) => (t.id === selectedTable.id ? updatedTable : t))
    saveTables(updatedTables)
    setSelectedTable(updatedTable)
  }

  const processPayment = () => {
    if (!selectedTable || selectedTable.orders.length === 0) return

    const payments = JSON.parse(localStorage.getItem("bar_payments") || "[]")
    const payment = {
      id: Date.now().toString(),
      tableName: selectedTable.name,
      amount: selectedTable.total,
      items: selectedTable.orders,
      mode: mode,
      recordedBy: currentUser || "unknown",
      date: new Date().toISOString(),
    }
    payments.push(payment)
    localStorage.setItem("bar_payments", JSON.stringify(payments))

    logActivity(
      "Paiement enregistré",
      `${selectedTable.name}: ${selectedTable.total.toLocaleString()} FCFA (Mode: ${mode === "bar" ? "Bar" : "Snackbar"})`,
    )

    const updatedTable: Table = {
      ...selectedTable,
      status: "available",
      orders: [],
      total: 0,
    }

    const updatedTables = tables.map((t) => (t.id === selectedTable.id ? updatedTable : t))
    saveTables(updatedTables)
    setSelectedTable(null)

    alert("Paiement enregistré avec succès!")
  }

  const addNewTable = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTableName.trim()) return

    const newTable: Table = {
      id: Date.now().toString(),
      name: newTableName.trim(),
      status: "available",
      orders: [],
      total: 0,
    }

    const updatedTables = [...tables, newTable]
    saveTables(updatedTables)

    logActivity("Création de table", `Nouvelle table "${newTableName.trim()}" créée`)

    setNewTableName("")
    setIsAddTableFormOpen(false)
  }

  const deleteTable = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId)
    if (table?.status === "occupied") {
      alert("Impossible de supprimer une table occupée!")
      return
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer cette table?")) {
      const updatedTables = tables.filter((t) => t.id !== tableId)
      saveTables(updatedTables)

      if (table) {
        logActivity("Suppression de table", `Table "${table.name}" supprimée`)
      }

      if (selectedTable?.id === tableId) {
        setSelectedTable(null)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des tables</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Mode actif: {mode === "bar" ? "Bar (Journée)" : "Snackbar (Soirée)"}
          </p>
        </div>
        {!isEmployee && (
          <Button onClick={() => setIsAddTableFormOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une table
          </Button>
        )}
      </div>

      {isAddTableFormOpen && !isEmployee && (
        <Card className="p-6 bg-white/80 backdrop-blur">
          <form onSubmit={addNewTable} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tableName">Nom de la table</Label>
              <Input
                id="tableName"
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Ex: Table VIP, Terrasse 1, Bar..."
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddTableFormOpen(false)} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" className="flex-1">
                Créer la table
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {tables.map((table) => (
              <Card
                key={table.id}
                className={`p-4 cursor-pointer transition-all hover:scale-105 relative group ${
                  table.status === "occupied"
                    ? "bg-gradient-to-br from-red-500 to-orange-600 text-white"
                    : "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                } ${selectedTable?.id === table.id ? "ring-4 ring-primary" : ""}`}
              >
                {table.status === "available" && !isEmployee && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteTable(table.id)
                    }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-white hover:bg-white/20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
                <div className="text-center" onClick={() => openTable(table)}>
                  <p className="text-lg font-bold break-words px-1">{table.name}</p>
                  {table.status === "occupied" && (
                    <p className="text-xs mt-2 opacity-90">{table.total.toLocaleString()} FCFA</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedTable ? (
            <Card className="p-4 sm:p-6 bg-white/80 backdrop-blur lg:sticky lg:top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedTable.name}</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTable(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto scrollbar-thin">
                {selectedTable.orders.map((order) => (
                  <div key={order.articleId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{order.articleName}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.quantity} x {order.price.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{(order.quantity * order.price).toLocaleString()}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOrderItem(order.articleId)}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedTable.orders.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">Aucune commande</p>
              )}

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">{selectedTable.total.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div className="space-y-2">
                {!isOrderFormOpen ? (
                  <>
                    <Button onClick={() => setIsOrderFormOpen(true)} className="w-full" variant="outline">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Ajouter une commande
                    </Button>
                    {selectedTable.orders.length > 0 && (
                      <Button onClick={processPayment} className="w-full">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Enregistrer le paiement
                      </Button>
                    )}
                  </>
                ) : (
                  <form onSubmit={addOrder} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="article">Article</Label>
                      <select
                        id="article"
                        value={orderForm.articleId}
                        onChange={(e) => setOrderForm({ ...orderForm, articleId: e.target.value })}
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Sélectionner...</option>
                        {articles
                          .filter((a) => a.stock > 0)
                          .map((article) => (
                            <option key={article.id} value={article.id}>
                              {article.name} - {getCurrentPrice(article).toLocaleString()} FCFA (Stock: {article.stock})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantité</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={orderForm.quantity}
                        onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                        required
                        min="1"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOrderFormOpen(false)}
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                      <Button type="submit" className="flex-1">
                        Ajouter
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 sm:p-12 text-center bg-white/80 backdrop-blur">
              <p className="text-muted-foreground text-sm sm:text-base">Sélectionnez une table pour voir les détails</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
