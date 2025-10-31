'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"

// --- Types ---
interface Employee {
  id: string
  name: string
  code: string
}

interface LoginProps {
  onLogin: (role: string) => void
}

interface AccessCodes {
  patron: string
  gerante1: string
  gerante2: string
}

interface ActivityLog {
  role: string
  action: string
  timestamp: string
}

// --- Composant ---
export default function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])

  // --- Charger les employés depuis Firestore ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const snapshot = await getDoc(doc(db, "bar_data", "employees"))
        if (snapshot.exists()) {
          const data = snapshot.data() as { list: Employee[] }
          setEmployees(data.list || [])
        }
      } catch (err) {
        console.error("Erreur chargement employés:", err)
      }
    }
    fetchEmployees()
  }, [])

  // --- Rôles prédéfinis ---
  const roles = [
    { id: "patron" as const, name: "Patron", color: "bg-accent" },
    { id: "gerante1" as const, name: "Gérante 1", color: "bg-primary" },
    { id: "gerante2" as const, name: "Gérante 2", color: "bg-secondary" },
  ]

  // Codes par défaut si pas en base
  const defaultCodes: AccessCodes = {
    patron: "123456",
    gerante1: "111111",
    gerante2: "222222",
  }

  // --- Gestion du login ---
  const handleLogin = async () => {
    if (!selectedRole) {
      setError("Veuillez sélectionner un rôle")
      return
    }

    if (code.length !== 6) {
      setError("Le code doit contenir 6 chiffres")
      return
    }

    setLoading(true) // Démarre le loader
    let valid = false

    try {
      if (["patron", "gerante1", "gerante2"].includes(selectedRole)) {
        // Vérification des codes Firestore ou défaut
        const docRef = doc(db, "bar_data", "access_codes")
        const snapshot = await getDoc(docRef)
        const codes: AccessCodes = snapshot.exists()
          ? (snapshot.data() as AccessCodes)
          : defaultCodes
        if (code === codes[selectedRole as keyof AccessCodes]) valid = true
      } else {
        // Vérification des employés
        const employee = employees.find((e) => e.id === selectedRole)
        if (employee && code === employee.code) valid = true
      }

      if (valid) {
        await logActivity(selectedRole, "Connexion")
        setError("")
        onLogin(selectedRole)
      } else {
        setError("Code incorrect")
      }
    } catch (err) {
      console.error("Erreur connexion:", err)
      setError("Erreur lors de la connexion.")
    } finally {
      setLoading(false) // Arrête le loader
    }
  }

  // --- Log activité ---
  const logActivity = async (role: string, action: string) => {
    const logRef = doc(db, "bar_data", "activity_logs")
    const snapshot = await getDoc(logRef)
    const existingLogs: ActivityLog[] = snapshot.exists()
      ? (snapshot.data().logs as ActivityLog[] || [])
      : []
    const newLogs: ActivityLog[] = [
      ...existingLogs,
      { role, action, timestamp: new Date().toISOString() },
    ]
    await setDoc(logRef, { logs: newLogs })
  }

  // --- Gestion du champ code ---
  const handleCodeChange = (value: string) => {
    if (/^\d*$/.test(value) && value.length <= 6) {
      setCode(value)
      setError("")
    }
  }

  // --- UI ---
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
                  {roles.find((r) => r.id === selectedRole)?.name ||
                    employees.find((e) => e.id === selectedRole)?.name}
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

              <Button
                onClick={handleLogin}
                className="w-full h-12 text-lg flex items-center justify-center gap-2"
                disabled={loading || code.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
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
