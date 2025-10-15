import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Salva uma a��o no log do usu�rio.
 * @param userId ID do usu�rio
 * @param action Descri��o da a��o (ex: 'register', 'login')
 */
export async function logAction(userId: string, action: string) {
  try {
    await prisma.log.create({
      data: { userId, action, timestamp: new Date() },
    });
    console.log(`?? logAction -> [user:${userId}] ${action}`);
  } catch (err: any) {
    console.error("? logAction_failed:", err.message);
  }
}
