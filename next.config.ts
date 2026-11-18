import fs from "fs";
import path from "path";
import type { NextConfig } from "next";

// Until the two new PDFs are dropped into public/, /resume.pdf keeps serving
// the old file. Once resume-dev.pdf exists, /resume.pdf points at it.
const hasDevResume = fs.existsSync(
  path.join(process.cwd(), "public", "resume-dev.pdf"),
);

const nextConfig: NextConfig = {
  // The dev badge sits over the corner icons and swallows their clicks while testing.
  devIndicators: false,
  experimental: {
    viewTransition: true,
  },
  // Pictures, recordings and sounds are not fingerprinted, so give browsers a week before they ask again (then a day of
  // serving the old copy while checking for a new one). Repeat visits and moving between pages then re-download nothing.
  async headers() {
    const cache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }];
    return ["/images/:path*", "/sounds/:path*", "/about/:path*"].map((source) => ({ source, headers: cache }));
  },
  async redirects() {
    // The old menu pages are gone; the home showcase replaces them.
    const redirects = [{ source: "/menu/:path*", destination: "/", permanent: false }];
    if (hasDevResume) {
      redirects.push({ source: "/resume.pdf", destination: "/resume-dev.pdf", permanent: false });
    }
    return redirects;
  },
};

export default nextConfig;
