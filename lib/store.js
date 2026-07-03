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

// ---- 認領 BNI 官方會員資料 ----
// 找出目前是誰認領了這筆 BNI 資料（若有）
export async function findProfileByClaimedBniId(bniId) {
  const snap = await db.collection("profiles").where("claimedBniId", "==", bniId).limit(1).get();
  return snap.empty ? null : snap.docs[0].data();
}

// 認領：用 transaction 避免兩人同時搶認領同一筆資料
// gainsData：官方有填的九宮格欄位，直接覆蓋進使用者 profile（呼叫端負責組好要覆蓋的欄位）
export async function claimBniMember(userId, bniId, gainsData = {}) {
  const profileRef = db.collection("profiles").doc(userId);
  return db.runTransaction(async (tx) => {
    const existing = await tx.get(
      db.collection("profiles").where("claimedBniId", "==", bniId).limit(1)
    );
    if (!existing.empty && existing.docs[0].id !== userId) {
      throw new Error("此資料已被其他會員認領");
    }
    tx.set(
      profileRef,
      { ...gainsData, claimedBniId: bniId, claimedAt: new Date().toISOString(), userId },
      { merge: true }
    );
  });
}

export async function unclaimBniMember(userId) {
  const ref = db.collection("profiles").doc(userId);
  await ref.set({ claimedBniId: null, claimedAt: null }, { merge: true });
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
