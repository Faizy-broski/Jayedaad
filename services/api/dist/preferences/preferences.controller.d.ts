import { PreferencesRepository } from './preferences.repository';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
export declare class PreferencesController {
    private readonly preferences;
    constructor(preferences: PreferencesRepository);
    get(req: any): Promise<{
        emailNotifications: any;
        newsletters: any;
        automatedReports: any;
        preferredCurrency: any;
        preferredAreaUnit: any;
    }>;
    update(req: any, body: UpdatePreferencesDto): Promise<{
        emailNotifications: any;
        newsletters: any;
        automatedReports: any;
        preferredCurrency: any;
        preferredAreaUnit: any;
    }>;
}
