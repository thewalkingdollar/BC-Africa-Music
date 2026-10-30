module.exports = {
  apps: [{
    name: "bc-africa-music",
    cwd: "/var/www/bc-africa-music",
    script: "/home/bcafrica/.bun/bin/bun",
    args: "run start",
    env: {
      PORT: 3000,
      NODE_ENV: "development",
      BUN_INSTALL: "/home/bcafrica/.bun",
      PATH: "/home/bcafrica/.bun/bin:/usr/bin:/bin"
    }
  }]
}
