type BranchInitialProps = {
    name?: string | null;
    className?: string;
};

export default function BranchInitial({ name, className = "" }: BranchInitialProps) {
    const initial = name?.trim().charAt(0).toLocaleUpperCase("ru-RU") || "Ф";

    return (
        <span
            aria-hidden="true"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-white shadow-sm ${className}`}
        >
            {initial}
        </span>
    );
}
