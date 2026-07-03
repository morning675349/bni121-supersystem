// 資料儲存層：profiles / invitations 存 Firestore；使用者身分交給 Firebase Auth
import { db, adminAuth } from "./firebaseAdmin.js";

// ---- Users（Firebase Auth，非 Firestore）----
export async function findUserById(id) {
  try {
    const u = await adminAuth.getUser(id);
    return { id: u.uid, name: u.displayName || "", email: u.email };
  } catch {
    return null;
  }
}

// ---- Profiles（九宮格）----  doc id = userId
export async function getProfile(userId) {
  const snap = await db.collection("profiles").doc(userId).get();
  return snap.exists ? snap.data() : null;
}

export async function saveProfile(userId, profile) {
  const ref = db.collection("profiles").doc(userId);
  await ref.set({ ...profile, userId, updatedAt: new Date().toISOString() }, { merge: true });
  const snap = await ref.get();
  return snap.data();
}

export async function allProfiles() {
  const snap = await db.collection("profiles").get();
  return snap.docs.map((d) => d.data());
}

// ---- Invitations（121 邀約）----
export async function createInvitation({ fromUserId, toUserId, message }) {
  const ref = db.collection("invitations").doc();
  const inv = {
    id: ref.id,
    fromUserId,
    toUserId,
    message: message || "",
    status: "pending", // pending | accepted | declined | completed
    note: "",
    createdAt: new Date().toISOString(),
  };
  await ref.set(inv);
  return inv;
}

export async function updateInvitation(id, patch) {
  const ref = db.collection("invitations").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.set({ ...patch, updatedAt: new Date().toISOString() }, { merge: true });
  const updated = await ref.get();
  return updated.data();
}

export async function invitationsFor(userId) {
  // Firestore 對「A欄=x OR B欄=x」沒有單一查詢語法，分兩次查再合併去重
  const [fromSnap, toSnap] = await Promise.all([
    db.collection("invitations").where("fromUserId", "==", userId).get(),
    db.collection("invitations").where("toUserId", "==", userId).get(),
  ]);
  const seen = new Map();
  for (const d of [...fromSnap.docs, ...toSnap.docs]) seen.set(d.id, d.data());
  return [...seen.values()];
}
