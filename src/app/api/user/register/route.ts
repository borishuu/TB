import bcrypt from "bcrypt";
import {NextRequest, NextResponse} from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    // Get post data
    const {email, username, password} = await req.json();

    try {
        // Check that data is present
        if (!email || !username || !password)
            return NextResponse.json({ error: "Please provide credentials" }, { status: 400 });

        // Validate email
        if (!/^\S+@\S+\.\S+$/.test(email))
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 });

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: {email},
        });

        // Return error if user exists
        if (existingUser)
            return NextResponse.json({ error: "User already exists, please login" }, { status: 400 });

        // Hash password
        const hashPassword = await bcrypt.hash(password, 10);

        // Create user
        await prisma.user.create({
            data: {
                email: email,
                username: username,
                password: hashPassword
            },
        });

        return NextResponse.json({ message: "User registered" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
    }
}