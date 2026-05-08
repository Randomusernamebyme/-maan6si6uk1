/** @type {import('next').NextConfig} */
const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'res.cloudinary.com',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'firebasestorage.googleapis.com',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'storage.googleapis.com',
    pathname: '/**',
  },
]

try {
  const su = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (su) {
    const host = new URL(su).hostname
    remotePatterns.push({
      protocol: 'https',
      hostname: host,
      pathname: '/storage/v1/object/public/**',
    })
  }
} catch {
  // ignore invalid NEXT_PUBLIC_SUPABASE_URL during build
}

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns,
  },
}

module.exports = nextConfig


