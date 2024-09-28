import React from 'react';

interface ResultsProps {
  sortedAnime: { title: string; score: number; url: string }[];
}

const Results: React.FC<ResultsProps> = ({ sortedAnime }) => {
  return (
    <div>
      <h3 className="text-2xl font-bold text-white mb-4">Results:</h3>
      <ul className="list-disc pl-5 text-gray-300">
        {sortedAnime.map((anime, index) => (
          <li key={anime.title} className="flex justify-between items-center text-lg text-white mb-2">
            <a className="font-semibold" href={anime.url}>{index + 1}. {anime.title}</a>
            <span className="ml-4 text-xl font-bold text-green-200">{anime.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Results;
