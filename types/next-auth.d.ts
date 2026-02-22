import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      role: "VIEWER" | "ADMIN"
    }
  }

  interface User {
    id: string
    email: string
    role: "VIEWER" | "ADMIN"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "VIEWER" | "ADMIN"
  }
}
