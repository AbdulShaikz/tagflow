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

  return NextResponse.json(bookmark, {status: 201 });
}

export async function GET(req: NextRequest){
  const session = await getServerSession(authOptions);
  if(!session || !session.user?.email){
    return NextResponse.json({error:'Not authenticated'},{status: 401});
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email
    },
  });
  if(!user){
    return NextResponse.json({error: 'User not found'}, {status: 404});
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id},
    orderBy: { createdAt: 'desc'},
    include: {
      tags: true,
    }
  });

  return NextResponse.json(bookmarks);
}

export async function DELETE(req: NextRequest){
  const session = await getServerSession(authOptions);
  if(!session || !session.user?.email){
    return NextResponse.json({error: 'Not authenticated'}, {status : 401});
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email}
  });
  if(!user){
    return NextResponse.json({error: 'User not found'}, {status: 404});
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if(!id){
    return NextResponse.json({error: 'Missing bookmark id'}, {status: 400});
  }

  const bookmark = await prisma.bookmark.findUnique({where: {id}});
  if(!bookmark || bookmark.userId !== user.id){
    return NextResponse.json({error: 'Not found or not authorized'}, {status: 404});
  }

  await prisma.bookmark.delete({where: {id}});

  return NextResponse.json({success: true});
}