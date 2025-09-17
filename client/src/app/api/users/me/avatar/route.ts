import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return new NextResponse('Unauthorized - No token provided', { status: 401 });
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;
    
    if (!file) {
      return new NextResponse('No file provided', { status: 400 });
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return new NextResponse('Invalid file type. Only images are allowed.', { status: 400 });
    }

    // Forward the request to the backend server with the original file and auth header
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/users/me/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        // Let the backend set the content-type with the boundary
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return new NextResponse(
        data.message || 'Failed to upload avatar', 
        { status: response.status }
      );
    }
    
    return NextResponse.json({
      success: true,
      avatar: data.avatar,
      message: 'Avatar uploaded successfully',
      user: data.user
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return new NextResponse('Unauthorized - No token provided', { status: 401 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/users/me/avatar`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return new NextResponse(
        data.message || 'Failed to delete avatar', 
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar deleted successfully',
      user: data.user
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
