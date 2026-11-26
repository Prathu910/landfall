import type { MetadataRoute } from "next";
import { webManifest } from "../lib/brand/manifest";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return webManifest();
}
