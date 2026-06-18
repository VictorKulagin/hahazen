import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
        dangerouslyAllowSVG: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "api.hahazen.com",
            },
        ],
    },
    /*eslint: {
        ignoreDuringBuilds: true,
    },*/
};

export default nextConfig;
