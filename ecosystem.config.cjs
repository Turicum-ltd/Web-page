module.exports = {
  apps: [
    {
      name: "turicum-platform",
      cwd: "/Users/hank/Code/web-page",
      script: "npm",
      args: "start -- -p 3100",
      env: {
        NODE_ENV: "production",
        PORT: "3100",
        TURICUM_BASE_PATH: "",
        NEXT_PUBLIC_BASE_PATH: "",
        APP_ORIGIN: "https://turicum.us",
        NEXT_PUBLIC_APP_ORIGIN: "https://turicum.us"
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "700M",
      min_uptime: "10s",
      restart_delay: 4000,
      exp_backoff_restart_delay: 200,
      kill_timeout: 5000,
      listen_timeout: 10000,
      time: true,
      merge_logs: true
    }
  ]
};
