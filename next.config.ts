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
    async rewrites() {
        const apiRoot = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.hahazen.com/api/v1").replace(/\/api\/v1\/?$/, "");

        return [
            {
                source: "/public-api/:path*",
                destination: `${apiRoot}/public-api/:path*`,
            },
        ];
    },
    /*eslint: {
        ignoreDuringBuilds: true,
    },*/
};

export default nextConfig;
