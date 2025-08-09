"use client";
import React, { useState, useEffect } from 'react';

// Типы для пропсов
interface PaginationData {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface PaginationProps {
    paginationData?: PaginationData;
    isLoading?: boolean;
    currentPage: number;
    onPageChange: (page: number) => void;
    onPrefetchPage?: (page: number) => void;
    className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
                                                   paginationData,
                                                   isLoading = false,
                                                   currentPage,
                                                   onPageChange,
                                                   onPrefetchPage,
                                                   className = ""
                                               }) => {
    // Если нет данных пагинации или всего 1 страница - не показываем
    if (!paginationData || paginationData.totalPages <= 1) return null;

    const { totalPages, hasNextPage, hasPrevPage } = paginationData;

    // Определяем размер экрана
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Генерация номеров страниц
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = isMobile ? 3 : 7;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (isMobile) {
                // Мобильная версия
                if (currentPage <= 2) {
                    pages.push(1, 2, 3, -1);
                } else if (currentPage >= totalPages - 1) {
                    pages.push(-1, totalPages - 2, totalPages - 1, totalPages);
                } else {
                    pages.push(-1, currentPage - 1, currentPage, currentPage + 1, -1);
                }
            } else {
                // Десктопная версия
                pages.push(1);

                const startPage = Math.max(2, currentPage - 2);
                const endPage = Math.min(totalPages - 1, currentPage + 2);

                if (startPage > 2) pages.push(-1);

                for (let i = startPage; i <= endPage; i++) {
                    if (i !== 1 && i !== totalPages) pages.push(i);
                }

                if (endPage < totalPages - 1) pages.push(-1);
                if (totalPages > 1) pages.push(totalPages);
            }
        }

        return pages;
    };

    const handlePrevPage = () => {
        if (hasPrevPage) {
            const prevPage = currentPage - 1;
            onPageChange(prevPage);
            if (onPrefetchPage) onPrefetchPage(prevPage);
        }
    };

    const handleNextPage = () => {
        if (hasNextPage) {
            const nextPage = currentPage + 1;
            onPageChange(nextPage);
            if (onPrefetchPage) onPrefetchPage(nextPage);
        }
    };

    const handlePageClick = (page: number) => {
        onPageChange(page);
        if (onPrefetchPage) onPrefetchPage(page);
    };

    return (
        <nav className={`flex justify-center mt-8 mb-4 ${className}`} aria-label="Pagination">
            <ul className={`inline-flex items-center bg-gray-900/50 rounded-xl p-2 backdrop-blur-sm ${
                isMobile ? 'space-x-0.5' : 'space-x-1'
            }`}>

                {/* Кнопка "Назад" */}
                <li>
                    <button
                        onClick={handlePrevPage}
                        disabled={!hasPrevPage || isLoading}
                        className={`
              flex items-center justify-center rounded-lg
              transition-all duration-200 ease-in-out transform
              ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}
              ${!hasPrevPage || isLoading
                            ? 'text-gray-500 bg-gray-800 cursor-not-allowed'
                            : 'text-white bg-green-600 hover:bg-green-500 hover:scale-105'
                        }
            `}
                    >
                        <svg className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </li>

                {/* Номера страниц */}
                {getPageNumbers().map((pageNum, index) => (
                    pageNum === -1 ? (
                        // Эллипс
                        <li key={`ellipsis-${index}`}>
              <span className={`flex items-center justify-center text-gray-400 ${
                  isMobile ? 'px-1 h-8 text-xs' : 'px-3 h-10 text-sm'
              }`}>
                ...
              </span>
                        </li>
                    ) : (
                        // Номер страницы
                        <li key={`page-${pageNum}`}>
                            <button
                                onClick={() => handlePageClick(pageNum)}
                                disabled={isLoading}
                                className={`
                  flex items-center justify-center rounded-lg font-semibold
                  transition-all duration-200 ease-in-out
                  ${isMobile ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}
                  ${currentPage === pageNum
                                    ? 'text-white bg-green-500 scale-105 shadow-lg shadow-green-500/30'
                                    : isLoading
                                        ? 'text-gray-400 bg-gray-800'
                                        : 'text-gray-300 bg-gray-700 hover:bg-green-600'
                                }
                `}
                            >
                                {isLoading && currentPage === pageNum ? (
                                    <div className={`border-2 border-white border-t-transparent rounded-full animate-spin ${
                                        isMobile ? 'w-3 h-3' : 'w-4 h-4'
                                    }`}></div>
                                ) : pageNum}
                            </button>
                        </li>
                    )
                ))}

                {/* Кнопка "Вперед" */}
                <li>
                    <button
                        onClick={handleNextPage}
                        disabled={!hasNextPage || isLoading}
                        className={`
              flex items-center justify-center rounded-lg
              transition-all duration-200 ease-in-out transform
              ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}
              ${!hasNextPage || isLoading
                            ? 'text-gray-500 bg-gray-800 cursor-not-allowed'
                            : 'text-white bg-green-600 hover:bg-green-500 hover:scale-105'
                        }
            `}
                    >
                        <svg className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </li>
            </ul>

            {/* Информация о странице */}
            <div className={`flex items-center text-gray-400 ${
                isMobile ? 'ml-2 text-xs' : 'ml-4 text-sm'
            }`}>
        <span className="bg-gray-800 px-2 py-1 rounded-lg">
          {isMobile ? `${currentPage}/${totalPages}` : `Страница ${currentPage} из ${totalPages}`}
        </span>
            </div>
        </nav>
    );
};

export default Pagination;
