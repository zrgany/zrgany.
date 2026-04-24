// src/services/ratingService.js
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

// ➤ إضافة تقييم
export const addRating = async ({ fromUserId, toUserId, jobId, rating, comment }) => {
  if (!fromUserId || !toUserId || !rating) return;

  // 1. حفظ التقييم
  await addDoc(collection(db, 'ratings'), {
    fromUserId,
    toUserId,
    jobId: jobId || null,
    rating: Number(rating),
    comment: comment || '',
    createdAt: serverTimestamp(),
  });

  // 2. إعادة حساب التقييم بشكل آمن
  const q = query(
    collection(db, 'ratings'),
    where('toUserId', '==', toUserId)
  );

  const snapshot = await getDocs(q);

  const ratings = snapshot.docs
    .map(d => Number(d.data().rating))
    .filter(r => !isNaN(r));

  if (ratings.length === 0) return;

  const sum = ratings.reduce((a, b) => a + b, 0);
  const avg = sum / ratings.length;

  // 3. تحديث المستخدم
  await updateDoc(doc(db, 'users', toUserId), {
    rating: Math.round(avg * 10) / 10,
    ratingCount: ratings.length,
  });
};

// ➤ جلب تقييمات مستخدم
export const getUserRatings = async (userId) => {
  if (!userId) return [];

  const q = query(
    collection(db, 'ratings'),
    where('toUserId', '==', userId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};
