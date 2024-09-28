"use client";

import React, { useEffect, useState } from 'react';
import TournamentRound from './TournamentRound';
import Results from './Results';

const Home = () => {
  const [username, setUsername] = useState<string>(''); // Состояние для логина пользователя
  const [error, setError] = useState<string | null>(null); // Состояние для хранения сообщения об ошибке
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [rounds, setRounds] = useState<number>(1);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [pairs, setPairs] = useState<any[]>([]);
  const [results, setResults] = useState<{ [key: string]: number }>({});
  const [finished, setFinished] = useState(false);
  const [posters, setPosters] = useState<{ [key: string]: string }>({});
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [targetType, setTargetType] = useState<'Anime' | 'Manga'>('Anime'); // Состояние для типа турнира
  const [currentPairIndex, setCurrentPairIndex] = useState<number>(0);
  const [totalPairs, setTotalPairs] = useState<number>(0);
  const [voteHistory, setVoteHistory] = useState<any[]>([]);

  useEffect(() => {
    const savedState = localStorage.getItem('tournamentState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      setUsername(parsedState.username);
      setAnimeList(parsedState.animeList);
      setRounds(parsedState.rounds);
      setCurrentRound(parsedState.currentRound);
      setPairs(parsedState.pairs);
      setResults(parsedState.results);
      setFinished(parsedState.finished);
      setPosters(parsedState.posters);
      setTournamentStarted(parsedState.tournamentStarted);
      setTargetType(parsedState.targetType || 'Anime'); // Восстанавливаем тип турнира
    }
  }, []);

  type AnimeData = {
    title: string;
    score: number;
    seriesAnimedbId: number;
    url: string;
    poster: string;
  };

  const fetchAnimeList = async (username: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
        const userResponse = await fetch('https://shikimori.one/api/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: `{
                    users(search: "${username}") { 
                        id
                    }
                }`,
            }),
        });

        const userData = await userResponse.json();
        const userId = userData?.data?.users?.[0]?.id;

        if (userId) {
            let allData: any[] = [];
            let page = 1;
            let totalFetched = 0;
            let ratesData;

            // Запрашиваем данные, пока они есть
            do {
                const ratesResponse = await fetch('https://shikimori.one/api/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        query: `{
                            userRates(userId: ${userId}, page: ${page}, limit: 50, targetType: ${targetType}, order: { field: updated_at, order: desc }) {
                                id
                                ${targetType === 'Anime' ? 'anime' : 'manga'} { id name poster { main2xUrl } url }
                                score
                                status
                            }
                        }`,
                    }),
                });

                ratesData = await ratesResponse.json();
                const data = ratesData?.data?.userRates || [];

                // Добавляем полученные данные в общий массив
                allData = [...allData, ...data];
                totalFetched = data.length;

                page++;
            } while (totalFetched === 50); // Если получили 50, значит, есть еще страницы

            // Фильтрация по статусу после получения всех данных
            const filteredData: AnimeData[] = allData
                .filter((rate: any) => rate.status === 'completed')
                .map((rate: any) => {
                    const targetItem = rate[targetType === 'Anime' ? 'anime' : 'manga'];
                    if (targetItem) {
                        const posterUrl = targetItem.poster?.main2xUrl || ''; // Получаем URL постера
                        return {
                            title: targetItem.name,
                            score: rate.score,
                            seriesAnimedbId: targetItem.id,
                            url: targetItem.url,
                            poster: posterUrl, // Добавляем URL постера
                        };
                    }
                    return null; // Вернем null, если targetItem не найден
                })
                .filter((item): item is AnimeData => item !== null); // Фильтруем null значения и типизируем

            setAnimeList(filteredData);
            setCurrentRound(1);
            setResults(filteredData.reduce((acc: { [x: string]: number; }, anime: AnimeData) => {
                acc[anime.title] = 0;
                return acc;
            }, {}));
            setFinished(false);
        } else {
            setError('User not found. Please check the username.');
        }
    } catch (error) {
        setError('Error fetching anime list.');
        console.error('Error fetching anime list:', error);
    } finally {
        setIsLoading(false);
    }
  };


  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnimeList(username);
  };

  const generateTournamentPairs = () => {
    const sortedAnime = [...animeList].map(anime => ({
      ...anime,
      totalScore: anime.score + (results[anime.title] || 0)
    })).sort((a, b) => b.totalScore - a.totalScore);

    const pairs: any[] = [];
    for (let i = 0; i < sortedAnime.length; i += 2) {
      if (sortedAnime[i + 1]) {
        pairs.push([sortedAnime[i], sortedAnime[i + 1]]);
      }
    }
    return pairs;
  };

  const startTournament = async () => {
    if (animeList.length > 0) {
      setTournamentStarted(true);
      const generatedPairs = generateTournamentPairs();
      setPairs(generatedPairs);
      setTotalPairs(generatedPairs.length);  // Устанавливаем общее количество пар
  
      // Запрос постеров для аниме в первой паре
      await loadPostersForPair(generatedPairs[0]);
    }
  };

  const loadPostersForPair = async (pair: any[]) => {
    for (const anime of pair) {
      if (!posters[anime.seriesAnimedbId]) {
        const posterUrl = anime.poster;
        console.log(`Poster fetched for ${anime.seriesAnimedbId}: ${posterUrl}`); // Логируем URL постера
        setPosters((prev) => ({ ...prev, [anime.seriesAnimedbId]: posterUrl }));
      }
    }
  };

  const handleVote = async (winner: any, draw: boolean = false) => {
    const currentPair = pairs[0]; // Сохраняем текущую пару
  
    // Сохраняем голос в историю (включаем информацию о ничьей)
    setVoteHistory((prevHistory) => [
      ...prevHistory,
      { pair: currentPair, winner, draw },
    ]);
  
    if (!draw) {
      setResults((prevResults) => ({
        ...prevResults,
        [winner.title]: (prevResults[winner.title] || 0) + 2,
      }));
    } else {
      setResults((prevResults) => ({
        ...prevResults,
        [currentPair[0].title]: (prevResults[currentPair[0].title] || 0) + 1,
        [currentPair[1].title]: (prevResults[currentPair[1].title] || 0) + 1,
      }));
    }
  
    const currentPairs = pairs.slice(1);
    setPairs(currentPairs);
    setCurrentPairIndex((prevIndex) => prevIndex + 1);
  
    if (currentPairs.length > 0) {
      await loadPostersForPair(currentPairs[0]);
    } else if (currentRound < rounds) {
      setCurrentRound((prev) => prev + 1);
      const nextPairs = generateTournamentPairs();
      setPairs(nextPairs);
      setTotalPairs(nextPairs.length);
      setCurrentPairIndex(0);
      await loadPostersForPair(nextPairs[0]);
    } else {
      setFinished(true);
    }
  
    saveTournamentState();
  };   

  const handleBackToPreviousPair = () => {
    if (voteHistory.length > 0) {
      const lastVote = voteHistory[voteHistory.length - 1]; // Последний голос
      const { pair, winner, draw } = lastVote;
  
      // Восстанавливаем предыдущую пару
      setPairs([pair, ...pairs]);
      setVoteHistory(voteHistory.slice(0, -1)); // Убираем последний голос из истории
      setCurrentPairIndex((prevIndex) => prevIndex - 1);
  
      // Корректируем результаты
      if (!draw) {
        // Если не ничья, то уменьшаем очки только у победителя
        setResults((prevResults) => ({
          ...prevResults,
          [winner.title]: (prevResults[winner.title] || 0) - 2,
        }));
      } else {
        // Если ничья, то уменьшаем очки у обоих
        setResults((prevResults) => ({
          ...prevResults,
          [pair[0].title]: (prevResults[pair[0].title] || 0) - 1,
          [pair[1].title]: (prevResults[pair[1].title] || 0) - 1,
        }));
      }
    }
  };  

  const sortedAnime = Object.entries(results)
    .map(([title, score]) => {
      const animeInfo = animeList.find(anime => anime.title === title); // находим информацию об аниме
      return {
        title,
        score,
        url: animeInfo ? animeInfo.url : '', // добавляем url
      };
    })
    .sort((a, b) => b.score - a.score);


  const resetTournament = () => {
    setUsername('');
    setAnimeList([]);
    setRounds(1);
    setCurrentRound(0);
    setPairs([]);
    setResults({});
    setFinished(false);
    setPosters({});
    setTournamentStarted(false); // Сбрасываем состояние
    setTargetType('Anime'); // Сбрасываем тип турнира
    saveTournamentState();
  };

  const saveTournamentState = () => {
    const state = {
      username,
      animeList,
      rounds,
      currentRound,
      pairs,
      results,
      finished,
      posters,
      tournamentStarted,
      targetType, // Сохраняем тип турнира
    };
    localStorage.setItem('tournamentState', JSON.stringify(state));
  };  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-500">
        <h1 className="text-4xl font-bold text-white mt-8">Anime Tournament</h1>

        {/* Отображение сообщения об ошибке */}
        {error && (
          <div className="bg-red-600 text-white text-center mb-4 p-4 rounded-lg shadow-lg transition duration-300 transform hover:scale-105">
            {error}
          </div>
        )}

        {!tournamentStarted ? (
          <form onSubmit={handleLoginSubmit} className="flex flex-col items-center mt-4 mb-6">
            <div className="flex mb-4">
              <div className="flex-1 mr-2">
                <label className="block text-lg font-semibold text-gray-300 mb-2">
                  Shikimori Username:
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white"
                  required
                />
              </div>
              <div className="flex-1 ml-2">
                <label className="block text-lg font-semibold text-gray-300 mb-2">
                  Number of Rounds:
                </label>
                <input
                  type="number"
                  value={rounds}
                  onChange={(e) => setRounds(Number(e.target.value))}
                  min={1}
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white"
                />
              </div>
            </div>

            {/* Переключатель между аниме и мангой */}
            <div className="flex mb-4">
              <label className="mr-4 text-lg font-semibold text-gray-300">
                <input
                  type="radio"
                  value="Anime"
                  checked={targetType === 'Anime'}
                  onChange={() => setTargetType('Anime')}
                  className="mr-2"
                />
                Anime
              </label>
              <label className="text-lg font-semibold text-gray-300">
                <input
                  type="radio"
                  value="Manga"
                  checked={targetType === 'Manga'}
                  onChange={() => setTargetType('Manga')}
                  className="mr-2"
                />
                Manga
              </label>
            </div>
            
            <button
              type="submit"
              className="flex justify-center w-full bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-white py-2 rounded-lg transition-all mb-4"
              disabled={isLoading}
              >
              {isLoading ? (
                <div className="flex items-center">
                  Loading...
                  <div className="loader ml-2"></div> {/* Добавляем анимацию загрузчика */}
                </div>
              ) : (
                'Fetch List'
              )}
            </button>
            {animeList.length > 0 && !tournamentStarted && (
              <button
                onClick={startTournament}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-900 hover:from-emerald-600 hover:to-emerald-900 text-white py-2 rounded-lg transition-all"
              >
                Start Tournament
              </button>
            )}
          </form>
        ) : (
          <button
            onClick={resetTournament}
            className="absolute top-4 right-4 flex items-center justify-center w-12 h-12 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all"
          >
            🔄️
          </button>
        )}
  
        
  
        {currentRound > 0 && (
          <TournamentRound
            currentRound={currentRound}
            rounds={rounds}
            currentPairIndex={currentPairIndex}
            totalPairs={totalPairs}
            pairs={pairs}
            voteHistory={voteHistory}
            posters={posters}
            handleVote={handleVote}
            handleBackToPreviousPair={handleBackToPreviousPair}
          />
        )}
  
        
        {animeList.length > 0 && (
          <Results sortedAnime={sortedAnime} />
        )}
      </div>
  );
  
};

export default Home;