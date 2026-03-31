module.exports = {
  apps: [
    {
      name: 'turicum-platform',
      cwd: '/opt/turicum-platform',
      env_file: '/opt/turicum-platform/.env.production',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: '3100',
        TURICUM_BASE_PATH: '',
        NEXT_PUBLIC_BASE_PATH: '',
        APP_ORIGIN: 'https://turicum.us',
        NEXT_PUBLIC_APP_ORIGIN: 'https://turicum.us'
      }
    },
    {
      name: 'turicum-borrower-portal',
      cwd: '/opt/turicum-platform/apps/borrower-portal',
      env_file: '/opt/turicum-platform/apps/borrower-portal/.env.production',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: '3200',
        APP_ORIGIN: 'https://borrow.turicum.us',
        NEXT_PUBLIC_APP_ORIGIN: 'https://borrow.turicum.us',
        BORROWER_PORTAL_ORIGIN: 'https://borrow.turicum.us',
        NEXT_PUBLIC_BORROWER_PORTAL_ORIGIN: 'https://borrow.turicum.us',
        BORROWER_PORTAL_HOST: 'borrow.turicum.us'
      }
    }
  ]
};
