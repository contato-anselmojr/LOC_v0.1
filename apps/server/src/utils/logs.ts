import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Salva uma ação no log do usuário.
 * @param userId ID do usuário
 * @param action Descrição da ação (ex: 'register', 'login')
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
