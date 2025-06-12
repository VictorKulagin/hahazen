import Navbar from "@/components/Navbar";

export default function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <main className="font-work-sans">
            {children}
        </main>
    )
}
