import { CreateAgencyInput, SetAgencyVerificationStatusInput, UpdateAgencyInput } from '../models';
export declare function useAgencyManagementViewModel(filters?: {
    city?: string;
}): {
    agencies: NoInfer<import("..").Agency[]>;
    isLoading: boolean;
    create: import("@tanstack/react-query").UseMutationResult<import("..").Agency, Error, CreateAgencyInput, unknown>;
    update: import("@tanstack/react-query").UseMutationResult<import("..").Agency, Error, {
        id: string;
        input: UpdateAgencyInput;
    }, unknown>;
    setVerificationStatus: import("@tanstack/react-query").UseMutationResult<import("..").Agency, Error, {
        id: string;
        input: SetAgencyVerificationStatusInput;
    }, unknown>;
    remove: import("@tanstack/react-query").UseMutationResult<{
        id: string;
    }, Error, string, unknown>;
};
