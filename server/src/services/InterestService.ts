import { InterestItem } from "@/domain/InterestItem";
import { BookRepository } from "@/repositories/BookRepository";
import { InterestItemRepository } from "@/repositories/InterestItemRepository";

export class InterestService {
    constructor(private interestRepository: InterestItemRepository, private bookRepository: BookRepository) {}

    async addInterest(userID: string, bookISBN: string): Promise<InterestItem> {

        const book = await this.bookRepository.find(bookISBN);
        if (!book) throw new Error("Livro não encontrado");

        const existing = await this.interestRepository.findByUserAndBookISBN(userID, bookISBN);

        if (existing) { 
            throw new Error("Livro já está na lista de interesses");
        }

        const interest = new InterestItem(userID, bookISBN, Date.now());
        return await this.interestRepository.save(interest);
    }

    async removeInterest(userID: string, bookISBN: string): Promise<void> {
        const existing = await this.interestRepository.findByUserAndBookISBN(userID, bookISBN);
        if (!existing) throw new Error("Livro não está na lista de interesses");
        await this.interestRepository.remove(userID, bookISBN);
    }

    async getUserInterests(userID: string): Promise<InterestItem[]> {
        return await this.interestRepository.findByUserId(userID);
    }
}

    