import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Create a suggestion
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { classId, sentence, description } = await request.json();

    if (!classId || !sentence) {
      return Response.json(
        { error: 'classId and sentence are required' },
        { status: 400 }
      );
    }

    // Get teacher ID from email
    const teacher = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!teacher || teacher.role !== 'teacher') {
      return Response.json(
        { error: 'Unauthorized - Teacher access required' },
        { status: 403 }
      );
    }

    // Verify teacher owns this class
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: teacher.id
      },
      include: {
        students: true
      }
    });

    if (!classData) {
      return Response.json(
        { error: 'Class not found or access denied' },
        { status: 404 }
      );
    }

    // Create the suggestion
    const suggestion = await prisma.teacherSuggestion.create({
      data: {
        teacherId: teacher.id,
        classId: classId,
        sentence: sentence.trim(),
        description: description ? description.trim() : null
      }
    });

    // Create notifications for all students in the class
    const notificationPromises = classData.students.map(student =>
      prisma.notification.create({
        data: {
          userId: student.id,
          type: 'suggestion',
          title: `New typing practice from ${teacher.name || 'your teacher'}`,
          message: `Your teacher has suggested a new sentence to practice: "${sentence.substring(0, 50)}${sentence.length > 50 ? '...' : ''}"`,
          suggestionId: suggestion.id
        }
      })
    );

    await Promise.all(notificationPromises);

    return Response.json(
      {
        success: true,
        data: suggestion,
        notificationsCreated: classData.students.length,
        message: `Suggestion created and notifications sent to ${classData.students.length} students`
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[CREATE-SUGGESTION] Error:', error);
    return Response.json(
      { error: 'Failed to create suggestion', details: error.message },
      { status: 500 }
    );
  }
}

// Get suggestions for a class
export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return Response.json(
        { error: 'classId is required' },
        { status: 400 }
      );
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get class and verify user has access
    const classData = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classData) {
      return Response.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if user is teacher of this class or student in this class
    if (user.role === 'teacher' && classData.teacherId !== user.id) {
      return Response.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    if (user.role === 'student' && user.classId !== classId) {
      return Response.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch suggestions
    const suggestions = await prisma.teacherSuggestion.findMany({
      where: { classId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return Response.json({
      success: true,
      data: suggestions
    }, { status: 200 });
  } catch (error) {
    console.error('[GET-SUGGESTIONS] Error:', error);
    return Response.json(
      { error: 'Failed to fetch suggestions', details: error.message },
      { status: 500 }
    );
  }
}
