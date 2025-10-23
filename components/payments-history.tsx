"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Calendar, DollarSign, Sun, Moon, User, X } from "lucide-react"

interface OrderItem {
  articleId: string
  articleName: string
  quantity: number
  price: number
}

interface Payment {
  id: string
  tableName: string
  amount: number
  items: OrderItem[]
  mode?: "bar" | "snackbar"
  recordedBy?: string // Who recorded the payment
  date: string
}

export default function PaymentsHistory({ mode }: { mode: "bar" | "snackbar" }) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null) // Added state for modal
  const [filter, setFilter] = useState<"all" | "today" | "week">("all")
  const [modeFilter, setModeFilter] = useState<"all" | "bar" | "snackbar">("all")

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = () => {
    const stored = localStorage.getItem("bar_payments")
    if (stored) {
      const allPayments = JSON.parse(stored)
      setPayments(allPayments.sort((a: Payment, b: Payment) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    }
  }

  const getUserDisplayName = (userId: string | undefined) => {
    if (!userId) return "Inconnu"

    if (userId === "patron") return "Patron"
    if (userId === "gerante1") return "Gérante 1"
    if (userId === "gerante2") return "Gérante 2"

    // Check if it's an employee
    const employees = JSON.parse(localStorage.getItem("bar_employees") || "[]")
    const employee = employees.find((e: { id: string; name: string }) => e.id === userId)
    return employee ? employee.name : "Inconnu"
  }

  const getFilteredPayments = () => {
    const now = new Date()
    const today = now.toDateString()

    let filtered = payments

    if (modeFilter !== "all") {
      filtered = filtered.filter((p) => p.mode === modeFilter)
    }

    switch (filter) {
      case "today":
        return filtered.filter((p) => new Date(p.date).toDateString() === today)
      case "week": {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return filtered.filter((p) => new Date(p.date) >= weekAgo)
      }
      default:
        return filtered
    }
  }

  const filteredPayments = getFilteredPayments()

  const getTotalAmount = () => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-foreground">Historique des paiements</h2>

        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-2 border-r pr-2">
            <Button
              variant={modeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setModeFilter("all")}
            >
              Tous modes
            </Button>
            <Button
              variant={modeFilter === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setModeFilter("bar")}
              className="gap-1"
            >
              <Sun className="w-3 h-3" />
              Bar
            </Button>
            <Button
              variant={modeFilter === "snackbar" ? "default" : "outline"}
              size="sm"
              onClick={() => setModeFilter("snackbar")}
              className="gap-1"
            >
              <Moon className="w-3 h-3" />
              Snackbar
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
              Tout
            </Button>
            <Button variant={filter === "today" ? "default" : "outline"} size="sm" onClick={() => setFilter("today")}>
              Aujourd'hui
            </Button>
            <Button variant={filter === "week" ? "default" : "outline"} size="sm" onClick={() => setFilter("week")}>
              7 derniers jours
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Total</p>
              <p className="text-2xl font-bold">{getTotalAmount().toLocaleString()} FCFA</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-green-100 text-sm">Transactions</p>
              <p className="text-2xl font-bold">{filteredPayments.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-purple-100 text-sm">Moyenne</p>
              <p className="text-2xl font-bold">
                {filteredPayments.length > 0
                  ? Math.round(getTotalAmount() / filteredPayments.length).toLocaleString()
                  : 0}{" "}
                FCFA
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {filteredPayments.map((payment) => (
          <Card key={payment.id} className="overflow-hidden bg-white/80 backdrop-blur">
            <div
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleExpand(payment.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 text-primary px-3 py-2 rounded-lg font-semibold">
                    {payment.tableName}
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-black">{payment.amount.toLocaleString()} FCFA</p>
                    <p className="text-sm text-muted-foreground">{formatDate(payment.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {payment.mode && (
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        payment.mode === "bar" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {payment.mode === "bar" ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                      {payment.mode === "bar" ? "Bar" : "Snackbar"}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPayment(payment)
                    }}
                  >
                    <User className="w-4 h-4 mr-1" />
                    Détails
                  </Button>
                  <span className="text-sm text-muted-foreground">{payment.items.length} articles</span>
                  {expandedId === payment.id ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            {expandedId === payment.id && (
              <div className="border-t bg-muted/30 p-4">
                <h4 className="font-semibold mb-3 text-sm">Détails de la commande:</h4>
                <div className="space-y-2">
                  {payment.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-background rounded">
                      <div>
                        <p className="font-medium text-sm">{item.articleName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x {item.price.toLocaleString()} FCFA
                        </p>
                      </div>
                      <p className="font-semibold text-black">{(item.quantity * item.price).toLocaleString()} FCFA</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold text-black">{payment.amount.toLocaleString()} FCFA</span>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <Card className="p-12 text-center bg-white/80 backdrop-blur">
          <p className="text-muted-foreground">Aucun paiement enregistré pour cette période.</p>
        </Card>
      )}

      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Détails du paiement</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Table</p>
                <p className="text-lg font-semibold">{selectedPayment.tableName}</p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Enregistré par</p>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <p className="text-lg font-semibold">{getUserDisplayName(selectedPayment.recordedBy)}</p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Montant</p>
                <p className="text-2xl font-bold text-black">{selectedPayment.amount.toLocaleString()} FCFA</p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Date et heure</p>
                <p className="text-lg font-semibold">{formatDate(selectedPayment.date)}</p>
              </div>

              {selectedPayment.mode && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Mode</p>
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPayment.mode === "bar" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {selectedPayment.mode === "bar" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {selectedPayment.mode === "bar" ? "Bar (Journée)" : "Snackbar (Soirée)"}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={() => setSelectedPayment(null)} className="w-full mt-6">
              Fermer
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
