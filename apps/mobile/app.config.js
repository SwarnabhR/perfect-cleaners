const fs = require('fs');
const path = require('path');

// The Firebase config files are not committed. EAS builds receive them as file
// secrets (GOOGLE_SERVICES_JSON / GOOGLE_SERVICE_INFO_PLIST, which resolve to a
// temp path); local builds fall back to a copy in this folder. If neither
// exists (e.g. CI bundling only) the key is omitted.
function resolveFile(envVar, localName) {
  const fromEnv = process.env[envVar];
  if (fromEnv) return fromEnv;
  const local = path.join(__dirname, localName);
  return fs.existsSync(local) ? `./${localName}` : undefined;
}

module.exports = ({ config }) => {
  const androidFile = resolveFile('GOOGLE_SERVICES_JSON', 'google-services.json');
  const iosFile = resolveFile('GOOGLE_SERVICE_INFO_PLIST', 'GoogleService-Info.plist');

  const { googleServicesFile: _a, ...android } = config.android ?? {};
  const { googleServicesFile: _i, ...ios } = config.ios ?? {};

  return {
    ...config,
    android: { ...android, ...(androidFile && { googleServicesFile: androidFile }) },
    ios: { ...ios, ...(iosFile && { googleServicesFile: iosFile }) },
  };
};
