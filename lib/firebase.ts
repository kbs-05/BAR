// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"
import { getAuth } from "firebase/auth"

/**
 * ⚡ Configuration Firebase
 * (Remplace les valeurs si besoin)
 */
const firebaseConfig = {
  apiKey: "AIzaSyCrd4uyS-fPFrcyevSan47Pb6xfYa7pQno",
  authDomain: "bar1-30abd.firebaseapp.com",
  projectId: "bar1-30abd",
  storageBucket: "bar1-30abd.firebasestorage.app",
  messagingSenderId: "780516656883",
  appId: "1:780516656883:web:2ff11d9d7c3bfab8c99986",
  measurementId: "G-HFFN88YYRY",
}

/**
 * ⚙️ Initialise Firebase (évite l’erreur “App already exists”)
 */
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

/**
 * 🔥 Firestore + activation du cache local (mode offline)
 */
export const db = getFirestore(app)

// ✅ Active la persistance locale pour que Firestore fonctionne hors ligne
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("⚠️ Persistance désactivée : plusieurs onglets ouverts.")
  } else if (err.code === "unimplemented") {
    console.warn("⚠️ Persistance non supportée sur ce navigateur.")
  } else {
    console.error("Erreur d’activation de la persistance Firestore:", err)
  }
})

/**
 * 🔐 Authentification Firebase
 */
export const auth = getAuth(app)
