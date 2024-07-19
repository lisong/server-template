// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageInfo = require('./package.json');
const name = packageInfo.name;
module.exports = {
  apps: [
    {
      name,
      cwd: `/opt/web/${name}/dist/`,
      script: 'main.js',
      exec_mode: 'cluster',
      instances: 2,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      out_file: '/opt/log/pm2.log',
      error_file: '/opt/log/pm2-error.log',
      merge_logs: true,
      combine_logs: true,
    },
  ],
};
