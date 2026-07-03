import { getSessionUser } from "@/lib/auth.js";
import { invitationsFor, findUserById } from "@/lib/store.js";
import InvitationList from "@/components/InvitationList.js";

export const dynamic = "force-dynamic";

export default async function InvitationsPage() {
  const user = await getSessionUser();
  const raw = (await invitationsFor(user.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // 去重批次查詢對方姓名，避免對同一 uid 重複呼叫 Firebase Auth
  const uids = [...new Set(raw.flatMap((inv) => [inv.fromUserId, inv.toUserId]))];
  const nameByUid = new Map();
  await Promise.all(
    uids.map(async (uid) => {
      const u = await findUserById(uid);
      nameByUid.set(uid, u?.name || "（會員）");
    })
  );

  const invitations = raw.map((inv) => ({
    ...inv,
    direction: inv.toUserId === user.id ? "received" : "sent",
    fromName: nameByUid.get(inv.fromUserId) || "（會員）",
    toName: nameByUid.get(inv.toUserId) || "（會員）",
  }));

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>121 邀約</h2>
      <p className="muted" style={{ marginTop: 0 }}>發起、接受、完成 121，並記錄下引薦成果。</p>
      <InvitationList invitations={invitations} />
    </div>
  );
}
