import bcrypt from 'bcrypt';
import {SignJWT} from 'jose';
import {NextRequest, NextResponse} from 'next/server';
import { prisma } from '@/lib/prisma';

const secret = process.env.JWT_KEY;

export async function POST(request: NextRequest) {
    const {email, password} = await request.json();

    try {
        if (!email || !password)
            return NextResponse.json({ error: "Please provide credentials" }, { status: 400 });

        // Find user in db
        const user = await prisma.user.findUnique({
            where: {email},
        });

        if (!user)
            return NextResponse.json({ error: "Email or password incorrect" }, { status: 400 });

        // Check if password valid
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid)
            return NextResponse.json({ error: "Email or password incorrect" }, { status: 400 });

// Create JWT token for user
const jwtSecret = new TextEncoder().encode(secret);
const token = await new SignJWT({userId: user.id})
	.setProtectedHeader({alg: "HS256"})
	.setExpirationTime('1h')
	.sign(jwtSecret);

// Return response with JWT
const response = NextResponse.json({message: "Login Successful!"});
response.cookies.set({
	name: "authToken",
	value: token,
	path: '/',
	httpOnly: true,
	maxAge: 3600,
	secure: true
} as any);

        return response;
    } catch (error) {
        return NextResponse.json({ error: "Failed to login" }, { status: 500 });
    }
}