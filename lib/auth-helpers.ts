import { auth } from "@/auth"
import { Role } from "@prisma/client"

export async function isAdmin() {
  const session = await auth()
  return session?.user?.role === "ADMIN"
}

export async function hasRole(allowedRoles: Role[]) {
  const session = await auth()
  if (!session?.user?.role) return false
  return allowedRoles.includes(session.user.role)
}