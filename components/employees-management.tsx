"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Trash2, Users, Sun, Moon } from "lucide-react"

interface Employee {
  id: string
  name: string
  code: string
  workMode: "bar" | "snackbar" // Added work mode field
  createdBy: string
  createdAt: string
}

interface EmployeesManagementProps {
  currentUser: "patron" | "gerante1" | "gerante2"
  logActivity: (action: string, details?: string) => void
}

export default function EmployeesManagement({ currentUser, logActivity }: EmployeesManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [employeeLogs, setEmployeeLogs] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    workMode: "bar" as "bar" | "snackbar", // Added work mode to form
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = () => {
    const stored = localStorage.getItem("bar_employees")
    if (stored) {
      setEmployees(JSON.parse(stored))
    }
  }

  const saveEmployees = (updatedEmployees: Employee[]) => {
    localStorage.setItem("bar_employees", JSON.stringify(updatedEmployees))
    setEmployees(updatedEmployees)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.code.length !== 6 || !/^\d+$/.test(formData.code)) {
      alert("Le code doit contenir exactement 6 chiffres")
      return
    }

    // Check if code already exists
    const allCodes = [...employees.map((e) => e.code), "123456", "111111", "222222"]
    if (allCodes.includes(formData.code)) {
      alert("Ce code est déjà utilisé")
      return
    }

    const newEmployee: Employee = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      code: formData.code,
      workMode: formData.workMode, // Save work mode
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
    }

    const updatedEmployees = [...employees, newEmployee]
    saveEmployees(updatedEmployees)

    logActivity(
      "Ajout d'employé",
      `Serveuse "${formData.name}" ajoutée avec le code ${formData.code} (${formData.workMode === "bar" ? "Bar - Journée" : "Snackbar - Soirée"})`,
    )

    setFormData({ name: "", code: "", workMode: "bar" })
    setIsAddFormOpen(false)
  }

  const deleteEmployee = (id: string) => {
    const employee = employees.find((e) => e.id === id)
    if (!employee) return

    if (confirm(`Êtes-vous sûr de vouloir supprimer ${employee.name} ?`)) {
      const updatedEmployees = employees.filter((e) => e.id !== id)
      saveEmployees(updatedEmployees)

      logActivity("Suppression d'employé", `Serveuse "${employee.name}" supprimée`)
    }
  }

  const loadEmployeeActivities = (employeeId: string) => {
    const allLogs = JSON.parse(localStorage.getItem("activity_logs") || "[]")
    const filtered = allLogs.filter((log: any) => log.role === employeeId).reverse()
    setEmployeeLogs(filtered)
  }

  const viewEmployeeDetails = (employee: Employee) => {
    setSelectedEmployee(employee)
    loadEmployeeActivities(employee.id)
  }

  const getCreatorName = (creator: string) => {
    switch (creator) {
      case "patron":
        return "Patron"
      case "gerante1":
        return "Gérante 1"
      case "gerante2":
        return "Gérante 2"
      default:
        return creator
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-balance">Gestion des employés</h2>
          <p className="text-muted-foreground text-sm mt-1">Ajouter et gérer les serveuses</p>
        </div>
        <Button onClick={() => setIsAddFormOpen(!isAddFormOpen)} className="w-full sm:w-auto">
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter une serveuse
        </Button>
      </div>

      {selectedEmployee && (
        <Card className="p-6 bg-card border-2 border-primary">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">{selectedEmployee.name}</h3>
              <p className="text-sm text-muted-foreground">Code: {selectedEmployee.code}</p>
              <div className="flex items-center gap-1 mt-1">
                {selectedEmployee.workMode === "bar" ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500" />
                )}
                <span className="text-sm text-muted-foreground">
                  {selectedEmployee.workMode === "bar" ? "Bar - Journée" : "Snackbar - Soirée"}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedEmployee(null)}>
              Fermer
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Activités récentes</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {employeeLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune activité enregistrée</p>
              ) : (
                employeeLogs.map((log, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg text-sm">
                    <p className="font-medium">{log.action}</p>
                    {log.details && <p className="text-muted-foreground text-xs mt-1">{log.details}</p>}
                    <p className="text-muted-foreground text-xs mt-1">
                      {new Date(log.timestamp).toLocaleString("fr-FR")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      )}

      {isAddFormOpen && (
        <Card className="p-6 bg-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la serveuse</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Marie Dupont"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code d'identification (6 chiffres)</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                value={formData.code}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value) && e.target.value.length <= 6) {
                    setFormData({ ...formData, code: e.target.value })
                  }
                }}
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Mode de travail</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, workMode: "bar" })}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    formData.workMode === "bar"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Bar</div>
                    <div className="text-xs opacity-70">Journée</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, workMode: "snackbar" })}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    formData.workMode === "snackbar"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Snackbar</div>
                    <div className="text-xs opacity-70">Soirée</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddFormOpen(false)} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" className="flex-1">
                Ajouter
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {employees.length === 0 ? (
          <Card className="p-8 text-center col-span-full">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucune serveuse enregistrée</p>
          </Card>
        ) : (
          employees.map((employee) => (
            <Card
              key={employee.id}
              className="p-4 hover:bg-accent/5 transition-colors cursor-pointer"
              onClick={() => viewEmployeeDetails(employee)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{employee.name}</h3>
                  <p className="text-sm text-muted-foreground">Code: {employee.code}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {employee.workMode === "bar" ? (
                      <Sun className="w-3 h-3 text-amber-500" />
                    ) : (
                      <Moon className="w-3 h-3 text-indigo-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {employee.workMode === "bar" ? "Bar - Journée" : "Snackbar - Soirée"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation() // Prevent card click when deleting
                    deleteEmployee(employee.id)
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Créé par: {getCreatorName(employee.createdBy)}</p>
                <p>Le: {new Date(employee.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
