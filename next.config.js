/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    // Only proxy in development - in production, Vercel handles Python functions directly
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:5328/api/:path*',
        },
      ]
    }
    return []
  },
}

module.exports = nextConfig
