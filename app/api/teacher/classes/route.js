import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'teacher') {
      return NextResponse.json(
        { error: "Unauthorized - Teacher access required" },
        { status: 403 }
      );
    }

    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true }
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    // Get all classes for this teacher with student counts and details
    const classes = await prisma.class.findMany({
      where: { teacherId: teacher.id },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            gender: true,
            createdAt: true
          }
        },
        suggestions: {
          select: {
            id: true,
            sentence: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Also get students by class name (direct classId assignment)
    const classNameMap = {
      'EY jupiter': 'ey-jupiter',
      'EY venus': 'ey-venus',
      'EY mercury': 'ey-mercury',
      'EY neptune': 'ey-neptune'
    };

    const enrichedClasses = await Promise.all(
      classes.map(async (cls) => {
        // Get students assigned by className
        const studentsByClassName = await prisma.user.findMany({
          where: {
            classId: cls.name,
            role: 'student'
          },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            gender: true,
            createdAt: true
          }
        });

        // Merge both (students from relation and by className)
        const allStudents = [...cls.students];
        for (const student of studentsByClassName) {
          if (!allStudents.find(s => s.id === student.id)) {
            allStudents.push(student);
          }
        }

        // Get stats for each student
        const studentsWithStats = await Promise.all(
          allStudents.map(async (student) => {
            const scores = await prisma.score.findMany({
              where: { userId: student.id },
              select: { wpm: true, accuracy: true },
              orderBy: { createdAt: 'desc' },
              take: 1
            });

            return {
              ...student,
              lastScore: scores[0] || null
            };
          })
        );

        return {
          ...cls,
          students: studentsWithStats,
          studentCount: studentsWithStats.length,
          suggestionsCount: cls.suggestions.length,
          displayId: classNameMap[cls.name] || cls.name.toLowerCase().replace(/ /g, '-')
        };
      })
    );

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        email: teacher.email,
        name: teacher.name
      },
      classes: enrichedClasses,
      totalClasses: enrichedClasses.length,
      totalStudents: enrichedClasses.reduce((sum, cls) => sum + cls.students.length, 0)
    });
  } catch (error) {
    console.error('[GET-TEACHER-CLASSES] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes', details: error.message },
      { status: 500 }
    );
  }
}
