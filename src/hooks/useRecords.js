import { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, onSnapshot, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'animalFeeds';

export function useRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Show all records including older/expired validity entries.
        // LTO status is already represented by the `lto` field.
        setRecords(all);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const addRecord = useCallback(async (data) => {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }, []);

  const updateRecord = useCallback(async (id, data) => {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }, []);

  const deleteRecord = useCallback(async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }, []);

  const bulkImportRecords = useCallback(async (rows, { chunkSize = 400, onProgress } = {}) => {
    if (!Array.isArray(rows) || rows.length === 0) return { imported: 0 };

    let imported = 0;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = rows.slice(i, i + chunkSize);

      const colRef = collection(db, COLLECTION);
      chunk.forEach((data) => {
        const ref = doc(colRef); // auto id
        batch.set(ref, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      imported += chunk.length;
      onProgress?.({ imported, total: rows.length, currentChunk: Math.floor(i / chunkSize) + 1 });
    }

    return { imported };
  }, []);

  return {
    records,
    loading,
    error,
    addRecord,
    updateRecord,
    deleteRecord,
    bulkImportRecords,
  };
}

function isExpiredByValidity(validity) {
  if (!validity) return false;
  const date = parseFlexibleDate(validity);
  if (!date) return false;
  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function parseFlexibleDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string') {
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const dd = m[1].padStart(2, '0');
      const mm = m[2].padStart(2, '0');
      const yy = m[3];
      const iso = new Date(`${yy}-${mm}-${dd}`);
      if (!Number.isNaN(iso.getTime())) return iso;
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
