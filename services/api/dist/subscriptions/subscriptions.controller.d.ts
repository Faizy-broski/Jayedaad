import { EntitlementsService } from './entitlements.service';
import { SubscriptionsRepository } from './subscriptions.repository';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
export declare class SubscriptionsController {
    private readonly entitlements;
    private readonly subscriptions;
    constructor(entitlements: EntitlementsService, subscriptions: SubscriptionsRepository);
    usage(req: any): Promise<{
        used: number;
        quota: number;
    }>;
    me(req: any): Promise<any>;
    select(req: any, body: AssignSubscriptionDto): Promise<any>;
    assign(agentId: string, body: AssignSubscriptionDto): Promise<any>;
}
