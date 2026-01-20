export type CelebrityStatus = 'alive' | 'dead';

export interface Celebrity {
  id: string;
  name: string;
  status: CelebrityStatus;
  birthDate: string; // ISO format: YYYY-MM-DD
  deathDate: string | null; // ISO format: YYYY-MM-DD or null if alive
  description: string;
  occupation: string;
  image?: string;
}

export const celebrities: Celebrity[] = [
  {
    id: '1',
    name: 'Steve Jobs',
    status: 'dead',
    birthDate: '1955-02-24',
    deathDate: '2011-10-05',
    description: 'Co-founder of Apple Inc. and a pioneer of the personal computer revolution.',
    occupation: 'Entrepreneur, Designer, Inventor',
  },
  {
    id: '2',
    name: 'Michael Jackson',
    status: 'dead',
    birthDate: '1958-08-29',
    deathDate: '2009-06-25',
    description: 'The "King of Pop", one of the most significant cultural figures of the 20th century.',
    occupation: 'Singer, Songwriter, Dancer',
  },
  {
    id: '3',
    name: 'Elon Musk',
    status: 'alive',
    birthDate: '1971-06-28',
    deathDate: null,
    description: 'Founder, CEO and chief engineer of SpaceX; angel investor, CEO and product architect of Tesla, Inc.',
    occupation: 'Entrepreneur, Engineer',
  },
  {
    id: '4',
    name: 'Bill Gates',
    status: 'alive',
    birthDate: '1955-10-28',
    deathDate: null,
    description: 'Co-founder of Microsoft Corporation and a leading philanthropist.',
    occupation: 'Entrepreneur, Software Developer, Philanthropist',
  },
  {
    id: '5',
    name: 'Kobe Bryant',
    status: 'dead',
    birthDate: '1978-08-23',
    deathDate: '2020-01-26',
    description: 'Professional basketball player who spent his entire 20-year career with the Los Angeles Lakers.',
    occupation: 'Athlete',
  },
  {
    id: '6',
    name: 'Taylor Swift',
    status: 'alive',
    birthDate: '1989-12-13',
    deathDate: null,
    description: 'Singer-songwriter known for her narrative songwriting and musical versatility.',
    occupation: 'Singer, Songwriter',
  },
  {
    id: '7',
    name: 'Chadwick Boseman',
    status: 'dead',
    birthDate: '1976-11-29',
    deathDate: '2020-08-28',
    description: 'Actor known for his portrayals of real-life historical figures and the superhero Black Panther.',
    occupation: 'Actor',
  },
  {
    id: '8',
    name: 'Mark Zuckerberg',
    status: 'alive',
    birthDate: '1984-05-14',
    deathDate: null,
    description: 'Co-founder of Facebook, Inc. and its parent company Meta Platforms.',
    occupation: 'Entrepreneur, Software Developer',
  },
];
