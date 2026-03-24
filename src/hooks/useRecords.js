import { useState, useEffect, useCallback } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'animalFeeds';

export function useRecords() {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const allRecords = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Hide expired records from the UI based on validity date.
      const activeRecords = allRecords.filter(r => !isExpiredByValidity(r.validity));
      setRecords(activeRecords);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const addRecord = useCallback(async (data) => {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await fetchRecords();
    return docRef.id;
  }, [fetchRecords]);

  const updateRecord = useCallback(async (id, data) => {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    await fetchRecords();
  }, [fetchRecords]);

  const deleteRecord = useCallback(async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
    await fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, fetchRecords, addRecord, updateRecord, deleteRecord };
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
