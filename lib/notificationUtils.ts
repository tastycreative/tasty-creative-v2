import { prisma } from '@/lib/prisma';
import { sendSheetLinkNotificationEmail } from '@/lib/email';

export async function notifyPodTeamMembers({
  clientModelId,
  modelName,
  sheetName,
  sheetUrl,
  sheetType,
  userWhoLinked,
}: {
  clientModelId: string;
  modelName: string;
  sheetName: string;
  sheetUrl: string;
  sheetType: string;
  userWhoLinked: string;
}) {
  try {
    // Find the POD team assignment for this client model
    const podTeamAssignment = await prisma.podTeamClientAssignment.findFirst({
      where: {
        clientModelId: clientModelId,
        isActive: true,
      },
      include: {
        podTeam: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!podTeamAssignment?.podTeam?.members) {
      console.log(`No POD team members found for model: ${modelName}`);
      return { success: false, message: 'No POD team members found' };
    }

    // Get email addresses of all team members
    const teamMemberEmails = podTeamAssignment.podTeam.members
      .map(member => member.user.email)
      .filter(email => email); // Filter out null/undefined emails

    if (teamMemberEmails.length === 0) {
      console.log(`No email addresses found for POD team members of model: ${modelName}`);
      return { success: false, message: 'No email addresses found for team members' };
    }

    // Send notification emails to all team members
    const emailPromises = teamMemberEmails.map(email =>
      sendSheetLinkNotificationEmail({
        to: email,
        modelName,
        sheetName,
        sheetUrl,
        sheetType,
        userWhoLinked,
      })
    );

    await Promise.all(emailPromises);

    console.log(`✅ Notification emails sent to ${teamMemberEmails.length} POD team members for model: ${modelName}`);
    
    return { 
      success: true, 
      message: `Notifications sent to ${teamMemberEmails.length} team members`,
      emailsSent: teamMemberEmails.length 
    };

  } catch (error) {
    console.error('Error sending POD team notifications:', error);
    return { success: false, message: 'Failed to send notifications' };
  }
}