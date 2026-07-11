export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export interface QuizCategory {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  questions: QuizQuestion[];
}

export const quizCategories: QuizCategory[] = [
  {
    id: "general-knowledge",
    title: "General Knowledge",
    description: "Test your knowledge about the world!",
    emoji: "🌍",
    color: "from-blue-500 to-cyan-500",
    questions: [
      { question: "What is the largest planet in our solar system?", options: ["Earth", "Jupiter", "Saturn", "Mars"], correct: 1, explanation: "Jupiter is the largest planet, with a diameter of about 139,820 km." },
      { question: "Which element has the chemical symbol 'Au'?", options: ["Silver", "Aluminum", "Gold", "Argon"], correct: 2, explanation: "Au comes from the Latin word 'Aurum' meaning gold." },
      { question: "What is the smallest country in the world?", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], correct: 1, explanation: "Vatican City is only about 44 hectares (110 acres)." },
      { question: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], correct: 2, explanation: "The seven continents are Asia, Africa, North America, South America, Antarctica, Europe, and Australia." },
      { question: "What is the hardest natural substance on Earth?", options: ["Titanium", "Diamond", "Quartz", "Sapphire"], correct: 1, explanation: "Diamond scores a 10 on the Mohs hardness scale." },
      { question: "Which ocean is the largest?", options: ["Atlantic", "Indian", "Pacific", "Arctic"], correct: 2, explanation: "The Pacific Ocean covers about 63 million square miles." },
      { question: "What year did World War II end?", options: ["1943", "1944", "1945", "1946"], correct: 2, explanation: "WWII ended in 1945 with Japan's surrender." },
      { question: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"], correct: 2, explanation: "Canberra was chosen as the capital in 1908 as a compromise between Sydney and Melbourne." },
      { question: "How many bones are in the adult human body?", options: ["186", "196", "206", "216"], correct: 2, explanation: "Babies are born with about 270 bones, but many fuse together." },
      { question: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], correct: 0, explanation: "Light travels at approximately 299,792 km/s in a vacuum." },
    ],
  },
  {
    id: "science",
    title: "Science & Nature",
    description: "How well do you know science?",
    emoji: "🔬",
    color: "from-green-500 to-emerald-500",
    questions: [
      { question: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correct: 2 },
      { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi Body"], correct: 1 },
      { question: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], correct: 1 },
      { question: "What is the chemical formula for water?", options: ["HO2", "H2O", "H2O2", "OH"], correct: 1 },
      { question: "How many teeth does an adult human have?", options: ["28", "30", "32", "34"], correct: 2 },
      { question: "What is the largest organ in the human body?", options: ["Liver", "Brain", "Skin", "Heart"], correct: 2 },
      { question: "What force keeps us on the ground?", options: ["Magnetism", "Gravity", "Friction", "Inertia"], correct: 1 },
      { question: "What is the boiling point of water in Celsius?", options: ["90°C", "95°C", "100°C", "110°C"], correct: 2 },
      { question: "What type of animal is a dolphin?", options: ["Fish", "Reptile", "Mammal", "Amphibian"], correct: 2 },
      { question: "What does DNA stand for?", options: ["Deoxyribonucleic Acid", "Deoxyribose Nucleic Acid", "Dynamic Nuclear Acid", "Di-Nucleotide Acid"], correct: 0 },
    ],
  },
  {
    id: "movies",
    title: "Movies & Entertainment",
    description: "Are you a true movie buff?",
    emoji: "🎬",
    color: "from-purple-500 to-pink-500",
    questions: [
      { question: "Who directed 'Inception'?", options: ["Steven Spielberg", "Christopher Nolan", "James Cameron", "Martin Scorsese"], correct: 1 },
      { question: "What is the highest-grossing film of all time?", options: ["Avengers: Endgame", "Avatar", "Titanic", "Star Wars"], correct: 1 },
      { question: "Which movie features the quote 'I'll be back'?", options: ["Robocop", "Die Hard", "The Terminator", "Predator"], correct: 2 },
      { question: "Who played Jack in Titanic?", options: ["Brad Pitt", "Matt Damon", "Leonardo DiCaprio", "Johnny Depp"], correct: 2 },
      { question: "In which year was the first Harry Potter movie released?", options: ["1999", "2000", "2001", "2002"], correct: 2 },
      { question: "What is the name of the fictional country in Black Panther?", options: ["Genovia", "Wakanda", "Zamunda", "Latveria"], correct: 1 },
      { question: "Which studio created 'Toy Story'?", options: ["DreamWorks", "Disney", "Pixar", "Blue Sky"], correct: 2 },
      { question: "Who played the Joker in 'The Dark Knight'?", options: ["Jack Nicholson", "Jared Leto", "Joaquin Phoenix", "Heath Ledger"], correct: 3 },
      { question: "What is the longest running film franchise?", options: ["James Bond", "Marvel", "Star Wars", "Fast & Furious"], correct: 0 },
      { question: "Which movie won Best Picture at the 2020 Oscars?", options: ["1917", "Joker", "Parasite", "Once Upon a Time"], correct: 2 },
    ],
  },
  {
    id: "tech",
    title: "Technology",
    description: "How tech-savvy are you?",
    emoji: "💻",
    color: "from-indigo-500 to-violet-500",
    questions: [
      { question: "Who founded Apple?", options: ["Bill Gates", "Steve Jobs", "Elon Musk", "Jeff Bezos"], correct: 1 },
      { question: "What does 'HTTP' stand for?", options: ["HyperText Transfer Protocol", "High Tech Transfer Protocol", "HyperText Transport Platform", "High Transfer Text Protocol"], correct: 0 },
      { question: "What year was the iPhone first released?", options: ["2005", "2006", "2007", "2008"], correct: 2 },
      { question: "What programming language is known as the language of the web?", options: ["Python", "Java", "JavaScript", "C++"], correct: 2 },
      { question: "What does 'AI' stand for?", options: ["Automated Intelligence", "Artificial Intelligence", "Advanced Integration", "Auto Information"], correct: 1 },
      { question: "Which company created Android?", options: ["Apple", "Microsoft", "Google", "Samsung"], correct: 2 },
      { question: "What is the most popular social media platform by users?", options: ["Instagram", "TikTok", "Facebook", "YouTube"], correct: 2 },
      { question: "What does 'URL' stand for?", options: ["Universal Resource Locator", "Uniform Resource Locator", "United Resource Link", "Unified Resource Location"], correct: 1 },
      { question: "Who is the CEO of Tesla?", options: ["Jeff Bezos", "Tim Cook", "Elon Musk", "Satya Nadella"], correct: 2 },
      { question: "What does RAM stand for?", options: ["Random Access Memory", "Read Access Memory", "Rapid Access Module", "Run Application Memory"], correct: 0 },
    ],
  },
  {
    id: "sports",
    title: "Sports",
    description: "Test your sports knowledge!",
    emoji: "⚽",
    color: "from-orange-500 to-red-500",
    questions: [
      { question: "How many players are on a soccer team?", options: ["9", "10", "11", "12"], correct: 2 },
      { question: "Which country has won the most FIFA World Cups?", options: ["Germany", "Argentina", "Italy", "Brazil"], correct: 3 },
      { question: "What sport is played at Wimbledon?", options: ["Cricket", "Tennis", "Golf", "Badminton"], correct: 1 },
      { question: "How many rings are on the Olympic flag?", options: ["4", "5", "6", "7"], correct: 1 },
      { question: "What is the national sport of Japan?", options: ["Judo", "Karate", "Sumo", "Baseball"], correct: 2 },
      { question: "Which country hosted the 2022 FIFA World Cup?", options: ["Russia", "Qatar", "Brazil", "USA"], correct: 1 },
      { question: "How many points is a touchdown worth in American football?", options: ["3", "5", "6", "7"], correct: 2 },
      { question: "What is the diameter of a basketball hoop in inches?", options: ["16", "18", "20", "22"], correct: 1 },
      { question: "Who has the most Grand Slam tennis titles (men)?", options: ["Roger Federer", "Rafael Nadal", "Novak Djokovic", "Pete Sampras"], correct: 2 },
      { question: "In which sport would you perform a 'slam dunk'?", options: ["Volleyball", "Basketball", "Tennis", "Handball"], correct: 1 },
    ],
  },
];
