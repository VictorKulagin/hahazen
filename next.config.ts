//import type { NextConfig } from "next";

//const nextConfig: NextConfig = {
  /* config options here */
    //images: {
        //dangerouslyAllowSVG: true,
        //remotePatterns: [
            //{
               // protocol: "https",
                //hostname: "*",
            //},
        //],
    //},
    /*eslint: {
        ignoreDuringBuilds: true,
    },*/
//};

//export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        dangerouslyAllowSVG: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*",
            },
        ],
    },

    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "https://api.hahazen.com/api/v1/:path*",
            },
        ];
    },
};

export default nextConfig;
