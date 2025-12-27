import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';

// 將 Firestore Timestamp 轉換為 Date
export const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

// 將 Date 轉換為 Firestore Timestamp
export const convertToTimestamp = (date: Date | string): Timestamp => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return Timestamp.fromDate(dateObj);
};

// 通用：獲取單個文檔
export async function getDocument<T>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

// 通用：獲取多個文檔
export async function getDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

// 通用：創建文檔
export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const collectionRef = collection(db, collectionName);
    const now = Timestamp.now();
    
    const docData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collectionRef, docData);
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
}

// 過濾掉 undefined 值
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

// 通用：更新文檔
export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
  data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    // 過濾掉 undefined 值，因為 Firestore 不允許 undefined
    const cleanedData = removeUndefined(data);
    await updateDoc(docRef, {
      ...cleanedData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

// 通用：刪除文檔
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

// 導出常用的查詢輔助函數
export { where, orderBy, limit, query };

