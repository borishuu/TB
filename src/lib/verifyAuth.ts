import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_KEY);

export async function verifyAuth(request: NextRequest) {
    try {
        const token = request.cookies.get('authToken')?.value;

        if (!token)
            return { userId: null, error: 'Unauthorized: No token provided' };

        const { payload } = await jwtVerify(token, secret);

        return { userId: payload.userId, error: null };
    } catch (error) {
        return { userId: null, error: 'Unauthorized: Invalid token' };
    }
}
