import type { NextConfig } from "next";

const PUBLIC_ENV_ALLOWLIST = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];

const leakedEnv = Object.keys(process.env).filter(
  (k) =>
    k.startsWith("NEXT_PUBLIC_") &&
    !PUBLIC_ENV_ALLOWLIST.includes(k) &&
    (k.includes("SERVICE_ROLE") || k.includes("SECRET") || k.endsWith("_KEY") || k.includes("PASSWORD") || k.includes("TOKEN")),
);

if (leakedEnv.length > 0) {
  throw new Error(
    `Variabel rahasia tidak boleh memakai prefix NEXT_PUBLIC_ (akan ikut ke bundle client): ${leakedEnv.join(", ")}. Rename tanpa prefix NEXT_PUBLIC_ atau masukkan ke PUBLIC_ENV_ALLOWLIST.`,
  );
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "cdn.ipaslogo.com",
      },
    ],
  },
};

export default nextConfig;
