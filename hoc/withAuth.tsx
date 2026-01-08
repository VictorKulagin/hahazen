"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ComponentType, JSX } from "react";

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
            return (
                <div className="h-screen bg-backgroundBlue flex items-center justify-center">
                    <p className="text-gray-300">Загрузка...</p>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
}
