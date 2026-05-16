import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    req: NextRequest,
    {params}: {
        params: Promise<{ id: string }>
    }
) {
    const {id} = await params;
    const session = await getServerSession(authOptions);
    if(!session?.user?.email){
        return NextResponse.json({error: 'Not authenticated'}, {status: 401});
    }

    const user = await prisma.user.findUnique({
        where: {
            email: session.user.email
        }
    });
    if(!user){
        return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    const bookmark = await prisma.bookmark.findUnique({
        where: {id},
    });
    if(!bookmark || bookmark.userId !== user.id){
        return NextResponse.json({error: 'Not found or unauthorized'}, {status: 404})
    }

    const body = await req.json();
    const {name} = body;
    if(!name || typeof name !== 'string'){
        return NextResponse.json({error: 'Tag name is required'}, {status: 400});
    }

    const tagName = name.trim().toLowerCase();
    
    let tag = await prisma.tag.findFirst({ where: { name: tagName } });
    if (!tag) {
        tag = await prisma.tag.create({ data: { name: tagName } });
    }

    const updatedBookmark = await prisma.bookmark.update({
        where: { id },
        data: {
            tags: {
                connect: {id: tag.id}
            }
        },
        include: {tags: true},
    });
    return NextResponse.json(updatedBookmark);
}