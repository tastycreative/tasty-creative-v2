import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listAllFilesInFolder, deleteFromS3 } from '@/lib/s3';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folderName = searchParams.get('folder');

    if (!folderName) {
      return NextResponse.json(
        { success: false, error: 'Folder name is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // List ALL files in the folder including .placeholder
    const files = await listAllFilesInFolder(userId, folderName);

    // Delete all files in the folder
    const deletePromises = files.map(file => deleteFromS3(file.key));
    await Promise.all(deletePromises);

    return NextResponse.json({ 
      success: true, 
      message: `Folder "${folderName}" and ${files.length} file(s) deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}
