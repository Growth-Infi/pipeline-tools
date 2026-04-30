'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, CheckSquare, Square, Loader2, AlertCircle, Calendar, Users, BrainCircuit, BookOpen, CheckCircle2 } from 'lucide-react';

const API_BASE = process.env.EMAIL_PIPELINE_URL;

interface Task {
  title: string;
  description: string;
  due: string | null;
}

interface Meeting {
  recording_id: number;
  title: string;
  created_at: string;
  action_items: any[];
  calendar_invitees?: { name: string; email: string; is_external: boolean }[];
}

interface MeetingBrowserModalProps {
  onClose: () => void;
}

type Stage = 'meetings' | 'extracting' | 'tasks' | 'pushing' | 'success';

export function MeetingBrowserModal({ onClose }: MeetingBrowserModalProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [stage, setStage] = useState<Stage>('meetings');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [clientName, setClientName] = useState(null)
  const [notionError, setNotionError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const fetchMeetings = async (cursor?: string) => {
    try {
      const url = cursor
        ? `${API_BASE}/fathom/meetings?cursor=${cursor}`
        : `${API_BASE}/fathom/meetings`;
      const res = await fetch(url);
      const data = await res.json();

      const items = (data.result || []).map((m: any) => ({
        recording_id: m.recording_id,
        title: m.title,
        created_at: m.created_at,
        action_items: m.action_items || [],
        calendar_invitees: m.calendar_invitees || [],
      }));

      setMeetings(prev => cursor ? [...prev, ...items] : items);
      setNextCursor(data.nextCursor || null);
    } catch {
      setError('Failed to load meetings');
    } finally {
      setLoadingMeetings(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchMeetings(); }, []);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el || loadingMore || !nextCursor) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      setLoadingMore(true);
      fetchMeetings(nextCursor);
    }
  };

  const handleSelectMeeting = async (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setStage('extracting');
    setError('');
    setTasks([]);
    setSelectedTasks(new Set());

    try {
      const res = await fetch(`${API_BASE}/fathom/meetings/${meeting.recording_id}/tasks?title=${encodeURIComponent(meeting.title)}`);
      const data = await res.json();
      console.log(data)
      const extracted: Task[] = data.actionItems.tasks || [];
      setTasks(extracted);
      setClientName(data.actionItems.client)
      setSelectedTasks(new Set(extracted.map((_, i) => i)));
      setStage('tasks');
    } catch (err) {
      console.log(err)
      setError('Failed to extract tasks from this meeting');
      setStage('meetings');
    }
  };

  const toggleTask = (idx: number) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelectedTasks(new Set(tasks.map((_, i) => i)));
  const clearAll = () => setSelectedTasks(new Set());

  const handlePushToNotion = async () => {
    if (!selectedMeeting || selectedTasks.size === 0) return;
    setStage('pushing');
    setNotionError('');

    const selectedTaskList = [...selectedTasks].map(i => tasks[i]);

    try {
      const res = await fetch(`${API_BASE}/notion/createPage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedMeeting.title,
          actionItems: {
            client: clientName || 'unknown', // client is same for all tasks
            tasks: selectedTaskList,
          }
        }),
      });
      if (!res.ok) throw new Error();
      setStage('success');
      setTimeout(onClose, 2000);
    } catch (err) {
      console.log(err)
      setNotionError('Failed to create Notion page');
      setStage('tasks');
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-full max-w-3xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0a0a0a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Fathom Meetings</h2>
              <p className="text-[10px] text-zinc-500">
                {stage === 'meetings' && 'Select a meeting to extract tasks'}
                {stage === 'extracting' && `Extracting tasks from "${selectedMeeting?.title}"…`}
                {stage === 'tasks' && `Tasks from "${selectedMeeting?.title}"`}
                {stage === 'pushing' && 'Creating Notion page…'}
                {stage === 'success' && 'Done!'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">

            {/* Meetings list */}
            {stage === 'meetings' && (
              <motion.div
                key="meetings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden flex"
              >
                <div
                  ref={listRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto"
                >
                  {loadingMeetings ? (
                    <div className="flex items-center justify-center h-full gap-2 text-zinc-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Loading meetings…</span>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-full gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs">{error}</span>
                    </div>
                  ) : meetings.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-600 text-xs">No meetings found</div>
                  ) : (
                    <div className="p-3 space-y-1.5">
                      {meetings.map(meeting => (
                        <button
                          key={meeting.recording_id}
                          onClick={() => handleSelectMeeting(meeting)}
                          className="w-full text-left p-3 rounded-xl transition-all border bg-transparent border-transparent hover:bg-white/5 hover:border-white/10 text-zinc-300 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-medium leading-snug line-clamp-1">{meeting.title}</p>
                            <BrainCircuit className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 transition-colors shrink-0 mt-0.5" />
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                              <Calendar className="w-3 h-3" />
                              {formatDate(meeting.created_at)}
                            </div>
                            {meeting.calendar_invitees && meeting.calendar_invitees.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                                <Users className="w-3 h-3" />
                                {meeting.calendar_invitees.length} invitees
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                      {loadingMore && (
                        <div className="flex items-center justify-center py-3 gap-2 text-zinc-600">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-[10px]">Loading more…</span>
                        </div>
                      )}
                      {!loadingMore && !nextCursor && meetings.length > 0 && (
                        <p className="text-center text-[10px] text-zinc-700 py-2">All meetings loaded</p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Extracting loading state */}
            {stage === 'extracting' && (
              <motion.div
                key="extracting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-4 p-8"
              >
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <BrainCircuit className="w-8 h-8 text-emerald-400 animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-white">Extracting tasks…</p>
                  <p className="text-[10px] text-zinc-500">Fetching transcript and running AI extraction, this may take a moment</p>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tasks list */}
            {stage === 'tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden flex flex-col"
              >
                <div className="px-5 py-3 border-b border-white/5 shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-500">{tasks.length} tasks extracted</span>
                    <button onClick={selectAll} className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors">Select all</button>
                    <button onClick={clearAll} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">Clear</button>
                  </div>
                  <button
                    onClick={() => setStage('meetings')}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    ← Back
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-600 text-xs">No tasks found in this meeting</div>
                  ) : (
                    tasks.map((task, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleTask(idx)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${selectedTasks.has(idx)
                          ? 'bg-emerald-500/10 border-emerald-500/25'
                          : 'bg-zinc-900/40 border-white/5 hover:border-white/10'
                          }`}
                      >
                        {selectedTasks.has(idx)
                          ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          : <Square className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-zinc-200 leading-snug">{task.title}</p>
                          {task.description && (
                            <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{task.description}</p>
                          )}
                          {task.due && (
                            <span className="inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Due: {task.due}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {notionError && (
                  <div className="px-5 py-2 shrink-0">
                    <p className="text-[10px] text-red-400">{notionError}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Pushing state */}
            {stage === 'pushing' && (
              <motion.div
                key="pushing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-4 p-8"
              >
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <BookOpen className="w-8 h-8 text-blue-400 animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-white">Creating Notion page…</p>
                  <p className="text-[10px] text-zinc-500">Pushing {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} to Notion</p>
                </div>
              </motion.div>
            )}

            {/* Success state */}
            {stage === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center gap-4 p-8"
              >
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-white">Notion page created!</p>
                  {clientName && clientName !== 'unknown' ? (
                    <p className="text-[10px] text-zinc-500">
                      Filed under <span className="text-emerald-400 font-medium">{clientName}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-zinc-500">Tasks pushed successfully</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {stage === 'tasks' && (
          <div className="p-5 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between shrink-0">
            <p className="text-[10px] text-zinc-600">
              {selectedTasks.size > 0 ? `${selectedTasks.size} task${selectedTasks.size > 1 ? 's' : ''} selected` : 'No tasks selected'}
            </p>
            <button
              onClick={handlePushToNotion}
              disabled={selectedTasks.size === 0}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Push to Notion
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}