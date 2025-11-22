export interface UpdateProfileResponse { 
    id: string;
    name: string;
    email: string;
    cpf: string;
    roles: string[];
    createdAt?: number;
}