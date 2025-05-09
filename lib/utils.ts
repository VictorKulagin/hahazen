import {clsx, type classValue  } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn( ...inputs: classValue[] ) {
    return twMerge(clsx(inputs))
}
/*export function cn(...args: string[]): string {
    return args.filter(Boolean).join(" ");
}*/

export function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    })
}
