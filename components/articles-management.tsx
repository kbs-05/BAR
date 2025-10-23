"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, AlertTriangle, Search } from "lucide-react"

interface Article {
  id: string
  name: string
  category: string
  priceBar: number
  priceSnackbar: number
  stock: number
  unit: string
}

export default function ArticlesManagement({
  mode,
  logActivity,
  currentUser,
}: { mode: "bar" | "snackbar"; logActivity: (action: string, details?: string) => void; currentUser: string | null }) {
  const [articles, setArticles] = useState<Article[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    priceBar: "",
    priceSnackbar: "",
    stock: "",
    unit: "unité",
  })

  const isManager = currentUser === "patron" || currentUser === "gerante1" || currentUser === "gerante2"

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = () => {
    const stored = localStorage.getItem("bar_articles")
    if (stored) {
      const parsedArticles = JSON.parse(stored)
      const migratedArticles = parsedArticles.map((article: any) => ({
        ...article,
        priceBar: article.priceBar ?? article.price ?? 0,
        priceSnackbar: article.priceSnackbar ?? (article.price ? article.price * 1.2 : 0),
      }))
      localStorage.setItem("bar_articles", JSON.stringify(migratedArticles))
      setArticles(migratedArticles)
    } else {
      const sampleArticles: Article[] = [
        {
          id: "1",
          name: "Bière Régab",
          category: "Boissons",
          priceBar: 1000,
          priceSnackbar: 1200,
          stock: 50,
          unit: "bouteille",
        },
        {
          id: "2",
          name: "Coca-Cola",
          category: "Boissons",
          priceBar: 500,
          priceSnackbar: 600,
          stock: 30,
          unit: "canette",
        },
        {
          id: "3",
          name: "Eau minérale",
          category: "Boissons",
          priceBar: 300,
          priceSnackbar: 400,
          stock: 100,
          unit: "bouteille",
        },
        {
          id: "4",
          name: "Brochettes",
          category: "Nourriture",
          priceBar: 1500,
          priceSnackbar: 1800,
          stock: 20,
          unit: "portion",
        },
        {
          id: "5",
          name: "Poisson braisé",
          category: "Nourriture",
          priceBar: 3000,
          priceSnackbar: 3500,
          stock: 8,
          unit: "portion",
        },
      ]
      localStorage.setItem("bar_articles", JSON.stringify(sampleArticles))
      setArticles(sampleArticles)
    }
  }

  const saveArticles = (updatedArticles: Article[]) => {
    localStorage.setItem("bar_articles", JSON.stringify(updatedArticles))
    setArticles(updatedArticles)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const article: Article = {
      id: editingId || Date.now().toString(),
      name: formData.name,
      category: formData.category,
      priceBar: Number.parseFloat(formData.priceBar),
      priceSnackbar: Number.parseFloat(formData.priceSnackbar),
      stock: Number.parseInt(formData.stock),
      unit: formData.unit,
    }

    let updatedArticles
    if (editingId) {
      updatedArticles = articles.map((a) => (a.id === editingId ? article : a))
      logActivity("Modification d'article", `Article "${article.name}" modifié`)
    } else {
      updatedArticles = [...articles, article]
      logActivity("Ajout d'article", `Nouvel article "${article.name}" ajouté`)
    }

    saveArticles(updatedArticles)
    resetForm()
  }

  const handleEdit = (article: Article) => {
    setEditingId(article.id)
    setFormData({
      name: article.name,
      category: article.category,
      priceBar: article.priceBar.toString(),
      priceSnackbar: article.priceSnackbar.toString(),
      stock: article.stock.toString(),
      unit: article.unit,
    })
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      const article = articles.find((a) => a.id === id)
      const updatedArticles = articles.filter((a) => a.id !== id)
      saveArticles(updatedArticles)
      if (article) {
        logActivity("Suppression d'article", `Article "${article.name}" supprimé`)
      }
    }
  }

  const resetForm = () => {
    setFormData({ name: "", category: "", priceBar: "", priceSnackbar: "", stock: "", unit: "unité" })
    setEditingId(null)
    setIsFormOpen(false)
  }

  const categories = ["Boissons", "Nourriture", "Snacks", "Autres"]
  const units = ["unité", "bouteille", "canette", "portion", "kg", "litre"]

  const getCurrentPrice = (article: Article) => {
    const barPrice = article.priceBar ?? 0
    const snackbarPrice = article.priceSnackbar ?? 0
    return mode === "bar" ? barPrice : snackbarPrice
  }

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des articles</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Prix affichés en mode {mode === "bar" ? "Bar (Journée)" : "Snackbar (Soirée)"}
          </p>
        </div>
        {isManager && (
          <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Nouvel article
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Toutes catégories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {isFormOpen && isManager && (
        <Card className="p-6 bg-white/80 backdrop-blur">
          <h3 className="text-lg font-semibold mb-4">{editingId ? "Modifier l'article" : "Nouvel article"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'article</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Bière Régab"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Sélectionner...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceBar">Prix Bar - Journée (FCFA)</Label>
                <Input
                  id="priceBar"
                  type="number"
                  value={formData.priceBar}
                  onChange={(e) => setFormData({ ...formData, priceBar: e.target.value })}
                  required
                  min="0"
                  placeholder="1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceSnackbar">Prix Snackbar - Soirée (FCFA)</Label>
                <Input
                  id="priceSnackbar"
                  type="number"
                  value={formData.priceSnackbar}
                  onChange={(e) => setFormData({ ...formData, priceSnackbar: e.target.value })}
                  required
                  min="0"
                  placeholder="1200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                  min="0"
                  placeholder="50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unité</Label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button type="submit">{editingId ? "Mettre à jour" : "Ajouter"}</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map((article) => (
          <Card
            key={article.id}
            className={`p-4 bg-white/80 backdrop-blur ${article.stock < 10 ? "border-2 border-amber-500" : ""}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-black">{article.name}</h3>
                <p className="text-sm text-muted-foreground">{article.category}</p>
              </div>
              {article.stock < 10 && <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Prix actuel:</span>
                <span className="font-bold text-lg text-primary">{getCurrentPrice(article).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Bar: {(article.priceBar ?? 0).toLocaleString()} FCFA</span>
                <span>Snackbar: {(article.priceSnackbar ?? 0).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock:</span>
                <span className={`font-semibold ${article.stock < 10 ? "text-amber-600" : "text-foreground"}`}>
                  {article.stock} {article.unit}
                </span>
              </div>
            </div>

            {isManager && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(article)} className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(article.id)} className="flex-1">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <Card className="p-12 text-center bg-white/80 backdrop-blur">
          <p className="text-muted-foreground">
            {articles.length === 0
              ? 'Aucun article. Cliquez sur "Nouvel article" pour commencer.'
              : "Aucun article ne correspond à votre recherche."}
          </p>
        </Card>
      )}
    </div>
  )
}
