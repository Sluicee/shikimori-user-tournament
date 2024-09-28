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
    }
  }, []);

  const fetchAnimeList = async (username: string) => {
    setError(null); // Сбрасываем ошибку перед новым запросом
    setIsLoading(true); // Устанавливаем isLoading в true перед началом загрузки
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
        let allAnimeData: any[] = [];
        let page = 1;
        let totalAnimeFetched = 0;
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
                userRates(userId: ${userId}, page: ${page}, limit: 50, targetType: Anime, order: { field: updated_at, order: desc }) {
                  id
                  anime { id name poster { miniUrl } url }
                  score
                  status
                }
              }`,
            }),
          });
  
          ratesData = await ratesResponse.json();
          const animeData = ratesData?.data?.userRates || [];
  
          // Добавляем полученные аниме в общий массив
          allAnimeData = [...allAnimeData, ...animeData];
          totalAnimeFetched = animeData.length;
  
          page++; // Переход к следующей странице
        } while (totalAnimeFetched === 50); // Если получили 50, значит, есть еще страницы
  
        // Фильтрация по статусу после получения всех данных
        const filteredAnimeData = allAnimeData
          .filter((rate: any) => rate.status === 'completed')
          .map((rate: any) => ({
            title: rate.anime.name,
            score: rate.score,
            seriesAnimedbId: rate.anime.id,
            url: rate.anime.url,
          })) || [];
  
        setAnimeList(filteredAnimeData);
        setCurrentRound(1);
        setResults(filteredAnimeData.reduce((acc: { [x: string]: number; }, anime: { title: string | number; }) => {
          acc[anime.title] = 0;
          return acc;
        }, {}));
        setFinished(false);
      } else {
        setError('User not found. Please check the username.'); // Устанавливаем сообщение об ошибке
      }
    } catch (error) {
      setError('Error fetching anime list.'); // Устанавливаем сообщение об ошибке в случае ошибки запроса
      console.error('Error fetching anime list:', error);
    } finally {
      setIsLoading(false); // Устанавливаем isLoading в false после завершения загрузки
    }
  };
  
  

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnimeList(username);
  };

  const fetchPoster = async (seriesAnimedbId: string) => {
    const cachedPoster = localStorage.getItem(`poster_${seriesAnimedbId}`);
    if (cachedPoster) {
      console.log(`Poster for ID ${seriesAnimedbId} fetched from cache.`);
      return cachedPoster;
    }
  
    console.log(`Fetching poster for ID: ${seriesAnimedbId}`);
    const query = `
      {
        animes(ids: "${seriesAnimedbId}") {
          poster {
            originalUrl
            mainUrl
          }
        }
      }`;
  
    try {
      const response = await fetch('https://shikimori.one/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
  
      if (response.status === 429) {
        console.error('Too many requests. Waiting before retrying...');
        await new Promise((res) => setTimeout(res, 2000)); // Подождать 2 секунды
        return fetchPoster(seriesAnimedbId); // Повторить запрос
      }
  
      const data = await response.json();
      const posterUrl = data?.data?.animes?.[0]?.poster?.originalUrl || null;
  
      if (posterUrl) {
        localStorage.setItem(`poster_${seriesAnimedbId}`, posterUrl); // Сохранить постер в localStorage
      }
  
      return posterUrl;
    } catch (error) {
      console.error('Error fetching poster:', error);
      return null; // Вернуть null в случае ошибки
    }
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
  
      // Запрос постеров для аниме в первой паре
      await loadPostersForPair(generatedPairs[0]);
    }
  };

  const loadPostersForPair = async (pair: any[]) => {
    for (const anime of pair) {
      if (!posters[anime.seriesAnimedbId]) {
        const posterUrl = await fetchPoster(anime.seriesAnimedbId);
        console.log(`Poster fetched for ${anime.seriesAnimedbId}: ${posterUrl}`); // Логируем URL постера
        setPosters((prev) => ({ ...prev, [anime.seriesAnimedbId]: posterUrl }));
      }
    }
  };

  const handleVote = async (winner: any, draw: boolean = false) => {
    if (!draw) {
      setResults((prevResults) => ({
        ...prevResults,
        [winner.title]: (prevResults[winner.title] || 0) + 2,
      }));
    } else {
      setResults((prevResults) => ({
        ...prevResults,
        [pairs[0][0].title]: (prevResults[pairs[0][0].title] || 0) + 1,
        [pairs[0][1].title]: (prevResults[pairs[0][1].title] || 0) + 1,
      }));
    }
  
    const currentPairs = pairs.slice(1);
    setPairs(currentPairs);
  
    // Проверяем, есть ли еще пары для голосования
    if (currentPairs.length > 0) {
      // Загружаем постеры для следующей пары
      await loadPostersForPair(currentPairs[0]);
    } else if (currentRound < rounds) {
      setCurrentRound((prev) => prev + 1);
      const nextPairs = generateTournamentPairs();
      setPairs(nextPairs);
      
      // Запрос постеров для новой пары
      await loadPostersForPair(nextPairs[0]);
    } else {
      setFinished(true);
    }

    saveTournamentState();
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
                'Fetch Anime List'
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
            pairs={pairs}
            posters={posters}
            handleVote={handleVote}
          />
        )}
  
        
        {animeList.length > 0 && (
          <Results sortedAnime={sortedAnime} />
        )}
      </div>
  );
  
};

export default Home;