import { ScrollText } from "lucide-react";

export const GameLog = ({ logs }) => (
  <div className="bg-white rounded-xl shadow-lg p-4 border border-slate-200">
    <div className="flex items-center gap-2 mb-4">
      <div className="p-2 bg-slate-100 rounded-lg">
        <ScrollText className="w-5 h-5 text-slate-700" />
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-slate-800">Journal de Jeu</h3>

        <p className="text-xs text-slate-500">
          {logs.length}
          événements
        </p>
      </div>
    </div>
    <div className="max-h-64 overflow-y-auto space-y-1">
      {logs.map((entry, index) => (
        <div
          key={index}
          className="text-xs text-slate-600 p-2 bg-slate-50 rounded border-l-2 border-slate-300"
        >
          {entry}
        </div>
      ))}
    </div>
  </div>
);
