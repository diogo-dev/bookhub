import { UserAccount } from "@/domain/UserAccount";
import { UsersRepository } from "@/repositories/UsersRepository";
import bcrypt from 'bcrypt';

export interface UpdateProfileData { 
    name?: string;
    email?: string;
    password?: string;
}

export class ProfileService {
    constructor(private usersRepository: UsersRepository) {}

    async getProfile(userId: string): Promise<UserAccount> {
        const user = await this.usersRepository.findById(userId);
        if (!user) throw new Error('User not found');
        return user;
    }

    async updateProfile(userId: string, data: UpdateProfileData): Promise<UserAccount> {

        const updateData: {name?: string, email?: string, password_hash?: string} = {};

        if (data.name !== undefined) updateData.name = data.name;

        if (data.email !== undefined) updateData.email = data.email;

        if (data.password !== undefined) updateData.password_hash = await bcrypt.hash(data.password, 10);

        return await this.usersRepository.updateProfile(userId, updateData);
    }

    async deleteAccount(userId: string): Promise<void> {

        const user = await this.usersRepository.findById(userId);

        if(!user) { 
            throw new Error('User not found');
        }

        await this.usersRepository.deleteById(userId);
    }
}