import React from 'react';

interface TournamentRoundProps {
  currentRound: number;
  rounds: number;
  pairs: any[]; // Массив пар аниме
  posters: { [key: string]: string }; // Объект с постерами аниме
  handleVote: (winner: any, draw?: boolean) => void; // Функция для обработки голосования
}

const TournamentRound: React.FC<TournamentRoundProps> = ({
  currentRound,
  rounds,
  pairs,
  posters,
  handleVote,
}) => {
  return (
    <>
      <h2 className="text-3xl font-bold text-white mb-4 text-center">
        Current Round: {currentRound}/{rounds}
      </h2>
      {pairs.length > 0 && (
        <div className="flex justify-between mb-6 p-6 rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 shadow-lg">
          {/* Первая аниме пара */}
          <div className="flex-1 text-center p-4 bg-white rounded-lg shadow-lg transition-transform duration-300">
            <img
              src={posters[pairs[0][0].seriesAnimedbId]}
              alt={`${pairs[0][0].title} poster`}
              className="mx-auto w-48 h-auto rounded-lg cursor-pointer transition-transform duration-200 hover:scale-105"
              onClick={() => handleVote(pairs[0][0])} // Обработка голосования для первого аниме
            />
            <h3 className="text-lg font-semibold text-gray-800 mb-2 mx-auto w-64 h-auto  min-h-[60px] flex items-center justify-center">
              {pairs[0][0].title} (Score: {pairs[0][0].score})
            </h3>
          </div>

          {/* Сравнение */}
          <div className="flex flex-col items-center justify-center p-4">
            <span className="text-2xl font-bold text-white mb-2">VS</span>
            <button
              onClick={() => handleVote(pairs[0][0], true)} // Обработка ничьей
              className="block bg-gradient-to-r from-pink-300 to-orange-300 hover:from-blue-300 hover:to-cyan-300 text-black mt-4 px-6 py-3 rounded-lg shadow transition-all duration-200"
            >
              Draw
            </button>
          </div>

          {/* Вторая аниме пара */}
          <div className="flex-1 text-center p-4 bg-white rounded-lg shadow-lg transition-transform duration-300">
            <img
              src={posters[pairs[0][1].seriesAnimedbId]}
              alt={`${pairs[0][1].title} poster`}
              className="mx-auto w-48 h-auto rounded-lg cursor-pointer transition-transform duration-200 hover:scale-105"
              onClick={() => handleVote(pairs[0][1])} // Обработка голосования для второго аниме
            />
            <h3 className="text-lg font-semibold text-gray-800 mb-2 mx-auto w-64 h-auto  min-h-[60px] flex items-center justify-center">
              {pairs[0][1].title} (Score: {pairs[0][1].score})
            </h3>
          </div>
        </div>
      )}
    </>
  );
};

export default TournamentRound;
