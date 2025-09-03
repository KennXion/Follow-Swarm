import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Loader, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Play,
  Users
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Follow Artists</h2>
          <p className="text-gray-600 mt-1">Discover and follow new artists to grow your network</p>
        </div>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Rate Limit Warning */}
      {!canFollow && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="text-red-800 font-medium">Rate limit reached</p>
              <p className="text-red-600 text-sm mt-1">
                Next available slot: {new Date(rateLimits.nextAvailableSlot).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {selectedArtists.size} artist{selectedArtists.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={selectAll}
              className="text-sm text-spotify-green hover:underline"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="text-sm text-gray-500 hover:underline"
            >
              Deselect All
            </button>
          </div>
          <button
            onClick={followSelected}
            disabled={selectedArtists.size === 0 || following || !canFollow}
            className="flex items-center px-6 py-2 bg-spotify-green text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {following ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Following...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Follow Selected
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
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No artist suggestions available</p>
          <p className="text-gray-500 text-sm mt-2">Try refreshing or check back later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {suggestions.map((artist) => (
            <div
              key={artist.artistId}
              onClick={() => toggleArtist(artist.artistId)}
              className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-lg ${
                selectedArtists.has(artist.artistId) 
                  ? 'ring-2 ring-spotify-green' 
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-spotify-green bg-opacity-10 rounded-full flex items-center justify-center">
                      <UserPlus className="h-6 w-6 text-spotify-green" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {artist.name || 'Unknown Artist'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {artist.metadata?.followers || 0} followers
                      </p>
                    </div>
                  </div>
                </div>
                <div className="ml-2">
                  {selectedArtists.has(artist.artistId) ? (
                    <CheckCircle className="h-5 w-5 text-spotify-green" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Follow;