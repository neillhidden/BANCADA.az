import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'tests/pages',workers:1,reporter:'list',
 use:{baseURL:'http://127.0.0.1:3200/BANCADA.az/',launchOptions:{executablePath:process.env.BANCADA_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}},
 webServer:{command:'node tests/pages-server.mjs',url:'http://127.0.0.1:3200/BANCADA.az/',reuseExistingServer:false}
});
