import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Asset } from '../types'

const COL = 'assets'

function fromFirestore(id: string, data: Record<string, unknown>): Asset {
  return {
    ...(data as Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>),
    id,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : String(data.createdAt ?? ''),
    updatedAt: data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate().toISOString()
      : String(data.updatedAt ?? ''),
  }
}

export async function getAssets(orgId: string, buildingId?: string): Promise<Asset[]> {
  let q = query(collection(db, COL), where('orgId', '==', orgId))
  if (buildingId) q = query(collection(db, COL), where('orgId', '==', orgId), where('buildingId', '==', buildingId))
  const snap = await getDocs(q)
  return snap.docs.map(d => fromFirestore(d.id, d.data() as Record<string, unknown>))
}

export async function getAsset(id: string): Promise<Asset | null> {
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return fromFirestore(snap.id, snap.data() as Record<string, unknown>)
}

export async function createAsset(data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateAsset(id: string, data: Partial<Asset>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteAsset(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
