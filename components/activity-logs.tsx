"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clock, Activity, Calendar, Filter } from "lucide-react"

interface ActivityLog {
  role: string
  timestamp: string
  action: string
  details?: string
}

interface Employee {
  id: string
  name: string
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    loadLogs()
    loadEmployees()
  }, [])

  const loadLogs = () => {
    const savedLogs = localStorage.getItem("activity_logs")
    if (savedLogs) {
      const parsedLogs = JSON.parse(savedLogs)
      setLogs(parsedLogs.reverse())
    }
  }

  const loadEmployees = () => {
    const stored = localStorage.getItem("bar_employees")
    if (stored) {
      setEmployees(JSON.parse(stored))
    }
  }

  const filteredLogs = filter === "all" ? logs : logs.filter((log) => log.role === filter)

  const getRoleName = (role: string) => {
    switch (role) {
      case "patron":
        return "Patron"
      case "gerante1":
        return "Gérante 1"
      case "gerante2":
        return "Gérante 2"
      default:
        const employee = employees.find((e) => e.id === role)
        return employee ? employee.name : role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "patron":
        return "bg-accent text-accent-foreground"
      case "gerante1":
        return "bg-primary text-primary-foreground"
      case "gerante2":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const clearLogs = () => {
    if (confirm("Êtes-vous sûr de vouloir effacer tous les logs ?")) {
      localStorage.setItem("activity_logs", "[]")
      setLogs([])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-balance">Journal d'activité</h2>
          <p className="text-muted-foreground text-sm mt-1">Historique des connexions et actions</p>
        </div>
        <Button onClick={clearLogs} variant="destructive" size="sm">
          Effacer les logs
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setFilter("all")}
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Tous
        </Button>
        <Button onClick={() => setFilter("patron")} variant={filter === "patron" ? "default" : "outline"} size="sm">
          Patron
        </Button>
        <Button onClick={() => setFilter("gerante1")} variant={filter === "gerante1" ? "default" : "outline"} size="sm">
          Gérante 1
        </Button>
        <Button onClick={() => setFilter("gerante2")} variant={filter === "gerante2" ? "default" : "outline"} size="sm">
          Gérante 2
        </Button>
        {employees.map((employee) => (
          <Button
            key={employee.id}
            onClick={() => setFilter(employee.name)}
            variant={filter === employee.name ? "default" : "outline"}
            size="sm"
          >
            {employee.name}
          </Button>
        ))}
      </div>

      <div className="grid gap-3">
        {filteredLogs.length === 0 ? (
          <Card className="p-8 text-center">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucune activité enregistrée</p>
          </Card>
        ) : (
          filteredLogs.map((log, index) => (
            <Card key={index} className="p-4 hover:bg-accent/5 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(log.role)} w-fit`}>
                  {getRoleName(log.role)}
                </div>

                <div className="flex-1 space-y-1">
                  <p className="font-medium">{log.action}</p>
                  {log.details && <p className="text-sm text-muted-foreground">{log.details}</p>}
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(log.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
