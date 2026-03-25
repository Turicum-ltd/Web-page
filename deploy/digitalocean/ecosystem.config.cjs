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
        ATLAS_BASE_PATH: '/atlas',
        NEXT_PUBLIC_BASE_PATH: '/atlas',
        APP_ORIGIN: 'https://marketshift.net',
        NEXT_PUBLIC_APP_ORIGIN: 'https://marketshift.net'
      }
    }
  ]
};
