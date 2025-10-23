"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"

interface Employee {
  id: string
  name: string
  code: string
}

interface LoginProps {
  onLogin: (role: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("bar_employees")
    if (stored) {
      setEmployees(JSON.parse(stored))
    }
  }, [])

  const roles = [
    { id: "patron" as const, name: "Patron", color: "bg-accent" },
    { id: "gerante1" as const, name: "Gérante 1", color: "bg-primary" },
    { id: "gerante2" as const, name: "Gérante 2", color: "bg-secondary" },
  ]

  const defaultCodes = {
    patron: "123456",
    gerante1: "111111",
    gerante2: "222222",
  }

  const handleLogin = () => {
    if (!selectedRole) {
      setError("Veuillez sélectionner un rôle")
      return
    }

    if (code.length !== 6) {
      setError("Le code doit contenir 6 chiffres")
      return
    }

    if (selectedRole === "patron" || selectedRole === "gerante1" || selectedRole === "gerante2") {
      const savedCodes = localStorage.getItem("access_codes")
      const codes = savedCodes ? JSON.parse(savedCodes) : defaultCodes

      if (code === codes[selectedRole]) {
        const loginLog = {
          role: selectedRole,
          timestamp: new Date().toISOString(),
          action: "Connexion",
        }

        const logs = JSON.parse(localStorage.getItem("activity_logs") || "[]")
        logs.push(loginLog)
        localStorage.setItem("activity_logs", JSON.stringify(logs))

        onLogin(selectedRole)
        setError("")
        return
      }
    } else {
      const employee = employees.find((e) => e.id === selectedRole)
      if (employee && code === employee.code) {
        const loginLog = {
          role: employee.name,
          timestamp: new Date().toISOString(),
          action: "Connexion",
        }

        const logs = JSON.parse(localStorage.getItem("activity_logs") || "[]")
        logs.push(loginLog)
        localStorage.setItem("activity_logs", JSON.stringify(logs))

        onLogin(selectedRole)
        setError("")
        return
      }
    }

    setError("Code incorrect")
  }

  const handleCodeChange = (value: string) => {
    if (/^\d*$/.test(value) && value.length <= 6) {
      setCode(value)
      setError("")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-lg">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2 text-balance">Gestion de Bar</h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">Gabon - Authentification</p>

          {!selectedRole ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">Sélectionnez votre rôle :</p>
              {roles.map((role) => (
                <Button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  variant="outline"
                  className="w-full h-14 text-lg justify-start gap-3 hover:bg-accent/10"
                >
                  <div className={`w-3 h-3 rounded-full ${role.color}`} />
                  {role.name}
                </Button>
              ))}

              {employees.length > 0 && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Serveuses</span>
                    </div>
                  </div>
                  {employees.map((employee) => (
                    <Button
                      key={employee.id}
                      onClick={() => setSelectedRole(employee.id)}
                      variant="outline"
                      className="w-full h-14 text-lg justify-start gap-3 hover:bg-accent/10"
                    >
                      <div className="w-3 h-3 rounded-full bg-muted" />
                      {employee.name}
                    </Button>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {roles.find((r) => r.id === selectedRole)?.name || employees.find((e) => e.id === selectedRole)?.name}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedRole(null)
                    setCode("")
                    setError("")
                  }}
                >
                  Changer
                </Button>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Code à 6 chiffres</label>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest h-14"
                  maxLength={6}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-destructive text-sm text-center">{error}</p>
                </div>
              )}

              <Button onClick={handleLogin} className="w-full h-12 text-lg" disabled={code.length !== 6}>
                Se connecter
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Codes par défaut : Patron (123456), Gérante 1 (111111), Gérante 2 (222222)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
