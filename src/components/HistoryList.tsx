import React, { useState } from 'react';
import { WorkoutLog, WorkoutType } from '../types';
import { Dumbbell, Bike, Footprints, Trash2, Search, Filter } from 'lucide-react';

interface HistoryListProps {
  logs: WorkoutLog[];
  onDeleteLog: (id: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ logs, onDeleteLog }) => {
  const [filterType, setFilterType] = useState<WorkoutType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Sorted most recent first
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  // Filter & Search
  const filteredLogs = sortedLogs.filter(log => {
    const matchesType = filterType === 'ALL' || log.type === filterType;
    const matchesSearch = !searchTerm || (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getLogBadge = (type: WorkoutType) => {
    switch (type) {
      case WorkoutType.INDOOR:
        return {
          icon: <Dumbbell className="w-4 h-4 text-emerald-600" />,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-100',
          textColor: 'text-emerald-800'
        };
      case WorkoutType.WALK_RUN:
        return {
          icon: <Footprints className="w-4 h-4 text-blue-600" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-100',
          textColor: 'text-blue-800'
        };
      case WorkoutType.BICYCLE:
        return {
          icon: <Bike className="w-4 h-4 text-indigo-600" />,
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-100',
          textColor: 'text-indigo-800'
        };
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div id="history-list-section" className="space-y-4">
      {/* Search and Filters Header */}
      <div id="history-filters-bar" className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="search-notes-input"
            className="w-full text-xs pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 text-gray-700"
          />
        </div>

        {/* Filter Buttons */}
        <div id="filter-btn-row" className="flex flex-wrap gap-1.5 items-center w-full md:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'ALL'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Logs
          </button>
          {Object.values(WorkoutType).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === type
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      <div id="history-items-container" className="space-y-3">
        {filteredLogs.length > 0 ? (
          filteredLogs.map(log => {
            const style = getLogBadge(log.type);
            return (
              <div
                key={log.id}
                id={`history-item-${log.id}`}
                className={`bg-white p-4 rounded-2xl border ${style.borderColor} shadow-sm hover:shadow transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative group`}
              >
                {/* Details side */}
                <div className="flex gap-3.5 items-start">
                  <div className={`p-3 rounded-xl ${style.bgColor} ${style.textColor} shrink-0`}>
                    {style.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.bgColor} ${style.textColor}`}>
                        {log.type}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {formatDate(log.timestamp)} at {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-extrabold text-gray-900">
                        {log.durationMinutes} Minutes Tracked
                      </p>
                    </div>
                    {log.notes && (
                      <p className="text-xs text-gray-600 italic mt-1 font-medium bg-gray-50/50 p-2 rounded-xl border border-gray-100 max-w-xl">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => onDeleteLog(log.id)}
                  id={`btn-delete-log-${log.id}`}
                  className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors sm:self-center shrink-0"
                  title="Delete log"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-gray-400 bg-white border border-gray-100 rounded-2xl space-y-2">
            <Filter className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-sm font-semibold">No workouts found matching your selection</p>
            <p className="text-xs">Try clearing filters or logging a new workout!</p>
          </div>
        )}
      </div>
    </div>
  );
};
