"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

type RootGroupLayoutProps = {
    children: ReactNode;
};

export default function RootGroupLayout({ children }: RootGroupLayoutProps) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
