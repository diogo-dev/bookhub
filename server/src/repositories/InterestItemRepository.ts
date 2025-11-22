import { InterestItem } from "@/domain/InterestItem";

export interface InterestItemRepository {
    save(interestItem: InterestItem): Promise<InterestItem>;
    findByUserId(userId: string): Promise<InterestItem[]>;
    findByUserAndBookISBN(userId: string, bookISBN: string): Promise<InterestItem | null>;
    remove(userId: string, bookISBN: string): Promise<void>;
}