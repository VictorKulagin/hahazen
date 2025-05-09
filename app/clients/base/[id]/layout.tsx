import React, { ReactNode } from 'react';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="layout">
            <main>{children}</main>
        </div>
    );
}
