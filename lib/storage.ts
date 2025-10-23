import type { Article, Table, Payment, Employee, ActivityLog } from "./types"

const STORAGE_KEYS = {
  ARTICLES: "bar_articles",
  TABLES: "bar_tables",
  PAYMENTS: "bar_payments",
  EMPLOYEES: "bar_employees",
  ACTIVITY_LOGS: "activity_logs",
  MODE: "bar_mode",
  STOCK_SNAPSHOT: "bar_stock_snapshot",
} as const

// Articles
export const getArticles = (): Article[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.ARTICLES)
  return stored ? JSON.parse(stored) : []
}

export const saveArticles = (articles: Article[]): void => {
  localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles))
}

// Tables
export const getTables = (): Table[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.TABLES)
  return stored ? JSON.parse(stored) : []
}

export const saveTables = (tables: Table[]): void => {
  localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables))
}

// Payments
export const getPayments = (): Payment[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.PAYMENTS)
  return stored ? JSON.parse(stored) : []
}

export const savePayments = (payments: Payment[]): void => {
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments))
}

export const addPayment = (payment: Payment): void => {
  const payments = getPayments()
  payments.push(payment)
  savePayments(payments)
}

// Employees
export const getEmployees = (): Employee[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.EMPLOYEES)
  return stored ? JSON.parse(stored) : []
}

export const saveEmployees = (employees: Employee[]): void => {
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees))
}

// Activity Logs
export const getActivityLogs = (): ActivityLog[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)
  return stored ? JSON.parse(stored) : []
}

export const saveActivityLogs = (logs: ActivityLog[]): void => {
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs))
}

export const addActivityLog = (log: ActivityLog): void => {
  const logs = getActivityLogs()
  logs.push(log)
  saveActivityLogs(logs)
}

// Mode
export const getMode = (): "bar" | "snackbar" => {
  const stored = localStorage.getItem(STORAGE_KEYS.MODE)
  return stored === "snackbar" ? "snackbar" : "bar"
}

export const saveMode = (mode: "bar" | "snackbar"): void => {
  localStorage.setItem(STORAGE_KEYS.MODE, mode)
}

// Stock Snapshot
export const getStockSnapshot = (): Record<string, Record<string, number>> => {
  const stored = localStorage.getItem(STORAGE_KEYS.STOCK_SNAPSHOT)
  return stored ? JSON.parse(stored) : {}
}

export const saveStockSnapshot = (snapshot: Record<string, Record<string, number>>): void => {
  localStorage.setItem(STORAGE_KEYS.STOCK_SNAPSHOT, JSON.stringify(snapshot))
}

// User helpers
export const getUserDisplayName = (userId: string): string => {
  if (userId === "patron") return "Patron"
  if (userId === "gerante1") return "Gérante 1"
  if (userId === "gerante2") return "Gérante 2"

  const employees = getEmployees()
  const employee = employees.find((e) => e.id === userId)
  return employee ? employee.name : "Inconnu"
}

export const isManager = (userId: string | null): boolean => {
  return userId === "patron" || userId === "gerante1" || userId === "gerante2"
}

export const isEmployee = (userId: string | null): boolean => {
  if (!userId) return false
  const employees = getEmployees()
  return employees.some((e) => e.id === userId)
}
