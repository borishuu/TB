import {PrismaClient} from '@prisma/client';
import {NextRequest, NextResponse} from 'next/server';
import {jwtVerify} from "jose";
import {prisma} from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        let userId: number;

        const secret = new TextEncoder().encode(process.env.JWT_KEY);
        const token = req.cookies.get('authToken')?.value;

        try {
            // Verify token
            const {payload} = await jwtVerify(token as string, secret);
            userId = payload.userId as number;
        } catch (error) {
            return new NextResponse(JSON.stringify({error: "User not authenticated"}), {status: 400} as Response);
        }

        // Find user in db
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}