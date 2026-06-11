"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ComponentType, JSX } from "react";
import Loader from "@/components/Loader";

export function withAuth<T extends JSX.IntrinsicAttributes>(WrappedComponent: ComponentType<T>) {
    return function ProtectedComponent(props: T) {
        const router = useRouter();
        const [isLoading, setIsLoading] = useState(true);

        useEffect(() => {
            const token = localStorage.getItem("access_token");
            if (!token) {
                router.replace("/signin");
                return;
            }
            setIsLoading(false);
        }, [router]);

        if (isLoading) {
            return <Loader type="default" visible />;
        }

        return <WrappedComponent {...props} />;
    };
}
