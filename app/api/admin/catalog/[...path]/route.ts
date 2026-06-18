import { NextRequest, NextResponse } from "next/server";

const apiRoot = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/api\/v1\/?$/, "");

type RouteContext = {
    params: Promise<{ path: string[] }>;
};

const forwardRequest = async (request: NextRequest, context: RouteContext) => {
    const { path } = await context.params;
    const target = new URL(`/api/v1/platform/catalog/${path.join("/")}`, apiRoot);

    request.nextUrl.searchParams.forEach((value, key) => {
        target.searchParams.append(key, value);
    });

    const headers = new Headers({ Accept: "application/json" });
    const authorization = request.headers.get("authorization");
    const contentType = request.headers.get("content-type");
    const methodOverride = request.headers.get("x-http-method-override");

    if (authorization) headers.set("Authorization", authorization);
    if (contentType) headers.set("Content-Type", contentType);
    if (methodOverride) headers.set("X-Http-Method-Override", methodOverride);

    const response = await fetch(target, {
        method: request.method,
        headers,
        body: request.method === "GET" || request.method === "HEAD"
            ? undefined
            : await request.arrayBuffer(),
        cache: "no-store",
    });

    const responseType = response.headers.get("content-type") ?? "";
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", responseType || "application/json; charset=UTF-8");

    for (const header of ["x-pagination-current-page", "x-pagination-page-count", "x-pagination-per-page", "x-pagination-total-count"]) {
        const value = response.headers.get(header);
        if (value) responseHeaders.set(header, value);
    }

    if (responseType.includes("json")) {
        const text = (await response.text()).replace(/^\uFEFF/, "");
        return new NextResponse(text, { status: response.status, headers: responseHeaders });
    }

    return new NextResponse(await response.arrayBuffer(), {
        status: response.status,
        headers: responseHeaders,
    });
};

const handle = async (request: NextRequest, context: RouteContext) => {
    try {
        return await forwardRequest(request, context);
    } catch {
        return NextResponse.json(
            { message: "Не удалось выполнить запрос к Admin Catalog API." },
            { status: 502 },
        );
    }
};

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
