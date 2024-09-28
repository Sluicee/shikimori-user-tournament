import React from 'react';

interface AnimeData {
  title: string;
  score: number;
  seriesAnimedbId: number;
  url: string;
  poster: string;
}

interface TournamentRoundProps {
  currentRound: number;
  rounds: number;
  currentPairIndex: number;
  totalPairs: number;
  pairs: AnimeData[][]; // Массив пар аниме
  voteHistory: AnimeData[][];
  posters: { [key: string]: string }; // Объект с постерами аниме
  handleVote: (winner: AnimeData, draw?: boolean) => void; // Функция для обработки голосования
  handleBackToPreviousPair: () => void;
}

const TournamentRound: React.FC<TournamentRoundProps> = ({
  currentRound,
  rounds,
  currentPairIndex,
  totalPairs,
  pairs,
  voteHistory,
  posters,
  handleVote,
  handleBackToPreviousPair,
}) => {
  return (
    <>
      <div className="text-white mt-4">
        Round {currentRound} of {rounds} - Pair {currentPairIndex + 1} of {totalPairs}
      </div>
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
            <h3 className="text-lg font-semibold text-gray-800 mb-2 mx-auto w-64 h-auto min-h-[60px] flex items-center justify-center">
              {pairs[0][0].title} (Score: {pairs[0][0].score})
            </h3>
          </div>

          {/* Сравнение */}
          <div className="flex flex-col items-center justify-center p-4">
            <span className="text-2xl font-bold text-white mb-2">VS</span>
            <button
              onClick={() => handleVote(pairs[0][0], true)} // Обработка ничьей
              className="block bg-gradient-to-r from-pink-300 to-orange-300 hover:from-pink-400 hover:to-orange-400 text-white mt-4 px-6 py-3 rounded-lg shadow transition-all duration-200"
            >
              Draw
            </button>
            {voteHistory.length > 0 && (
              <button
                onClick={() => handleBackToPreviousPair()}
                className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-all mt-4"
              >
                Back
              </button>
            )}
          </div>


          {/* Вторая аниме пара */}
          <div className="flex-1 text-center p-4 bg-white rounded-lg shadow-lg transition-transform duration-300">
            <img
              src={posters[pairs[0][1].seriesAnimedbId]}
              alt={`${pairs[0][1].title} poster`}
              className="mx-auto w-48 h-auto rounded-lg cursor-pointer transition-transform duration-200 hover:scale-105"
              onClick={() => handleVote(pairs[0][1])} // Обработка голосования для второго аниме
            />
            <h3 className="text-lg font-semibold text-gray-800 mb-2 mx-auto w-64 h-auto min-h-[60px] flex items-center justify-center">
              {pairs[0][1].title} (Score: {pairs[0][1].score})
            </h3>
          </div>
        </div>
      )}
    </>
  );
};

export default TournamentRound;
