'use client';

import { useBranches } from "@/hooks/useBranches";
import { useState } from "react";
import Link from "next/link";

export default function BranchesPage() {
    const { data: branches, isLoading, error } = useBranches();
    const [selectedBranch, setSelectedBranch] = useState<number | null>(null);

    if (isLoading) return <div>Загрузка филиалов...</div>;
    if (error) return <div>Ошибка: {error.message}</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Выберите филиал</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {branches?.map(branch => (
                    <div
                        key={branch.id}
                        onClick={() => setSelectedBranch(branch.id)}
                        className={`p-4 border rounded-lg cursor-pointer ${
                            selectedBranch === branch.id
                                ? 'border-green-500 bg-green-50'
                                : 'hover:border-gray-400'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <input
                                type="radio"
                                readOnly
                                checked={selectedBranch === branch.id}
                                className="w-5 h-5 text-green-500 cursor-pointer"
                            />
                            <div>
                                <h3 className="text-lg font-semibold">{branch.name}</h3>
                                <p className="text-gray-600">{branch.address}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center">
                <Link
                    href={selectedBranch ? `/booking/branches/${selectedBranch}/services/select` : '#'}
                    className={`inline-block px-8 py-3 text-lg ${
                        selectedBranch
                            ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                            : 'bg-gray-300 cursor-not-allowed'
                    } text-white rounded-lg transition-colors`}
                >
                    Выбрать услугу
                </Link>
            </div>
        </div>
    );
}
