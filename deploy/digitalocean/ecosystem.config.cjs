module.exports = {
  apps: [
    {
      name: 'turicum-platform',
      cwd: '/opt/turicum-platform',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: '3100',
        TURICUM_BASE_PATH: '/turicum',
        NEXT_PUBLIC_BASE_PATH: '/turicum',
        APP_ORIGIN: 'https://marketshift.net',
        NEXT_PUBLIC_APP_ORIGIN: 'https://marketshift.net'
      }
    }
  ]
};
