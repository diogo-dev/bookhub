"use client"

import { useState, useEffect } from "react";
import { EmployeeLayout } from "@/app/_components/EmployeeLayout"
import styles from './page.module.css'
import { useAuth } from "../_context/AuthContext";
import { get, post, patch, del } from "../api";
import { toast } from "sonner";
import Link from "next/link";
import { FiSearch, FiEdit, FiTrash2, FiX, FiPlus, FiBook } from "react-icons/fi";
import { BookCover } from "../_components/BookCover";

interface Book {
    ISBN: string;
    title: string;
    subtitle?: string;
    authors: { ID: string; name: string }[];
    publisher?: { name: string; displayName: string } | null;
    cover?: string;
    numberOfPages: number;
    numberOfVisits: number;
}

interface BookFormData {
    ISBN: string;
    workID?: string;
    categoryID?: string;
    title: string;
    subtitle?: string;
    description?: string;
    cover?: string;
    authorIDs: string[];
    authorNames?: string; // Para entrada de texto livre
    publisherName?: string;
    publisherDisplayName?: string; // Para entrada de texto livre
    edition?: string;
    languageCode?: string;
    languageName?: string; // Para entrada de texto livre
    numberOfPages: number;
    publishedAt?: string;
}

export default function ManageBookPage() {
    const { user, loading, isAuthenticated } = useAuth();
    const [books, setBooks] = useState<Book[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
    const [loadingBooks, setLoadingBooks] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLetter, setSelectedLetter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalBooks, setTotalBooks] = useState(0);
    const booksPerPage = 20;
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [formData, setFormData] = useState<BookFormData>({
        ISBN: "",
        title: "",
        authorIDs: [],
        numberOfPages: 1
    });
    const [editFormData, setEditFormData] = useState<Partial<BookFormData>>({});
    const [categories, setCategories] = useState<{ ID: string; name: string; decimal: string }[]>([]);

    const isEmployeeOrAdmin = user?.roles?.some(role => 
        role.toUpperCase() === 'EMPLOYEE' || role.toUpperCase() === 'ADMIN'
    ) || false;

    useEffect(() => {
        if (isAuthenticated && isEmployeeOrAdmin) {
            fetchBooks(undefined, 1);
            fetchFormOptions();
        }
    }, [isAuthenticated, isEmployeeOrAdmin]);

    async function fetchFormOptions() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('Token não encontrado para buscar opções do formulário');
                return;
            }

            // Carregar apenas categorias (autores, editoras e idiomas serão digitados manualmente)
            const categoriesRes = await get('/categories', token).catch(err => {
                console.error('Erro ao buscar categorias:', err);
                return { ok: false, json: () => Promise.resolve([]) };
            });
            
            if (categoriesRes.ok) {
                const categoriesData = await categoriesRes.json();
                setCategories(categoriesData);
                console.log(`Carregadas ${categoriesData.length} categorias`);
            } else {
                const errorData = await categoriesRes.json().catch(() => ({}));
                console.error('Erro ao carregar categorias:', errorData);
            }
        } catch (error) {
            console.error('Erro ao carregar opções do formulário:', error);
            toast.error('Erro ao carregar opções do formulário.');
        }
    }

    useEffect(() => {
        if (searchTerm) {
            const filtered = books.filter(book => 
                book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.ISBN.includes(searchTerm) ||
                book.authors.some(author => author.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setFilteredBooks(filtered);
        } else {
            setFilteredBooks(books);
        }
    }, [searchTerm, books]);

    async function fetchBooks(letter?: string, page: number = 1) {
        try {
            setLoadingBooks(true);
            const token = localStorage.getItem('token');
            const offset = (page - 1) * booksPerPage;
            // Buscar livros com paginação e opcionalmente filtrar por letra
            const url = letter 
                ? `/books/all?limit=${booksPerPage}&offset=${offset}&letter=${encodeURIComponent(letter)}`
                : `/books/all?limit=${booksPerPage}&offset=${offset}`;
            const response = await get(url, token);
            
            if (!response.ok) {
                throw new Error('Erro ao buscar livros');
            }

            const data = await response.json();
            // Se a resposta tem estrutura paginada
            if (data.books) {
                setBooks(data.books);
                setFilteredBooks(data.books);
                setTotalBooks(data.total || 0);
            } else {
                // Fallback para resposta antiga (sem paginação)
                setBooks(data);
                setFilteredBooks(data);
                setTotalBooks(data.length);
            }
        } catch (error: any) {
            toast.error(error.message || 'Erro ao carregar livros');
        } finally {
            setLoadingBooks(false);
        }
    }

    async function searchBooks(query: string) {
        try {
            setLoadingBooks(true);
            const token = localStorage.getItem('token');
            const searchQuery = query.trim() || "";
            const response = await get(`/books/search/admin?q=${encodeURIComponent(searchQuery)}&limit=200`, token);
            
            if (!response.ok) {
                throw new Error('Erro ao buscar livros');
            }

            const data = await response.json();
            setBooks(data);
            setFilteredBooks(data);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao buscar livros');
        } finally {
            setLoadingBooks(false);
        }
    }

    const handleCreateBook = async () => {
        // Validar campos obrigatórios
        if (!formData.ISBN || !formData.title || !formData.numberOfPages) {
            toast.error("Por favor, preencha todos os campos obrigatórios (ISBN, Título e Número de páginas).");
            return;
        }

        // Validar que tem pelo menos um autor (seja por ID ou nome)
        if (formData.authorIDs.length === 0 && !formData.authorNames?.trim()) {
            toast.error("Por favor, selecione ou digite pelo menos um autor.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Processar autores: buscar ou criar pelos nomes fornecidos
            let finalAuthorIDs = [...formData.authorIDs];
            
            if (formData.authorNames?.trim()) {
                const authorNames = formData.authorNames.split(',').map(name => name.trim()).filter(name => name.length > 0);
                for (const authorName of authorNames) {
                    try {
                        const authorRes = await post('/authors/find-or-create', { name: authorName }, token);
                        if (authorRes.ok) {
                            const author = await authorRes.json();
                            if (!finalAuthorIDs.includes(author.ID)) {
                                finalAuthorIDs.push(author.ID);
                            }
                        }
                    } catch (err) {
                        console.error(`Erro ao criar/buscar autor ${authorName}:`, err);
                    }
                }
            }

            if (finalAuthorIDs.length === 0) {
                toast.error("Nenhum autor válido foi encontrado ou criado.");
                return;
            }

            const bookData: any = {
                ISBN: formData.ISBN.replace(/\D/g, ''),
                title: formData.title,
                authorIDs: finalAuthorIDs,
                numberOfPages: formData.numberOfPages
            };

            if (formData.workID) bookData.workID = formData.workID.replace(/\D/g, '');
            if (formData.categoryID) bookData.categoryID = formData.categoryID;
            if (formData.subtitle) bookData.subtitle = formData.subtitle;
            if (formData.description) bookData.description = formData.description;
            if (formData.cover) bookData.cover = formData.cover;
            if (formData.edition) bookData.edition = formData.edition;
            if (formData.publishedAt) bookData.publishedAt = new Date(formData.publishedAt);

            // Processar editora: buscar ou criar
            if (formData.publisherDisplayName?.trim()) {
                try {
                    const publisherRes = await post('/publishers/find-or-create', { displayName: formData.publisherDisplayName }, token);
                    if (publisherRes.ok) {
                        const publisher = await publisherRes.json();
                        bookData.publisherName = publisher.name;
                    }
                } catch (err) {
                    console.error('Erro ao criar/buscar editora:', err);
                }
            } else if (formData.publisherName) {
                bookData.publisherName = formData.publisherName;
            }

            // Processar idioma: buscar ou criar
            if (formData.languageName?.trim()) {
                try {
                    const languageRes = await post('/languages/find-or-create', { name: formData.languageName }, token);
                    if (languageRes.ok) {
                        const language = await languageRes.json();
                        bookData.languageCode = language.isoCode;
                    }
                } catch (err) {
                    console.error('Erro ao criar/buscar idioma:', err);
                }
            } else if (formData.languageCode) {
                bookData.languageCode = formData.languageCode;
            }

            const response = await post('/books', bookData, token);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao criar livro');
            }

            toast.success("Livro criado com sucesso!");
            setShowCreateModal(false);
            setFormData({
                ISBN: "",
                title: "",
                authorIDs: [],
                authorNames: "",
                numberOfPages: 1
            });
            fetchBooks(undefined, 1);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao criar livro');
        }
    };

    const handleEditBook = async (book: Book) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Limpar ISBN para garantir que seja apenas dígitos
            const cleanISBN = book.ISBN.replace(/\D/g, '');

            // Buscar dados completos do livro
            const response = await get(`/books/${cleanISBN}`, token);
            if (!response.ok) {
                throw new Error('Erro ao buscar dados do livro');
            }

            const fullBook = await response.json();
            setEditingBook(book);
            setEditFormData({
                title: fullBook.title,
                subtitle: fullBook.subtitle || "",
                description: fullBook.description || "",
                cover: fullBook.cover || "",
                authorNames: fullBook.authors.map((a: any) => a.name).join(', '),
                authorIDs: fullBook.authors.map((a: any) => a.ID),
                publisherDisplayName: fullBook.publisher?.displayName || "",
                publisherName: fullBook.publisher?.name || "",
                edition: fullBook.edition || "",
                languageName: fullBook.language?.name || "",
                languageCode: fullBook.language?.isoCode || "",
                categoryID: fullBook.categoryTree?.[fullBook.categoryTree.length - 1]?.ID || "",
                numberOfPages: fullBook.numberOfPages,
                publishedAt: fullBook.publishedAt ? new Date(fullBook.publishedAt).toISOString().split('T')[0] : ""
            });
            setShowEditModal(true);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao carregar dados do livro');
        }
    };

    const handleUpdateBook = async () => {
        if (!editingBook) return;

        if (!editFormData.title || (!editFormData.authorNames?.trim() && (!editFormData.authorIDs || editFormData.authorIDs.length === 0)) || !editFormData.numberOfPages) {
            toast.error("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const updateData: any = {
                title: editFormData.title,
                numberOfPages: editFormData.numberOfPages
            };

            // Processar autores: buscar ou criar
            if (editFormData.authorNames?.trim()) {
                const authorNames = editFormData.authorNames.split(',').map(name => name.trim()).filter(name => name.length > 0);
                const finalAuthorIDs: string[] = [];
                
                for (const authorName of authorNames) {
                    try {
                        const authorRes = await post('/authors/find-or-create', { name: authorName }, token);
                        if (authorRes.ok) {
                            const author = await authorRes.json();
                            if (!finalAuthorIDs.includes(author.ID)) {
                                finalAuthorIDs.push(author.ID);
                            }
                        }
                    } catch (err) {
                        console.error('Erro ao criar/buscar autor:', err);
                    }
                }
                
                if (finalAuthorIDs.length > 0) {
                    updateData.authorIDs = finalAuthorIDs;
                }
            } else if (editFormData.authorIDs && editFormData.authorIDs.length > 0) {
                updateData.authorIDs = editFormData.authorIDs;
            }

            if (editFormData.subtitle !== undefined) updateData.subtitle = editFormData.subtitle;
            if (editFormData.description !== undefined) updateData.description = editFormData.description;
            if (editFormData.cover !== undefined) updateData.cover = editFormData.cover;
            if (editFormData.edition !== undefined) updateData.edition = editFormData.edition;
            if (editFormData.categoryID !== undefined) updateData.categoryID = editFormData.categoryID || null;
            if (editFormData.publishedAt) updateData.publishedAt = new Date(editFormData.publishedAt);

            // Processar editora: buscar ou criar
            if (editFormData.publisherDisplayName?.trim()) {
                try {
                    const publisherRes = await post('/publishers/find-or-create', { displayName: editFormData.publisherDisplayName }, token);
                    if (publisherRes.ok) {
                        const publisher = await publisherRes.json();
                        updateData.publisherName = publisher.name;
                    }
                } catch (err) {
                    console.error('Erro ao criar/buscar editora:', err);
                }
            } else if (editFormData.publisherName) {
                updateData.publisherName = editFormData.publisherName || null;
            } else {
                updateData.publisherName = null;
            }

            // Processar idioma: buscar ou criar
            if (editFormData.languageName?.trim()) {
                try {
                    const languageRes = await post('/languages/find-or-create', { name: editFormData.languageName }, token);
                    if (languageRes.ok) {
                        const language = await languageRes.json();
                        updateData.languageCode = language.isoCode;
                    }
                } catch (err) {
                    console.error('Erro ao criar/buscar idioma:', err);
                }
            } else if (editFormData.languageCode) {
                updateData.languageCode = editFormData.languageCode || null;
            } else {
                updateData.languageCode = null;
            }

            // Limpar ISBN para garantir que seja apenas dígitos
            const cleanISBN = editingBook.ISBN.replace(/\D/g, '');
            const response = await patch(`/books/${cleanISBN}`, updateData, token);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao atualizar livro');
            }

            toast.success("Livro atualizado com sucesso!");
            setShowEditModal(false);
            setEditingBook(null);
            fetchBooks(undefined, 1);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao atualizar livro');
        }
    };

    const handleDeleteBook = async () => {
        if (!editingBook) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Limpar ISBN para garantir que seja apenas dígitos
            const cleanISBN = editingBook.ISBN.replace(/\D/g, '');
            const response = await del(`/books/${cleanISBN}`, token);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao deletar livro');
            }

            toast.success("Livro deletado com sucesso!");
            setShowDeleteModal(false);
            setEditingBook(null);
            fetchBooks(undefined, 1);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao deletar livro');
        }
    };

    if (loading) {
        return (
            <EmployeeLayout>
                <div className={styles.page}>
                    <p>Carregando...</p>
                </div>
            </EmployeeLayout>
        );
    }

    if (!isAuthenticated || !user || !isEmployeeOrAdmin) {
        return (
            <EmployeeLayout>
                <div className={styles.page}>
                    <p>Acesso negado. Apenas funcionários e administradores podem acessar esta página.</p>
                    <Link href="/login">Ir para login</Link>
                </div>
            </EmployeeLayout>
        );
    }

    return (
        <EmployeeLayout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Gestão de Livros</h1>
                    <button 
                        className={styles.createButton}
                        onClick={() => setShowCreateModal(true)}
                    >
                        <FiPlus /> Novo Livro
                    </button>
                </div>

                <div className={styles.searchContainer}>
                    <FiSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar por título, ISBN ou autor..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (e.target.value.length > 2) {
                                searchBooks(e.target.value);
                            } else if (e.target.value.length === 0) {
                                fetchBooks(undefined, 1);
                            }
                        }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && searchTerm.length > 2) {
                                searchBooks(searchTerm);
                            }
                        }}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.letterFilter}>
                    <span className={styles.filterLabel}>Filtrar por letra:</span>
                    <div className={styles.letterButtons}>
                        <button
                            className={`${styles.letterButton} ${selectedLetter === "" ? styles.active : ""}`}
                            onClick={() => {
                                setSelectedLetter("");
                                setSearchTerm("");
                                setCurrentPage(1);
                                fetchBooks(undefined, 1);
                            }}
                        >
                            Todas
                        </button>
                        {Array.from({ length: 26 }, (_, i) => {
                            const letter = String.fromCharCode(65 + i); // A-Z
                            return (
                                <button
                                    key={letter}
                                    className={`${styles.letterButton} ${selectedLetter === letter ? styles.active : ""}`}
                                    onClick={() => {
                                        setSelectedLetter(letter);
                                        setSearchTerm("");
                                        setCurrentPage(1);
                                        fetchBooks(letter, 1);
                                    }}
                                >
                                    {letter}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {loadingBooks ? (
                    <div className={styles.loadingContainer}>
                        <p>Carregando livros...</p>
                    </div>
                ) : filteredBooks.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Nenhum livro encontrado.</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.booksGrid}>
                            {filteredBooks.map((book) => (
                                <div key={book.ISBN} className={styles.bookCard}>
                                    <div className={styles.bookCover}>
                                        <BookCover coverID={book.cover} />
                                    </div>
                                    <div className={styles.bookInfo}>
                                        <h3 className={styles.bookTitle}>{book.title}</h3>
                                        {book.subtitle && <p className={styles.bookSubtitle}>{book.subtitle}</p>}
                                        <p className={styles.bookAuthors}>
                                            {book.authors.map(a => a.name).join(', ')}
                                        </p>
                                        <p className={styles.bookIsbn}>ISBN: {book.ISBN}</p>
                                        <div className={styles.bookActions}>
                                            <Link 
                                                href={`/books/${book.ISBN.replace(/\D/g, '')}`}
                                                className={styles.viewButton}
                                            >
                                                <FiBook /> Ver Detalhes
                                            </Link>
                                            <button
                                                className={styles.editButton}
                                                onClick={() => handleEditBook(book)}
                                            >
                                                <FiEdit /> Editar
                                            </button>
                                            <button
                                                className={styles.deleteButton}
                                                onClick={() => {
                                                    setEditingBook(book);
                                                    setShowDeleteModal(true);
                                                }}
                                            >
                                                <FiTrash2 /> Deletar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Paginação */}
                        {!searchTerm && totalBooks > booksPerPage && (
                            <div className={styles.pagination}>
                                <button
                                    className={styles.paginationButton}
                                    onClick={() => {
                                        const newPage = currentPage - 1;
                                        setCurrentPage(newPage);
                                        fetchBooks(selectedLetter || undefined, newPage);
                                    }}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </button>
                                <span className={styles.paginationInfo}>
                                    Página {currentPage} de {Math.ceil(totalBooks / booksPerPage)} ({totalBooks} livros)
                                </span>
                                <button
                                    className={styles.paginationButton}
                                    onClick={() => {
                                        const newPage = currentPage + 1;
                                        setCurrentPage(newPage);
                                        fetchBooks(selectedLetter || undefined, newPage);
                                    }}
                                    disabled={currentPage >= Math.ceil(totalBooks / booksPerPage)}
                                >
                                    Próxima
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Modal de Criação */}
                {showCreateModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>Criar Novo Livro</h2>
                                <button 
                                    className={styles.closeButton}
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    <FiX />
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <p className={styles.infoText}>
                                    Campos obrigatórios: ISBN, Título, Autores e Número de páginas.
                                </p>
                                
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>ISBN *</label>
                                        <input
                                            type="text"
                                            value={formData.ISBN}
                                            onChange={(e) => setFormData({ ...formData, ISBN: e.target.value.replace(/\D/g, '') })}
                                            placeholder="0000000000000"
                                            maxLength={13}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Work ID</label>
                                        <input
                                            type="text"
                                            value={formData.workID || ""}
                                            onChange={(e) => setFormData({ ...formData, workID: e.target.value.replace(/\D/g, '') })}
                                            placeholder="ID da obra relacionada (opcional)"
                                            maxLength={13}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Título *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Título do livro"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Subtítulo</label>
                                    <input
                                        type="text"
                                        value={formData.subtitle || ""}
                                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                        placeholder="Subtítulo (opcional)"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Descrição</label>
                                    <textarea
                                        value={formData.description || ""}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Descrição do livro (opcional)"
                                        rows={4}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Autores *</label>
                                    <input
                                        type="text"
                                        value={formData.authorNames || ""}
                                        onChange={(e) => setFormData({ ...formData, authorNames: e.target.value, authorIDs: [] })}
                                        placeholder="Digite nomes de autores separados por vírgula (ex: João Silva, Maria Santos)"
                                    />
                                    <small className={styles.helpText}>Autores serão criados automaticamente se não existirem</small>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Editora</label>
                                        <input
                                            type="text"
                                            value={formData.publisherDisplayName || ""}
                                            onChange={(e) => setFormData({ ...formData, publisherDisplayName: e.target.value, publisherName: undefined })}
                                            placeholder="Digite o nome da editora (opcional)"
                                        />
                                        <small className={styles.helpText}>Editora será criada automaticamente se não existir</small>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Idioma</label>
                                        <input
                                            type="text"
                                            value={formData.languageName || ""}
                                            onChange={(e) => setFormData({ ...formData, languageName: e.target.value, languageCode: undefined })}
                                            placeholder="Digite o nome do idioma (ex: Português) (opcional)"
                                        />
                                        <small className={styles.helpText}>Idioma será criado automaticamente se não existir</small>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Categoria</label>
                                    <select
                                        value={formData.categoryID || ""}
                                        onChange={(e) => setFormData({ ...formData, categoryID: e.target.value || undefined })}
                                    >
                                        <option value="">Selecione uma categoria</option>
                                        {categories.map(category => (
                                            <option key={category.ID} value={category.ID}>
                                                {category.decimal} - {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Edição</label>
                                        <input
                                            type="text"
                                            value={formData.edition || ""}
                                            onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                                            placeholder="Ex: 1ª edição"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Número de Páginas *</label>
                                        <input
                                            type="number"
                                            value={formData.numberOfPages}
                                            onChange={(e) => setFormData({ ...formData, numberOfPages: parseInt(e.target.value) || 1 })}
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Data de Publicação</label>
                                        <input
                                            type="date"
                                            value={formData.publishedAt || ""}
                                            onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value || undefined })}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Capa (ID)</label>
                                        <input
                                            type="text"
                                            value={formData.cover || ""}
                                            onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
                                            placeholder="ID da capa (opcional)"
                                        />
                                    </div>
                                </div>

                                <div className={styles.modalActions}>
                                    <button 
                                        className={styles.cancelButton}
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setFormData({
                                                ISBN: "",
                                                title: "",
                                                authorIDs: [],
                                                numberOfPages: 1
                                            });
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        className={styles.saveButton}
                                        onClick={handleCreateBook}
                                    >
                                        Criar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Edição */}
                {showEditModal && editingBook && (
                    <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>Editar Livro</h2>
                                <button 
                                    className={styles.closeButton}
                                    onClick={() => setShowEditModal(false)}
                                >
                                    <FiX />
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label>Título *</label>
                                    <input
                                        type="text"
                                        value={editFormData.title || ""}
                                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                        placeholder="Título do livro"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Subtítulo</label>
                                    <input
                                        type="text"
                                        value={editFormData.subtitle || ""}
                                        onChange={(e) => setEditFormData({ ...editFormData, subtitle: e.target.value })}
                                        placeholder="Subtítulo (opcional)"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Descrição</label>
                                    <textarea
                                        value={editFormData.description || ""}
                                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                        placeholder="Descrição do livro (opcional)"
                                        rows={4}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Autores *</label>
                                    <input
                                        type="text"
                                        value={editFormData.authorNames || ""}
                                        onChange={(e) => setEditFormData({ ...editFormData, authorNames: e.target.value, authorIDs: [] })}
                                        placeholder="Digite nomes de autores separados por vírgula (ex: João Silva, Maria Santos)"
                                    />
                                    <small className={styles.helpText}>Autores serão criados automaticamente se não existirem</small>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Editora</label>
                                        <input
                                            type="text"
                                            value={editFormData.publisherDisplayName || ""}
                                            onChange={(e) => setEditFormData({ ...editFormData, publisherDisplayName: e.target.value, publisherName: undefined })}
                                            placeholder="Digite o nome da editora (opcional)"
                                        />
                                        <small className={styles.helpText}>Editora será criada automaticamente se não existir</small>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Idioma</label>
                                        <input
                                            type="text"
                                            value={editFormData.languageName || ""}
                                            onChange={(e) => setEditFormData({ ...editFormData, languageName: e.target.value, languageCode: undefined })}
                                            placeholder="Digite o nome do idioma (ex: Português) (opcional)"
                                        />
                                        <small className={styles.helpText}>Idioma será criado automaticamente se não existir</small>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Categoria</label>
                                    <select
                                        value={editFormData.categoryID || ""}
                                        onChange={(e) => setEditFormData({ ...editFormData, categoryID: e.target.value || undefined })}
                                    >
                                        <option value="">Nenhuma</option>
                                        {categories.map(category => (
                                            <option key={category.ID} value={category.ID}>
                                                {category.decimal} - {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Edição</label>
                                        <input
                                            type="text"
                                            value={editFormData.edition || ""}
                                            onChange={(e) => setEditFormData({ ...editFormData, edition: e.target.value })}
                                            placeholder="Ex: 1ª edição"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Número de Páginas *</label>
                                        <input
                                            type="number"
                                            value={editFormData.numberOfPages || 1}
                                            onChange={(e) => setEditFormData({ ...editFormData, numberOfPages: parseInt(e.target.value) || 1 })}
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Data de Publicação</label>
                                        <input
                                            type="date"
                                            value={editFormData.publishedAt || ""}
                                            onChange={(e) => setEditFormData({ ...editFormData, publishedAt: e.target.value || undefined })}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Capa (ID)</label>
                                        <input
                                            type="text"
                                            value={editFormData.cover || ""}
                                            onChange={(e) => setEditFormData({ ...editFormData, cover: e.target.value })}
                                            placeholder="ID da capa (opcional)"
                                        />
                                    </div>
                                </div>

                                <div className={styles.modalActions}>
                                    <button 
                                        className={styles.cancelButton}
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        className={styles.saveButton}
                                        onClick={handleUpdateBook}
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Confirmação de Exclusão */}
                {showDeleteModal && editingBook && (
                    <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>Confirmar Exclusão</h2>
                                <button 
                                    className={styles.closeButton}
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    <FiX />
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <p>Tem certeza que deseja deletar o livro <strong>{editingBook.title}</strong>?</p>
                                <p className={styles.warningText}>Esta ação não pode ser desfeita.</p>
                                <div className={styles.modalActions}>
                                    <button 
                                        className={styles.cancelButton}
                                        onClick={() => setShowDeleteModal(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        className={styles.deleteButton}
                                        onClick={handleDeleteBook}
                                    >
                                        Deletar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </EmployeeLayout>
    );
}
