import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

// ✅ Remplacement de Geist par Inter
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gestion de Bar - Gabon",
  description: "Système de gestion de bar avec double tarification (Bar/Snackbar)",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.className} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
