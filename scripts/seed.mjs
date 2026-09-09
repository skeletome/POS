/**
 * Seed demo users (OWNER + CASHIER) untuk store demo "Warung Nusantara".
 * Migration V5 sudah membuat store + bank. Script ini membuat akun login.
 *
 * Jalankan: npm run seed
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function envFromLocalFile() {
  try {
    const file = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    const env = {};
    for (const line of file.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
    return env;
  } catch {
    return {};
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? envFromLocalFile().NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? envFromLocalFile().SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ .env.local tidak lengkap. Butuh NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const STORE_ID = "a0000000-0000-0000-0000-000000000001";
const USERS = [
  { email: "owner@pos.local", password: "owner123", name: "Pemilik Toko", role: "OWNER" },
  { email: "kasir@pos.local", password: "kasir123", name: "Kasir Demo", role: "CASHIER" },
];

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function findUserByEmail(email) {
  let page = 1;
  let perPage = 200;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < perPage) break;
    page += 1;
    // batas aman
    if (page > 20) break;
  }
  return null;
}

async function ensureUser(email, password, name) {
  let user = await findUserByEmail(email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error) throw new Error(`Gagal createUser ${email}: ${error.message}`);
    user = data.user;
    console.log(`✅ Auth user dibuat: ${email}`);
  } else {
    console.log(`⏩ Auth user sudah ada: ${email}`);
    // pastikan password sesuai agar login demo selalu berhasil
    await admin.auth.admin.updateUserById(user.id, { password });
  }

  // profile
  const { error: pErr } = await admin.from("profiles").upsert(
    { id: user.id, email, name },
    { onConflict: "id" },
  );
  if (pErr) throw new Error(`Gagal upsert profile ${email}: ${pErr.message}`);

  return user.id;
}

async function main() {
  // pastikan store demo ada
  const { data: store, error: sErr } = await admin
    .from("stores")
    .select("id")
    .eq("id", STORE_ID)
    .maybeSingle();
  if (sErr) throw sErr;
  if (!store) {
    const { error: iErr } = await admin.from("stores").insert({
      id: STORE_ID,
      name: "Warung Nusantara",
      information: "Toko contoh untuk demo POS Kasir.",
      dine_in_tax: 0.1,
      takeaway_tax: 0.05,
    });
    if (iErr) throw new Error(`Gagal insert store demo: ${iErr.message}`);
    console.log("✅ Store demo dibuat: Warung Nusantara");
  } else {
    console.log("⏩ Store demo sudah ada.");
  }

  for (const u of USERS) {
    const userId = await ensureUser(u.email, u.password, u.name);
    const { error: mErr } = await admin.from("store_members").upsert(
      { store_id: STORE_ID, user_id: userId, role: u.role, active: true },
      { onConflict: "store_id,user_id" },
    );
    if (mErr) throw new Error(`Gagal upsert membership ${u.email}: ${mErr.message}`);
    console.log(`✅ Membership: ${u.email} → ${u.role}`);
    await sleep(250);
  }

  console.log("\n🎉 Seed selesai. Login demo:");
  console.log("  Owner : owner@pos.local / owner123");
  console.log("  Kasir : kasir@pos.local / kasir123");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});