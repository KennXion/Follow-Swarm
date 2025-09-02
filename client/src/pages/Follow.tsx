import { useState, useEffect } from 'react';
import { 
 
  Loader, 
  CheckCircle, 
  RefreshCw,
  Play,
  Users,
  Sparkles,
  Music,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { followAPI } from '../services/api';

interface Artist {
  artistId: string;
  name: string;
  metadata?: any;
}

const Follow = () => {
  const [suggestions, setSuggestions] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [rateLimits, setRateLimits] = useState<any>(null);

  useEffect(() => {
    fetchSuggestions();
    fetchRateLimits();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await followAPI.getSuggestions(20);
      setSuggestions(response.data.data);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRateLimits = async () => {
    try {
      const response = await followAPI.getRateLimits();
      setRateLimits(response.data.data);
    } catch (error) {
      console.error('Failed to fetch rate limits:', error);
    }
  };

  const toggleArtist = (artistId: string) => {
    const newSelected = new Set(selectedArtists);
    if (newSelected.has(artistId)) {
      newSelected.delete(artistId);
    } else {
      newSelected.add(artistId);
    }
    setSelectedArtists(newSelected);
  };

  const selectAll = () => {
    setSelectedArtists(new Set(suggestions.map(s => s.artistId)));
  };

  const deselectAll = () => {
    setSelectedArtists(new Set());
  };

  const followSelected = async () => {
    if (selectedArtists.size === 0) return;
    
    try {
      setFollowing(true);
      const artistIds = Array.from(selectedArtists);
      
      if (artistIds.length === 1) {
        await followAPI.followSingle(artistIds[0]);
      } else {
        await followAPI.followBatch(artistIds);
      }
      
      // Refresh data
      setSelectedArtists(new Set());
      await Promise.all([fetchSuggestions(), fetchRateLimits()]);
      
      // Show success message
      alert(`Successfully queued ${artistIds.length} follow(s)`);
    } catch (error: any) {
      console.error('Failed to follow artists:', error);
      alert(error.response?.data?.error || 'Failed to follow artists');
    } finally {
      setFollowing(false);
    }
  };

  const canFollow = rateLimits?.canFollow ?? true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Follow Artists</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Discover and follow new artists to grow your network</p>
        </div>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="group flex items-center px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-spotify-green dark:hover:border-spotify-green transition-all duration-200"
        >
          <RefreshCw className={`h-4 w-4 mr-2 group-hover:text-spotify-green transition-colors ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Rate Limit Warning */}
      {!canFollow && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-red-800 dark:text-red-300 font-medium">Rate limit reached</p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                Next available slot: {new Date(rateLimits.nextAvailableSlot).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-lg dark:shadow-none p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
              <Users className="h-4 w-4 text-spotify-green mr-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedArtists.size} artist{selectedArtists.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={selectAll}
              className="text-sm font-medium text-spotify-green hover:text-spotify-dark-green transition-colors"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Deselect All
            </button>
          </div>
          <button
            onClick={followSelected}
            disabled={selectedArtists.size === 0 || following || !canFollow}
            className="group relative flex items-center px-6 py-2.5 bg-gradient-to-r from-spotify-green to-green-500 text-white font-semibold rounded-xl hover:from-spotify-dark-green hover:to-green-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-spotify-green/30"
          >
            {following ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Following...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                Follow Selected
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-pulse" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Artists Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green"></div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 p-12 text-center">
          <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
            <Users className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-semibold text-lg">No artist suggestions available</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Try refreshing or check back later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {suggestions.map((artist, index) => (
            <div
              key={artist.artistId}
              onClick={() => toggleArtist(artist.artistId)}
              className={`group relative bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                selectedArtists.has(artist.artistId) 
                  ? 'border-spotify-green dark:border-spotify-green shadow-lg shadow-spotify-green/20' 
                  : 'border-gray-200 dark:border-gray-700/50'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-spotify-green/0 to-green-500/0 group-hover:from-spotify-green/5 group-hover:to-green-500/5 dark:group-hover:from-spotify-green/10 dark:group-hover:to-green-500/10 rounded-2xl transition-all duration-300" />
              
              <div className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className={`relative h-14 w-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        selectedArtists.has(artist.artistId)
                          ? 'bg-gradient-to-br from-spotify-green to-green-500'
                          : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 group-hover:from-spotify-green/20 group-hover:to-green-500/20'
                      }`}>
                        {selectedArtists.has(artist.artistId) ? (
                          <CheckCircle className="h-7 w-7 text-white" />
                        ) : (
                          <Music className="h-7 w-7 text-gray-500 dark:text-gray-400 group-hover:text-spotify-green transition-colors" />
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-spotify-green transition-colors">
                          {artist.name || 'Unknown Artist'}
                        </p>
                        <div className="flex items-center mt-1">
                          <TrendingUp className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 mr-1" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {artist.metadata?.followers?.toLocaleString() || 0} followers
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Selection indicator */}
                {selectedArtists.has(artist.artistId) && (
                  <div className="absolute top-2 right-2">
                    <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Follow;