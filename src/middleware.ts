import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
const secret = new TextEncoder().encode(process.env.JWT_KEY);

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isPublicPath = path === '/login' || path === '/register';
    const hiddenToConnectedUsers = path === '/login' || path === '/register';
    const token = req.cookies.get('authToken')?.value;

    if (!token && !isPublicPath)
        return NextResponse.redirect(new URL('/login', req.url));
    else if (token) {
        if (hiddenToConnectedUsers) {
            return NextResponse.redirect(new URL('/', req.url));
        }
        try {
            const { payload } = await jwtVerify(token, secret);

            if (!payload || !payload.exp) {
                return NextResponse.redirect(new URL('/login', req.url));
            }

            const tokenExpiration = new Date(payload.exp * 1000);

            if (tokenExpiration <= new Date()) {
                console.log("expired");
                return NextResponse.redirect(new URL('/login', req.url));
            }
        
            if (isPublicPath)
                return NextResponse.next();
        } catch (error) {
            console.log("error");
            return NextResponse.redirect(new URL('/login', req.url));
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/login', '/register', '/quiz/:path*'
    ]
}