import { db } from '../../db/core/index.js';
import { notifications } from '../../db/core/schema.js';
import { eq, desc } from "drizzle-orm";

export const notificationsService = {
  /**
   * Retrieves all notifications sorted by most recent
   */
  async getAll() {
    return db.select().from(notifications).orderBy(desc(notifications.createdAt));
  },

  /**
   * Marks a specific notification as read
   */
  async markAsRead(id: number) {
    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  },

  /**
   * Marks all system notifications as read
   */
  async markAllAsRead() {
    await db.update(notifications).set({ read: true });
    return { success: true };
  },

  /**
   * Deletes a specific notification record
   */
  async delete(id: number) {
    const [deleted] = await db
      .delete(notifications)
      .where(eq(notifications.id, id))
      .returning();
    return deleted;
  },

  /**
   * Purges all notification records from the database
   */
  async clearAll() {
    await db.delete(notifications);
    return { success: true };
  }
};
