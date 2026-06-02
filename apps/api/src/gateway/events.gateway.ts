import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SocketEvent } from '@zipi/shared';
import { ChatService } from '../chat/chat.service';

interface AuthSocket extends Socket {
  userId?: string;
  userRole?: string;
  driverId?: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private driverSockets = new Map<string, string>(); // driverId -> socketId
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private chatService: ChatService,
  ) {}

  async handleConnection(client: AuthSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token, { secret: this.config.get('JWT_SECRET') });
      client.userId = payload.sub;
      client.userRole = payload.role;

      this.userSockets.set(payload.sub, client.id);
      client.join(`user:${payload.sub}`);
      console.log(`Client connected: ${payload.sub} (${payload.role})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthSocket) {
    if (client.userId) {
      this.userSockets.delete(client.userId);
      if (client.driverId) this.driverSockets.delete(client.driverId);
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(SocketEvent.DRIVER_LOCATION_UPDATE)
  handleLocationUpdate(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { driverId: string; lat: number; lng: number; heading?: number },
  ) {
    client.driverId = data.driverId;
    this.driverSockets.set(data.driverId, client.id);

    // Broadcast to passengers watching this driver
    this.server.to(`driver:${data.driverId}:watchers`).emit(SocketEvent.LOCATION_UPDATE, {
      driverId: data.driverId,
      lat: data.lat,
      lng: data.lng,
      heading: data.heading,
    });
  }

  @SubscribeMessage('watch:driver')
  handleWatchDriver(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { driverId: string },
  ) {
    client.join(`driver:${data.driverId}:watchers`);
  }

  @SubscribeMessage('unwatch:driver')
  handleUnwatchDriver(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { driverId: string },
  ) {
    client.leave(`driver:${data.driverId}:watchers`);
  }

  // Emit to a specific user
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Emit to all available drivers
  emitToDrivers(event: string, data: any) {
    this.server.emit(event, data); // Simplification: broadcast to all drivers
  }

  // Notify trip accepted
  notifyTripAccepted(passengerId: string, tripData: any) {
    this.emitToUser(passengerId, SocketEvent.TRIP_ACCEPTED, tripData);
  }

  notifyTripStatusChange(passengerId: string, driverUserId: string, event: string, data: any) {
    this.emitToUser(passengerId, event, data);
    this.emitToUser(driverUserId, event, data);
  }

  notifyNewTrip(data: any) {
    this.server.emit(SocketEvent.TRIP_REQUEST, data);
  }

  notifyNewDelivery(data: any) {
    this.server.emit(SocketEvent.DELIVERY_REQUEST, data);
  }

  @SubscribeMessage('chat:join')
  handleChatJoin(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { tripId: string },
  ) {
    client.join(`trip:${data.tripId}:chat`);
  }

  @SubscribeMessage('chat:send')
  async handleChatSend(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { tripId: string; content: string; senderName: string },
  ) {
    if (!client.userId || !data.content?.trim()) return;

    const message = await this.chatService.saveMessage(
      data.tripId,
      client.userId,
      data.senderName,
      data.content.trim(),
    );

    this.server.to(`trip:${data.tripId}:chat`).emit(SocketEvent.CHAT_MESSAGE, message);
  }
}
