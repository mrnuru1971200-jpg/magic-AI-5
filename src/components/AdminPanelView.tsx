/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Users, Activity, BarChart2, MessageSquare, Image, ShieldAlert, Sparkles, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { RequestLog, SystemStats } from "../types";

interface RegisteredUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: number;
  status: 'active' | 'suspended';
}

interface AdminPanelViewProps {
  isDarkMode: boolean;
}

export default function AdminPanelView({ isDarkMode }: AdminPanelViewProps) {
  const [stats, setStats] = useState<SystemStats>({
    totalChats: 0,
    totalImagesGenerated: 0,
    totalImagesEdited: 0,
    totalUsers: 0
  });
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch admin logs and statistics
  const fetchAdminData = async () => {
    try {
      setErrorMsg(null);
      const res = await fetch("/api/admin/payload");
      if (!res.ok) {
        throw new Error("Could not download admin audit telemetry.");
      }
      const data = await res.json();
      setStats(data.stats);
      setLogs(data.logs);
      setUsers(data.users);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load audit statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    // Poll every 8 seconds for dynamic monitoring
    const timer = setInterval(fetchAdminData, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleUserAction = async (userId: string, action: 'suspend' | 'promote' | 'delete') => {
    try {
      const res = await fetch("/api/admin/users/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action })
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        fetchAdminData(); // refresh stats
      }
    } catch (e) {
      console.error("Action failed", e);
    }
  };

  return (
    <div id="admin-panel-tab" className="p-4 space-y-5 h-full overflow-y-auto pb-10 font-sans">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-sm font-extrabold tracking-wider uppercase text-purple-500">
            Control Room Telemetry
          </h2>
          <p className="text-[10px] text-slate-400">
            Real-time server monitoring & permission configurations
          </p>
        </div>
        <button
          id="btn-admin-refresh"
          onClick={fetchAdminData}
          className="p-1 px-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-purple-400 font-mono rounded"
        >
          FORCE RETRIEVE
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-350 text-xs flex gap-2 items-center">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metrics bento-grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Chat Counter */}
        <div className={`p-3 rounded-2xl border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Chats Monitored</span>
            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black">{stats.totalChats}</span>
            <span className="text-[8px] text-green-400 ml-1 block font-mono">● Active Socket</span>
          </div>
        </div>

        {/* Generated Image Counter */}
        <div className={`p-3 rounded-2xl border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Images Created</span>
            <Image className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black">{stats.totalImagesGenerated}</span>
            <span className="text-[8px] text-purple-400 ml-1 block font-mono">1.1K Standard</span>
          </div>
        </div>

        {/* Edited Images Counter */}
        <div className={`p-3 rounded-2xl border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Altered Frames</span>
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black">{stats.totalImagesEdited}</span>
            <span className="text-[8px] text-indigo-400 ml-1 block font-mono">Before / After</span>
          </div>
        </div>

        {/* Users Counter */}
        <div className={`p-3 rounded-2xl border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Reg. Auth Users</span>
            <Users className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black">{stats.totalUsers}</span>
            <span className="text-[8px] text-teal-400 ml-1 block font-mono">Secure Access</span>
          </div>
        </div>
      </div>

      {/* Control User permission table */}
      <div className={`border rounded-2xl overflow-hidden p-3 space-y-2.5 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-teal-500" />
          <span>Identity Control lists</span>
        </h3>

        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {users.map(u => (
            <div
              key={u.uid}
              className={`p-2.5 rounded-xl border flex justify-between items-center ${
                isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold">{u.displayName}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-mono ${
                    u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-450'
                  }`}>
                    {u.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{u.email}</div>
                {u.status === 'suspended' && (
                  <span className="text-[8px] font-semibold text-red-400 block mt-1 uppercase tracking-wider">
                    ⚠️ Suspended Node Access
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1">
                <button
                  id={`action-suspend-${u.uid}`}
                  onClick={() => handleUserAction(u.uid, 'suspend')}
                  className={`px-2 py-1 text-[9px] rounded font-semibold whitespace-nowrap ${
                    u.status === 'suspended'
                      ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                      : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                  }`}
                >
                  {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                </button>
                <button
                  id={`action-promote-${u.uid}`}
                  onClick={() => handleUserAction(u.uid, 'promote')}
                  className="px-2 py-1 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 text-[9px] rounded font-semibold"
                >
                  Toggle Admin
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Request log stream */}
      <div className={`border rounded-2xl overflow-hidden p-3 space-y-2.5 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-purple-500" />
          <span>Realtime request Stream</span>
        </h3>

        {logs.length === 0 ? (
          <p className="text-[10px] text-slate-500 text-center py-4">
            No live data received yet. Ask chat or generate a slide to log telemetry!
          </p>
        ) : (
          <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-none pr-1">
            {logs.map((log) => {
              const isErr = log.status === 'error';
              return (
                <div
                  key={log.id}
                  className={`p-2 rounded-lg border flex flex-col gap-1 ${
                    isDarkMode ? 'bg-slate-800/40 border-slate-705/30' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      {isErr ? (
                        <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                      )}
                      <span className="text-[10px] font-mono text-slate-400 lowercase italic">
                        {log.userEmail.split('@')[0]}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono opacity-50">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className={`text-[9px] font-mono uppercase px-1 rounded shrink-0 ${
                      log.type === 'chat'
                        ? 'bg-blue-500/10 text-blue-400'
                        : log.type === 'generate_image'
                        ? 'bg-purple-500/10 text-purple-400'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {log.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-semibold truncate text-right flex-1 text-slate-300">
                      "{log.prompt}"
                    </span>
                  </div>

                  {log.errorMessage && (
                    <span className="text-[8px] text-red-400 font-mono italic whitespace-pre-wrap leading-relaxed block border-t border-red-500/10 pt-1 mt-0.5">
                      Error: {log.errorMessage}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
