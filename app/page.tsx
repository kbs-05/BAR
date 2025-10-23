"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Package,
  Utensils,
  CreditCard,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  FileText,
  Users,
} from "lucide-react"
import Dashboard from "@/components/dashboard"
import ArticlesManagement from "@/components/articles-management"
import TablesManagement from "@/components/tables-management"
import PaymentsHistory from "@/components/payments-history"
import Login from "@/components/login"
import ActivityLogs from "@/components/activity-logs"
import EmployeesManagement from "@/components/employees-management"
import {
  getMode,
  saveMode,
  addActivityLog,
  isManager as checkIsManager,
  isEmployee as checkIsEmployee,
  getUserDisplayName,
} from "@/lib/storage"
import type { AppMode } from "@/lib/types"

export default function BarManagement() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [mode, setMode] = useState<AppMode>("bar")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setMode(getMode())
    const savedUser = sessionStorage.getItem("current_user")
    if (savedUser) {
      setCurrentUser(savedUser)
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (role: string) => {
    setCurrentUser(role)
    setIsAuthenticated(true)
    sessionStorage.setItem("current_user", role)
  }

  const handleLogout = () => {
    addActivityLog({
      role: currentUser || "unknown",
      timestamp: new Date().toISOString(),
      action: "Déconnexion",
    })

    setCurrentUser(null)
    setIsAuthenticated(false)
    sessionStorage.removeItem("current_user")
    setActiveSection("dashboard")
  }

  const logActivity = (action: string, details?: string) => {
    addActivityLog({
      role: currentUser || "unknown",
      timestamp: new Date().toISOString(),
      action,
      details,
    })
  }

  const toggleMode = () => {
    const newMode: AppMode = mode === "bar" ? "snackbar" : "bar"
    setMode(newMode)
    saveMode(newMode)
    logActivity(`Changement de mode`, `Passage en mode ${newMode === "bar" ? "Bar" : "Snackbar"}`)
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    setIsMobileMenuOpen(false)
    logActivity(`Navigation`, `Accès à la section ${section}`)
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  const isManager = checkIsManager(currentUser)
  const isEmployee = checkIsEmployee(currentUser)

  return (
    <div className="flex min-h-screen bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-card border border-border"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-border pt-16 lg:pt-6">
          <h1 className="text-2xl font-bold text-primary text-balance">Gestion de Bar</h1>
          <p className="text-muted-foreground text-sm mt-1">Gabon</p>
          <div className="mt-3 px-3 py-2 bg-accent/10 rounded-lg">
            <p className="text-xs text-muted-foreground">Connecté en tant que</p>
            <p className="text-sm font-semibold text-accent">{getUserDisplayName(currentUser || "")}</p>
          </div>
        </div>

        {!isEmployee && (
          <div className="p-4 border-b border-border">
            <Button onClick={toggleMode} variant="outline" className="w-full justify-between gap-2 h-12 bg-transparent">
              <span className="flex items-center gap-2">
                {mode === "bar" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span className="font-semibold">{mode === "bar" ? "Mode Bar" : "Mode Snackbar"}</span>
              </span>
              <span className="text-xs text-muted-foreground">{mode === "bar" ? "Journée" : "Soirée"}</span>
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {isManager && (
            <Button
              onClick={() => handleSectionChange("dashboard")}
              variant={activeSection === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start gap-3 h-12"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Tableau de bord</span>
            </Button>
          )}
          <Button
            onClick={() => handleSectionChange("articles")}
            variant={activeSection === "articles" ? "default" : "ghost"}
            className="w-full justify-start gap-3 h-12"
          >
            <Package className="w-5 h-5" />
            <span>Articles</span>
          </Button>
          <Button
            onClick={() => handleSectionChange("tables")}
            variant={activeSection === "tables" ? "default" : "ghost"}
            className="w-full justify-start gap-3 h-12"
          >
            <Utensils className="w-5 h-5" />
            <span>Tables</span>
          </Button>
          {isManager && (
            <>
              <Button
                onClick={() => handleSectionChange("payments")}
                variant={activeSection === "payments" ? "default" : "ghost"}
                className="w-full justify-start gap-3 h-12"
              >
                <CreditCard className="w-5 h-5" />
                <span>Paiements</span>
              </Button>
              <Button
                onClick={() => handleSectionChange("employees")}
                variant={activeSection === "employees" ? "default" : "ghost"}
                className="w-full justify-start gap-3 h-12"
              >
                <Users className="w-5 h-5" />
                <span>Employés</span>
              </Button>
            </>
          )}
          {currentUser === "patron" && (
            <Button
              onClick={() => handleSectionChange("logs")}
              variant={activeSection === "logs" ? "default" : "ghost"}
              className="w-full justify-start gap-3 h-12"
            >
              <FileText className="w-5 h-5" />
              <span>Journal d'activité</span>
            </Button>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          <Button onClick={handleLogout} variant="outline" className="w-full justify-start gap-3 h-12 bg-transparent">
            <LogOut className="w-5 h-5" />
            <span>Se déconnecter</span>
          </Button>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Version 1.0</p>
            <p className="text-xs text-muted-foreground mt-1">Système de gestion</p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pt-20 lg:pt-8">
          {activeSection === "dashboard" && isManager && (
            <Dashboard mode={mode} currentUser={currentUser || undefined} />
          )}
          {activeSection === "articles" && (
            <ArticlesManagement mode={mode} logActivity={logActivity} currentUser={currentUser} />
          )}
          {activeSection === "tables" && (
            <TablesManagement mode={mode} logActivity={logActivity} currentUser={currentUser} />
          )}
          {activeSection === "payments" && isManager && <PaymentsHistory mode={mode} />}
          {activeSection === "employees" && isManager && (
            <EmployeesManagement
              currentUser={currentUser as "patron" | "gerante1" | "gerante2"}
              logActivity={logActivity}
            />
          )}
          {activeSection === "logs" && currentUser === "patron" && <ActivityLogs />}
        </div>
      </main>
    </div>
  )
}
