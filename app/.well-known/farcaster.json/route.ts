import { withValidManifest } from "@coinbase/onchainkit/minikit";
import type { MiniAppManifest } from "@coinbase/onchainkit/minikit";
import { minikitConfig, type ExtendedMiniAppManifest } from "../../../minikit.config";

export async function GET() {
  // withValidManifest validates and returns the manifest
  // We cast to preserve the baseBuilder field which isn't in the base type
  const validatedManifest = withValidManifest(minikitConfig as MiniAppManifest);

  // Merge back the baseBuilder field for the response
  const manifest: ExtendedMiniAppManifest = {
    ...validatedManifest,
    baseBuilder: minikitConfig.baseBuilder
  };

  return Response.json(manifest);
}
