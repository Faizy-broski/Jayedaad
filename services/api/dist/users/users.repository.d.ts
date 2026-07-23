import { SupabaseService } from '../supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-role.dto';
import { Role } from '../common/types';
export declare class UsersRepository {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    findById(id: string): Promise<any>;
    list(filters?: {
        roles?: Role[];
    }): Promise<any[]>;
    create(input: CreateUserDto): Promise<any>;
    updateRole(id: string, input: UpdateUserRoleDto): Promise<any>;
    suspend(id: string): Promise<void>;
    unsuspend(id: string): Promise<void>;
    remove(id: string): Promise<void>;
}
