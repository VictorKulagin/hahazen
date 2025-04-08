"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function withAuth<T>(WrappedComponent: React.ComponentType<T>) {
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
            return <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Загрузка...</p>
            </div>;
        }

        return <WrappedComponent {...props} />;
    };
}
