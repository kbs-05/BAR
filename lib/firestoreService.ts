// lib/firestoreService.ts
import { db } from "./firebase"
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  DocumentData,
  WithFieldValue,
  Unsubscribe,
} from "firebase/firestore"

/**
 * ➕ Ajouter un document dans une collection
 */
export const addData = async <T extends WithFieldValue<DocumentData>>(
  collectionName: string,
  data: T
): Promise<string | null> => {
  try {
    const colRef = collection(db, collectionName)
    const docRef = await addDoc(colRef, data)
    return docRef.id
  } catch (error) {
    console.error("🔥 Erreur ajout:", error)
    return null
  }
}

/**
 * 📦 Récupérer tous les documents d'une collection
 */
export const getData = async <T = DocumentData>(
  collectionName: string
): Promise<Array<T & { id: string }>> => {
  try {
    const colRef = collection(db, collectionName)
    const snapshot = await getDocs(colRef)
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as T),
    }))
  } catch (error) {
    console.error("🔥 Erreur récupération:", error)
    return []
  }
}

/**
 * 🔍 Récupérer un document spécifique par son ID
 */
export const getDataById = async <T = DocumentData>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> => {
  try {
    const docRef = doc(db, collectionName, docId)
    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) return null
    return { id: snapshot.id, ...(snapshot.data() as T) }
  } catch (error) {
    console.error("🔥 Erreur doc spécifique:", error)
    return null
  }
}

/**
 * ✏️ Mettre à jour un document
 */
export const updateData = async <T extends Partial<DocumentData>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<boolean> => {
  try {
    const docRef = doc(db, collectionName, docId)
    await updateDoc(docRef, data)
    return true
  } catch (error) {
    console.error("🔥 Erreur update:", error)
    return false
  }
}

/**
 * ❌ Supprimer un document
 */
export const deleteData = async (
  collectionName: string,
  docId: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, collectionName, docId)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error("🔥 Erreur suppression:", error)
    return false
  }
}

/**
 * 🎯 Récupérer les documents filtrés par un champ
 */
export const getFilteredData = async <T = DocumentData>(
  collectionName: string,
  fieldName: keyof T,
  value: any
): Promise<Array<T & { id: string }>> => {
  try {
    const colRef = collection(db, collectionName)
    const q = query(colRef, where(fieldName as string, "==", value))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as T),
    }))
  } catch (error) {
    console.error("🔥 Erreur récupération filtrée:", error)
    return []
  }
}

/**
 * 📊 Récupérer les documents triés par un champ
 */
export const getOrderedData = async <T = DocumentData>(
  collectionName: string,
  fieldName: keyof T,
  order: "asc" | "desc" = "asc"
): Promise<Array<T & { id: string }>> => {
  try {
    const colRef = collection(db, collectionName)
    const q = query(colRef, orderBy(fieldName as string, order))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as T),
    }))
  } catch (error) {
    console.error("🔥 Erreur récupération triée:", error)
    return []
  }
}

/* ----------------------------------------------------------
   🔁 TEMPS RÉEL (onSnapshot)
---------------------------------------------------------- */

/**
 * 🔥 Écoute en temps réel d'une collection Firestore
 * @param collectionName Nom de la collection
 * @param callback Fonction appelée à chaque mise à jour
 * @returns Unsubscribe (pour arrêter l’écoute)
 */
export const listenToCollection = <T = DocumentData>(
  collectionName: string,
  callback: (data: Array<T & { id: string }>) => void
): Unsubscribe => {
  const colRef = collection(db, collectionName)
  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const docs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as T),
      }))
      callback(docs)
    },
    (error) => {
      console.error("🔥 Erreur écoute collection:", error)
    }
  )
  return unsubscribe
}

/**
 * 🔥 Écoute en temps réel d’un document Firestore
 * @param collectionName Nom de la collection
 * @param docId ID du document
 * @param callback Fonction appelée à chaque mise à jour
 * @returns Unsubscribe (pour arrêter l’écoute)
 */
export const listenToDocument = <T = DocumentData>(
  collectionName: string,
  docId: string,
  callback: (data: (T & { id: string }) | null) => void
): Unsubscribe => {
  const docRef = doc(db, collectionName, docId)
  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...(snapshot.data() as T) })
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error("🔥 Erreur écoute document:", error)
    }
  )
  return unsubscribe
}
