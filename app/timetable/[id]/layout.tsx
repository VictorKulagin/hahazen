"use client";

import React, { ReactNode } from 'react';

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const queryClient = new QueryClient();

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({children}: LayoutProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="layout">
                <main>{children}</main>
            </div>
        </QueryClientProvider>
    );
}
