"use client";

import React, {ReactNode} from 'react';

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const queryClient = new QueryClient();
export default function Layout({
                                   children,
                               }: {
    children: React.ReactNode
}) {
    return (
        <QueryClientProvider client={queryClient}>
            <main className="font-work-sans">
                {children}
            </main>
        </QueryClientProvider>
    )
}
