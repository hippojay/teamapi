# Running Playwright in WSL

When running Playwright in Windows Subsystem for Linux (WSL), there are some additional considerations to make tests work correctly.

## Browser Installation

If your browser doesn't launch in WSL, you may need to install browser dependencies:

```bash
# Install dependencies for Chrome/Chromium
sudo apt update
sudo apt install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils libgbm-dev libxshmfence-dev
```

## Browser Launch Arguments

In our `world.js` file, we've added these Chromium launch flags specifically for WSL:

```javascript
args: [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage'
]
```

These flags help Chromium run more reliably in WSL environments.

## Display Server

WSL doesn't include a display server by default. You have two options:

1. Run headless browsers (default setting in our `.env` file)
2. Install an X server on Windows and configure WSL to use it

If you need to see the browser UI, set `HEADLESS=false` in the `.env` file and ensure you have an X server configured.

## Troubleshooting

If you encounter browser launch issues:

1. Make sure your WSL has the necessary browser dependencies
2. Try running with `HEADLESS=true` to see if headless mode works
3. Check the detailed error messages from Playwright
4. You may need to install browser binaries manually with `npx playwright install chromium`

For more information, see Playwright's documentation on [WSL support](https://playwright.dev/docs/browsers#linux).
