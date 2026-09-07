// Version baked into the running bundle. Compared against the on-disk skin version
// (GET /webui/skins/{id}) to detect that Streamline-Bridge has downloaded a newer
// skin in the background — a mismatch means "reload to apply".
//
// BUMP THIS when cutting a release, in the same step as pushing the git tag.
export const APP_VERSION = '0.1.107';

// Our skin id as registered with Streamline-Bridge (matches skin-manifest.json / reaMetadata.skinId).
// Deliberately NOT 'streamline.js' -- that id is Decaid's hardcoded default-skin
// slot (skin_sources.json pins it to the official allofmeng/streamline_project
// release), so a GitHub-branch install of this fork under 'streamline.js' would
// overwrite it. This fork installs under its own id instead, alongside it.
export const SKIN_ID = 'streamline-wake-preset-dev';
