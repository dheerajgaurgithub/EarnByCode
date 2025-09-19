import { NextResponse } from 'next/server';

const gone = () =>
  NextResponse.json(
    {
      success: false,
      message: 'Profile pictures have been removed from AlgoBucks. This endpoint is deprecated.'
    },
    { status: 410 }
  );

export async function POST() {
  return gone();
}

export async function DELETE() {
  return gone();
}
