export interface Article {
  id: string
  name: string
  category: string
  priceBar: number
  priceSnackbar: number
  stock: number
  unit: string
}

export interface OrderItem {
  articleId: string
  articleName: string
  quantity: number
  price: number
}

export interface Table {
  id: string
  name: string
  status: "available" | "occupied"
  orders: OrderItem[]
  total: number
}

export interface Payment {
  id: string
  tableName: string
  amount: number
  items: OrderItem[]
  mode: "bar" | "snackbar"
  recordedBy: string
  date: string
}

export interface Employee {
  id: string
  name: string
  code: string
  workMode: "bar" | "snackbar"
  createdAt: string
  createdBy: string
}

export interface ActivityLog {
  role: string
  timestamp: string
  action: string
  details?: string
}

export type UserRole = "patron" | "gerante1" | "gerante2" | string

export type AppMode = "bar" | "snackbar"
