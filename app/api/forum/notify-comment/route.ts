import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { sendCommentNotificationEmail } from "@/lib/email"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:3000"

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { postId, commentContent, postUrl } = await request.json()

    if (!postId || !commentContent || !postUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get post details directly from backend
    let post
    try {
      const postResponse = await fetch(`${BACKEND_URL}/forum/posts/${postId}`)
      if (!postResponse.ok) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 })
      }
      post = await postResponse.json()
    } catch (error) {
      console.error("Error fetching post:", error)
      return NextResponse.json({ error: "Failed to fetch post information" }, { status: 500 })
    }

    // Get current user information from forum API
    let commenter
    try {
      // Try to get forum user by external ID
      const response = await fetch(`${BACKEND_URL}/forum/users/external/${session.user.id}`)
      if (response.ok) {
        commenter = await response.json()
      } else {
        return NextResponse.json({ error: "Commenter not found in forum system" }, { status: 404 })
      }
    } catch (error) {
      console.error("Error fetching commenter:", error)
      return NextResponse.json({ error: "Failed to fetch commenter information" }, { status: 500 })
    }

    // Don't send notification if the commenter is the post owner
    if (post.author.id === commenter.id) {
      return NextResponse.json({ 
        success: true, 
        message: "No notification sent - user commenting on their own post" 
      })
    }

    // Don't send notification if post owner doesn't have email
    if (!post.author.email) {
      return NextResponse.json({ 
        success: true, 
        message: "No notification sent - post owner has no email" 
      })
    }

    // Send notification email
    try {
      await sendCommentNotificationEmail({
        to: post.author.email,
        postOwnerName: post.author.username || 'User',
        commenterName: commenter.username || 'Anonymous',
        postTitle: post.title,
        commentContent: commentContent,
        postUrl: postUrl, // Use the URL passed from frontend
      })

      console.log(`Comment notification sent to ${post.author.email} for post ${postId}`)
      
      return NextResponse.json({ 
        success: true, 
        message: "Comment notification sent successfully" 
      })
    } catch (emailError) {
      console.error("Failed to send comment notification email:", emailError)
      return NextResponse.json({ 
        success: false, 
        error: "Failed to send email notification" 
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Error in comment notification endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}