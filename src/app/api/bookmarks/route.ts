import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: session.user.email,
        name: session.user.name || '',
      },
    });
  }

  const body = await req.json();
  const { title, url } = body;
  if (!title || !url) {
    return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
  }

  const bookmark = await prisma.bookmark.create({
    data: {
      title,
      url,
      userId: user.id,
    },
  });

  return NextResponse.json(bookmark, { status: 201 });
}