import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-role.dto';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersRepository);
    list(role?: string): Promise<any[]>;
    findById(id: string): Promise<any>;
    create(body: CreateUserDto): Promise<any>;
    updateRole(id: string, body: UpdateUserRoleDto): Promise<any>;
    suspend(id: string): Promise<void>;
    unsuspend(id: string): Promise<void>;
    remove(id: string): Promise<void>;
}
