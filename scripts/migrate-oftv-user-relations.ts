/**
 * Migration script to populate videoEditorUserId and thumbnailEditorUserId
 * for existing OFTVTask records based on their email addresses
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateOFTVUserRelations() {
  console.log('Starting OFTV user relations migration...');

  try {
    // Get all OFTV tasks
    const oftvTasks = await prisma.oFTVTask.findMany({
      where: {
        OR: [
          { videoEditor: { not: null } },
          { thumbnailEditor: { not: null } }
        ]
      }
    });

    console.log(`Found ${oftvTasks.length} OFTV tasks to migrate`);

    let updatedCount = 0;

    for (const task of oftvTasks) {
      const updates: any = {};

      // Look up video editor user ID
      if (task.videoEditor && !task.videoEditorUserId) {
        const videoEditorUser = await prisma.user.findUnique({
          where: { email: task.videoEditor },
          select: { id: true }
        });

        if (videoEditorUser) {
          updates.videoEditorUserId = videoEditorUser.id;
          console.log(`Found video editor user for ${task.videoEditor}: ${videoEditorUser.id}`);
        } else {
          console.log(`⚠️  No user found for video editor email: ${task.videoEditor}`);
        }
      }

      // Look up thumbnail editor user ID
      if (task.thumbnailEditor && !task.thumbnailEditorUserId) {
        const thumbnailEditorUser = await prisma.user.findUnique({
          where: { email: task.thumbnailEditor },
          select: { id: true }
        });

        if (thumbnailEditorUser) {
          updates.thumbnailEditorUserId = thumbnailEditorUser.id;
          console.log(`Found thumbnail editor user for ${task.thumbnailEditor}: ${thumbnailEditorUser.id}`);
        } else {
          console.log(`⚠️  No user found for thumbnail editor email: ${task.thumbnailEditor}`);
        }
      }

      // Update if we found any users
      if (Object.keys(updates).length > 0) {
        await prisma.oFTVTask.update({
          where: { id: task.id },
          data: updates
        });
        updatedCount++;
        console.log(`✓ Updated task ${task.id}`);
      }
    }

    console.log(`\n✅ Migration complete! Updated ${updatedCount} OFTV tasks`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateOFTVUserRelations()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
