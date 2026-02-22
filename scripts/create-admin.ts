import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error("Usage: npx ts-node scripts/create-admin.ts <email> <password>")
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "ADMIN",
      },
    })

    console.log(`Admin user created successfully: ${user.email}`)
  } catch (error: any) {
    if (error.code === "P2002") {
      console.error("User with this email already exists")
    } else {
      console.error("Error creating user:", error)
    }
    process.exit(1)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
