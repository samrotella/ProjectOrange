import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Building } from '../types'

const COL = 'buildings'

function fromFirestore(id: string, data: Record<string, unknown>): Building {
  return {
    ...(data as Omit<Building, 'id' | 'createdAt' | 'updatedAt'>),
    id,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : String(data.createdAt ?? ''),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : String(data.updatedAt ?? ''),
  }
}

export async function getBuildings(orgId: string): Promise<Building[]> {
  const q = query(collection(db, COL), where('orgId', '==', orgId))
  const snap = await getDocs(q)
  return snap.docs.map(d => fromFirestore(d.id, d.data() as Record<string, unknown>))
}

export async function getBuilding(id: string): Promise<Building | null> {
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return fromFirestore(snap.id, snap.data() as Record<string, unknown>)
}

export async function createBuilding(data: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return ref.id
}

export async function updateBuilding(id: string, data: Partial<Building>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteBuilding(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
