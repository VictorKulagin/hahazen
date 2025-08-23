"use client";

import React, {ReactNode} from 'react';
//import {EmployeesProvider} from '@/contexts/EmployeesContext';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface LayoutProps {
    children: ReactNode;
}

const queryClient = new QueryClient();
export default function Layout({children}: LayoutProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="layout">
                <main>{children}</main>
            </div>
        </QueryClientProvider>
    );
}
