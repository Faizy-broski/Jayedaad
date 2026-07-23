import { SubscriptionTiersRepository } from './subscription-tiers.repository';
import { CreateSubscriptionTierDto, UpdateSubscriptionTierDto } from './dto/subscription-tier.dto';
export declare class SubscriptionTiersController {
    private readonly tiers;
    constructor(tiers: SubscriptionTiersRepository);
    list(): Promise<any[]>;
    create(body: CreateSubscriptionTierDto): Promise<any>;
    update(id: string, body: UpdateSubscriptionTierDto): Promise<any>;
    remove(id: string): Promise<void>;
}
