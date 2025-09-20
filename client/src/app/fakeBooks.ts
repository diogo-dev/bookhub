let isbn = 1;

const romanceBooks = [
  {
    isbn: isbn++,
    title: "O Amor nos Tempos do Cólera",
    author: "Gabriel García Márquez"
  },
  {
    isbn: isbn++,
    title: "Orgulho e Preconceito",
    author: "Jane Austen"
  },
  {
    isbn: isbn++,
    title: "Anna Kariênina",
    author: "Liev Tolstói"
  },
  {
    isbn: isbn++,
    title: "Jane Eyre",
    author: "Charlotte Brontë"
  },
  {
    isbn: isbn++,
    title: "Um Dia",
    author: "David Nicholls"
  },
  {
    isbn: isbn++,
    title: "Como Eu Era Antes de Você",
    author: "Jojo moyes"
  },
  {
    isbn: isbn++,
    title: "A Culpa é das Estrelas",
    author: "John Green"
  }
];

const fictionBooks = [
  {
    isbn: isbn++,
    title: "1984",
    author: "George Orwell"
  },
  {
    isbn: isbn++,
    title: "Admirável Mundo Novo",
    author: "Aldous Huxley"
  },
  {
    isbn: isbn++,
    title: "O Senhor dos Anéis",
    author: "J.R.R. Tolkien"
  },
  {
    isbn: isbn++,
    title: "Fahrenheit 451",
    author: "Ray Bradbury"
  },
  {
    isbn: isbn++,
    title: "O Hobbit",
    author: "J.R.R. Tolkien"
  },
  {
    isbn: isbn++,
    title: "Laranja Mecânica",
    author: "Anthony Burgess"
  },
  {
    isbn: isbn++,
    title: "O Conto da Aia",
    author: "Margaret Atwood"
  }
];

const horrorMovies = [
  {
    isbn: isbn++,
    title: "It: A Coisa",
    author: "Stephen King"
  },
  {
    isbn: isbn++,
    title: "O Exorcista",
    author: "William Peter Blatty"
  },
  {
    isbn: isbn++,
    title: "Drácula",
    author: "Bram Stoker"
  },
  {
    isbn: isbn++,
    title: "Frankenstein",
    author: "Mary Shelley"
  },
  {
    isbn: isbn++,
    title: "O Iluminado",
    author: "Stephen King"
  },
  {
    isbn: isbn++,
    title: "A Assombração da Casa da Colina",
    author: "Shirley Jackson"
  },
  {
    isbn: isbn++,
    title: "Bird Box",
    author: "Josh Malerman"
  }
]

export const booksPerCategory = {
  "romance": romanceBooks,
  "ficção": fictionBooks,
  "terror": horrorMovies
}
