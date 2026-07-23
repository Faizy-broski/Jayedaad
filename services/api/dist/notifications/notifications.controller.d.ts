import { NotificationsRepository } from './notifications.repository';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsRepository);
    list(req: any): Promise<any[]>;
    markRead(req: any, id: string): Promise<any>;
    markAllRead(req: any): Promise<void>;
}
