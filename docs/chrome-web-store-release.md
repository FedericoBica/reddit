# Chrome Web Store Release

## Commands

1. Update the extension version:
   `npm run extension:version -- 0.1.0`
2. Build the extension:
   `npm run extension:build`
3. Build and package the release zip:
   `npm run extension:release`

## Local Development

For a local Next.js app running on `http://localhost:3000`:

1. Build the extension for local API calls:
   `npm run extension:build:local`
2. Or watch in local mode:
   `npm run extension:watch:local`

The generated `dist/manifest.json` will include host permission for the selected API origin.

The release artifact is created at:

`/.artifacts/reddprowl-extension-v<version>.zip`

## Local QA

1. Run `npm run extension:build`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click `Load unpacked`.
5. Select `extension/dist`.
6. Verify:
   - connect token flow
   - extension status check
   - campaign creation
   - start/pause
   - queue next item fetch
   - queue result reporting

## Store Checklist

1. Upload the generated zip from `.artifacts/`.
2. Use the icon set from `extension/public/icons/`.
3. Add screenshots of:
   - connection screen
   - campaign builder
   - active campaign state
4. Fill listing metadata:
   - name: `ReddProwl Outbound`
   - short description
   - full description
   - support email
5. Set privacy policy URL to:
   `https://<your-domain>/privacy`
6. Confirm permissions justification:
   - `storage`: stores extension auth/session state
   - `alarms`: background polling/scheduling
   - `activeTab`: interact with the current Reddit tab
   - `scripting`: inject behavior on Reddit
   - Reddit host permissions: operate only on Reddit pages
