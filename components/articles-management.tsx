"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, AlertTriangle, Search } from "lucide-react"
import { getData, addData, updateData, deleteData } from "@/lib/firestoreService"

// ⚡ Typage strict pour un article
interface Article {
  id: string
  name: string
  category: string
  priceBar: number
  priceSnackbar: number
  stock: number
  unit: string
}

interface Props {
  mode: "bar" | "snackbar"
  logActivity: (action: string, details?: string) => void
  currentUser: string | null
}

export default function ArticlesManagement({ mode, logActivity, currentUser }: Props) {
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

  const isManager = ["patron", "gerante1", "gerante2"].includes(currentUser ?? "")

  const categories = ["Boissons", "Nourriture", "Snacks", "Autres"]
  const units = ["unité", "bouteille", "canette", "portion", "kg", "litre"]

  // ⚡ Charger les articles depuis Firestore
  const loadArticles = async () => {
    try {
      const data = await getData("articles")

      // Forcer le typage et fournir des valeurs par défaut
      const mapped: Article[] = data.map((doc: any) => ({
        id: doc.id,
        name: doc.name ?? "",
        category: doc.category ?? "Autres",
        priceBar: doc.priceBar ?? 0,
        priceSnackbar: doc.priceSnackbar ?? 0,
        stock: doc.stock ?? 0,
        unit: doc.unit ?? "unité",
      }))

      setArticles(mapped)
    } catch (error) {
      console.error("Erreur chargement articles:", error)
    }
  }

  useEffect(() => {
    loadArticles()
  }, [])

  // ⚡ Ajouter ou modifier un article
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const article: Article = {
      id: editingId || Date.now().toString(),
      name: formData.name,
      category: formData.category,
      priceBar: Number(formData.priceBar),
      priceSnackbar: Number(formData.priceSnackbar),
      stock: Number(formData.stock),
      unit: formData.unit,
    }

    if (editingId) {
      await updateData("articles", editingId, article)
      logActivity("Modification d'article", `Article "${article.name}" modifié`)
    } else {
      const newId = await addData("articles", article)
      if (newId) article.id = newId
      logActivity("Ajout d'article", `Nouvel article "${article.name}" ajouté`)
    }

    // Reset form et recharger
    setIsFormOpen(false)
    setEditingId(null)
    setFormData({ name: "", category: "", priceBar: "", priceSnackbar: "", stock: "", unit: "unité" })
    loadArticles()
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

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      const article = articles.find(a => a.id === id)
      const success = await deleteData("articles", id)
      if (success && article) logActivity("Suppression d'article", `Article "${article.name}" supprimé`)
      loadArticles()
    }
  }

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getCurrentPrice = (article: Article) => (mode === "bar" ? article.priceBar : article.priceSnackbar)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des articles</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Prix affichés en mode {mode === "bar" ? "Bar (Journée)" : "Snackbar (Soirée)"}
          </p>
        </div>
        {isManager && (
          <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Nouvel article
          </Button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Toutes catégories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Formulaire */}
      {isFormOpen && isManager && (
        <Card className="p-6 bg-white/80 backdrop-blur">
          <h3 className="text-lg font-semibold mb-4">{editingId ? "Modifier l'article" : "Nouvel article"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: "name", label: "Nom de l'article", type: "text" },
                { id: "priceBar", label: "Prix Bar (FCFA)", type: "number" },
                { id: "priceSnackbar", label: "Prix Snackbar (FCFA)", type: "number" },
                { id: "stock", label: "Stock", type: "number" },
              ].map(field => (
                <div className="space-y-2" key={field.id}>
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <Input
                    id={field.id}
                    type={field.type}
                    value={(formData as any)[field.id]}
                    onChange={e => setFormData({ ...formData, [field.id]: e.target.value })}
                    required
                    min={field.type === "number" ? 0 : undefined}
                  />
                </div>
              ))}

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label htmlFor="unit">Unité</Label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Annuler</Button>
              <Button type="submit">{editingId ? "Mettre à jour" : "Ajouter"}</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Liste des articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map(article => (
          <Card key={article.id} className={`p-4 bg-white/80 backdrop-blur ${article.stock < 10 ? "border-2 border-amber-500" : ""}`}>
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
                <span>Bar: {article.priceBar.toLocaleString()} FCFA</span>
                <span>Snackbar: {article.priceSnackbar.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stock:</span>
                <span className={`font-semibold ${article.stock < 10 ? "text-amber-600" : "text-foreground"}`}>{article.stock} {article.unit}</span>
              </div>
            </div>

            {isManager && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(article)} className="flex-1">
                  <Edit className="w-4 h-4 mr-1" /> Modifier
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(article.id)} className="flex-1">
                  <Trash2 className="w-4 h-4 mr-1" /> Supprimer
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
