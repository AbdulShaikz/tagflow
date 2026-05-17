import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function POST(req: NextRequest, {params}: {params: Promise<{id: string}>}){
    
    const session = await getServerSession(authOptions);
    if(!session?.user?.email){
        return NextResponse.json({error: "Not authenticated"}, {status: 401});
    }

    const user = await prisma.user.findUnique({
        where: {
            email: session.user.email
        },
    });
    if(!user){
        return NextResponse.json({error: "User not found"}, {status: 404});
    }

    const {id} = await params;
    const bookmark = await prisma.bookmark.findUnique({where:{id}});
    if(!bookmark || bookmark.userId !== user.id){
        return NextResponse.json({error: "Not found or authorized"}, {status: 404});
    }

    try {
        const {object} = await generateObject({
            model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),
            schema: z.object({
                tags: z.array(z.string().max(20)).max(5).describe('Relevant lowercase tags for the bookmark'),
            }),
            prompt: `Based on the following bookmark, suggest a few concise, descriptive tags (lowercase, single words or short phrases).
                     Bookmark title: "${bookmark.title}"
                     Bookmark URL: ${bookmark.url}
                     Return only the tags as an array of strings.`,
            temperature: 0.3,
        });

        const suggestedTags = object.tags.map((t) => t.toLowerCase().trim()).filter(Boolean);

        for(const tagName of suggestedTags){
            const normalized = tagName.trim().toLowerCase();
            if(!normalized) continue;

            let tag = await prisma.tag.findFirst({where: {name: normalized}});
            if(!tag){
                tag = await prisma.tag.create({data: {name: normalized}});
            }

            await prisma.bookmark.update({
                where: {id},
                data: {
                    tags: {
                        connect: {id: tag.id},
                    },
                },
            });

            const updated  = await prisma.bookmark.findUnique({
                where: {id},
                include: { tags: true },
            });

            return NextResponse.json(updated);
        }
    } catch (error) {
        console.error('AI tag generation failed:', error);
        return NextResponse.json({ error: 'Failed to generate tags' }, { status: 500 });
    }
}