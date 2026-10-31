module.exports = {
  apps: [{
    name: "bc-africa-music",
    cwd: "/var/www/bc-africa-music",
    script: "tsx",
    args: "server.ts",
    env: {
      PORT: 3000,
      NODE_ENV: "production",
      JWT_SECRET: process.env.JWT_SECRET || "bc-africa-music-production-jwt-secret-key-2026"
    }
  }]
}
