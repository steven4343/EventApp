import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { database } from './database';
import { Notification } from './types';

let io: Server | null = null;

export function initNotificationService(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('register', (uid: string) => {
      socket.join(`user:${uid}`);
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

export function emitToUser(userId: string, event: string, data: any): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification['type'] = 'info',
  referenceType?: string,
  referenceId?: string,
): Promise<Notification | null> {
  try {
    const notification: Notification = {
      id: `notif_${uuidv4()}`,
      userId,
      title,
      message,
      type,
      referenceType,
      referenceId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    await database.createNotification(notification);

    emitToUser(userId, 'notification', notification);

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}
