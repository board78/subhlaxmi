import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/** Lightweight server-side admin guard for the admin layout */
async function getAdminFromCookies(): Promise<{ name: string; email: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("subhlaxmi_session")?.value;
  if (!raw) return null;

  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;

  const secret = process.env.AUTH_SECRET ?? "dev-only-change-this-auth-secret";
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const sigBuf = Buffer.from(signature);
  if (expectedBuf.length !== sigBuf.length || !timingSafeEqual(expectedBuf, sigBuf)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId?: string;
      exp?: number;
    };
    if (!parsed.userId || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    if (!ObjectId.isValid(parsed.userId)) return null;

    const db = await getDb();
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(parsed.userId) }, { projection: { name: 1, email: 1, role: 1 } });

    if (!user || user.role !== "admin") return null;
    return { name: user.name as string, email: user.email as string };
  } catch {
    return null;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminFromCookies();
  if (!admin) redirect("/?auth=signin");

  return <>{children}</>;
}
