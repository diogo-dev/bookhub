interface Book {
  isbn: string;
  author: string;
  title: string;
  subtitle?: string;
  description: string;
  edition: string;
  publisher: string;
  language: string;
  numberOfPages: number;
}

let isbn = 1;

const romanceBooks = [
  {
    isbn: String(isbn++),
    title: "O Amor nos Tempos do Cólera",
    author: "Gabriel García Márquez",
    description: "Uma história de amor que atravessa meio século, marcada pela espera e pela persistência de Florentino Ariza por Fermina Daza.Uma história de amor que atravessa meio século, marcada pela espera e pela persistência de Florentino Ariza por Fermina Daza.Uma história de amor que atravessa meio século, marcada pela espera e pela persistência de Florentino Ariza por Fermina Daza.Uma história de amor que atravessa meio século, marcada pela espera e pela persistência de Florentino Ariza por Fermina Daza.Uma história de amor que atravessa meio século, marcada pela espera e pela persistência de Florentino Ariza por Fermina Daza.Uma história de amor que atravessa meio século, marcada pela espera e pela persistência de Florentino Ariza por Fermina Daza.Uma história de amor que atravessa meio século, marcada pela espera e pela persistência de Florentino Ariza por Fermina Daza.Uma história de amor que atravessa meio século, marcada pela espera e pela persistência de Florentino Ariza por Fermina Daza.Uma história de amor que atravessa meio século, marcada pela espera e pela persistência de Florentino Ariza por Fermina Daza.Uma história de amor que atravessa meio século, marcada pela espera e pela persistência de Florentino Ariza por Fermina Daza.Uma história de amor que atravessa meio século, marcada pela espera e pela persistência de Florentino Ariza por Fermina Daza.Uma história de amor que atravessa meio século, marcada pela espera e pela persistência de Florentino Ariza por Fermina Daza.Uma história de amor que atravessa meio século, marcada pela espera e pela persistência de Florentino Ariza por Fermina Daza.Uma história de amor que atravessa meio século, marcada pela espera e pela persistência de Florentino Ariza por Fermina Daza.",
    publisher: "Record",
    edition: "1ª edição",
    numberOfPages: 432,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "Orgulho e Preconceito",
    author: "Jane Austen",
    description: "Um romance clássico sobre as diferenças sociais, o preconceito e o poder do amor entre Elizabeth Bennet e Mr. Darcy.",
    publisher: "Penguin Classics",
    edition: "2ª edição",
    numberOfPages: 416,
    language: "Inglês"
  },
  {
    isbn: String(isbn++),
    title: "Anna Kariênina",
    author: "Liev Tolstói",
    description: "A trágica história de Anna Karenina, uma mulher que desafia as convenções sociais da Rússia do século XIX.",
    publisher: "Companhia das Letras",
    edition: "1ª edição",
    numberOfPages: 864,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    description: "A vida de Jane Eyre, uma órfã que enfrenta adversidades e encontra o amor em Thornfield Hall.",
    publisher: "Penguin Classics",
    edition: "3ª edição",
    numberOfPages: 532,
    language: "Inglês"
  },
  {
    isbn: String(isbn++),
    title: "Um Dia",
    author: "David Nicholls",
    description: "Acompanhe Emma e Dexter durante vinte anos de encontros e reencontros sempre no mesmo dia do ano.",
    publisher: "Intrínseca",
    edition: "1ª edição",
    numberOfPages: 416,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "Como Eu Era Antes de Você",
    author: "Jojo Moyes",
    description: "A história emocionante entre Louisa Clark e Will Traynor, um homem tetraplégico que muda sua vida.",
    publisher: "Intrínseca",
    edition: "1ª edição",
    numberOfPages: 320,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "A Culpa é das Estrelas",
    author: "John Green",
    description: "Hazel Grace e Augustus Waters vivem uma tocante história de amor em meio às dificuldades do câncer.",
    publisher: "Intrínseca",
    edition: "1ª edição",
    numberOfPages: 288,
    language: "Português"
  }
];

const fictionBooks = [
  {
    isbn: String(isbn++),
    title: "1984",
    author: "George Orwell",
    description: "Uma distopia clássica que retrata um regime totalitário e o controle absoluto do Grande Irmão.",
    publisher: "Companhia das Letras",
    edition: "1ª edição",
    numberOfPages: 416,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "Admirável Mundo Novo",
    author: "Aldous Huxley",
    description: "Um futuro distópico em que a tecnologia e a manipulação genética definem a sociedade.",
    publisher: "Globo Livros",
    edition: "1ª edição",
    numberOfPages: 312,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "O Senhor dos Anéis",
    author: "J.R.R. Tolkien",
    description: "A saga épica da Terra-média, acompanhando Frodo em sua missão de destruir o Um Anel.",
    publisher: "Martins Fontes",
    edition: "2ª edição",
    numberOfPages: 1216,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "Fahrenheit 451",
    author: "Ray Bradbury",
    description: "Um futuro onde os livros são proibidos e queimados por bombeiros, criticando a censura e a alienação.",
    publisher: "Biblioteca Azul",
    edition: "1ª edição",
    numberOfPages: 216,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "O Hobbit",
    author: "J.R.R. Tolkien",
    description: "A aventura de Bilbo Bolseiro ao lado de anões e do mago Gandalf em busca do tesouro de Smaug.",
    publisher: "HarperCollins Brasil",
    edition: "1ª edição",
    numberOfPages: 320,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "Laranja Mecânica",
    author: "Anthony Burgess",
    description: "A história de Alex e sua gangue em uma crítica à violência, livre-arbítrio e controle social.",
    publisher: "Aleph",
    edition: "1ª edição",
    numberOfPages: 272,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "O Conto da Aia",
    author: "Margaret Atwood",
    description: "Uma sociedade distópica onde mulheres são subjugadas e usadas como reprodutoras.",
    publisher: "Rocco",
    edition: "1ª edição",
    numberOfPages: 368,
    language: "Português"
  }
];

const horrorBooks = [
  {
    isbn: String(isbn++),
    title: "It: A Coisa",
    author: "Stephen King",
    description: "Um grupo de crianças enfrenta a entidade aterrorizante Pennywise em Derry.",
    publisher: "Suma",
    edition: "1ª edição",
    numberOfPages: 1104,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "O Exorcista",
    author: "William Peter Blatty",
    description: "A clássica história do exorcismo de uma jovem possuída por forças demoníacas.",
    publisher: "HarperCollins Brasil",
    edition: "1ª edição",
    numberOfPages: 400,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "Drácula",
    author: "Bram Stoker",
    description: "O conde Drácula busca expandir sua influência enquanto um grupo tenta detê-lo.",
    publisher: "Zahar",
    edition: "1ª edição",
    numberOfPages: 416,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "Frankenstein",
    author: "Mary Shelley",
    description: "Victor Frankenstein cria uma criatura que desafia os limites da ciência e da moral.",
    publisher: "Penguin Classics",
    edition: "1ª edição",
    numberOfPages: 288,
    language: "Inglês"
  },
  {
    isbn: String(isbn++),
    title: "O Iluminado",
    author: "Stephen King",
    description: "Jack Torrance enlouquece no isolado Hotel Overlook, colocando sua família em perigo.",
    publisher: "Suma",
    edition: "1ª edição",
    numberOfPages: 528,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "A Assombração da Casa da Colina",
    author: "Shirley Jackson",
    description: "Um clássico do terror gótico sobre uma casa assombrada e seus visitantes.",
    publisher: "Suma",
    edition: "1ª edição",
    numberOfPages: 240,
    language: "Português"
  },
  {
    isbn: String(isbn++),
    title: "Bird Box",
    author: "Josh Malerman",
    description: "Uma força misteriosa leva as pessoas à loucura quando vista, forçando a sobrevivência às cegas.",
    publisher: "Intrínseca",
    edition: "1ª edição",
    numberOfPages: 272,
    language: "Português"
  }
]

export const booksPerCategory = {
  "romance": romanceBooks,
  "ficção": fictionBooks,
  "terror": horrorBooks
}

export function findBy(isbn: string): Book | undefined {
  const books: Book[] = [...romanceBooks, ...fictionBooks, ...horrorBooks];
  return books.find(book => book.isbn === isbn);
}
