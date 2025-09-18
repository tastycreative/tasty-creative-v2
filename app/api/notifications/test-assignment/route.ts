import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Testing assignment notification API...');

    // Test the assignment notification endpoint
    const testPayload = {
      taskId: 'test-task-123',
      taskTitle: 'Test Assignment Task',
      taskDescription: 'This is a test assignment',
      assignedToEmail: 'test@example.com',
      assignedToUserId: 'test-user-123',
      priority: 'MEDIUM',
      teamId: 'test-team-123',
      teamName: 'Test Team',
      assignedBy: 'Test Assigner',
      assignedById: 'assigner-123',
      dueDate: null,
      previousAssigneeId: null
    };

    console.log('Test payload:', testPayload);

    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/assignment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      testResult: result,
      status: response.status,
      message: 'Assignment notification API test completed'
    });

  } catch (error) {
    console.error('❌ Assignment notification test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Assignment notification API test failed'
      },
      { status: 500 }
    );
  }
}
