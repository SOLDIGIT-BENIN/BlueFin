// components/admin/ActionCard.tsx
export function ActionCard({ 
  title, count, color, icon, action 
}: {
  title: string;
  count: number;
  color: 'yellow' | 'red' | 'green' | 'orange';
  icon: React.ReactNode;
  action: () => void;
}) {
  const colors = {
    yellow: 'border-[#ffe9a8] hover:border-[#ffc93c]',
    red: 'border-red-200 hover:border-red-400',
    green: 'border-green-200 hover:border-green-400',
    orange: 'border-[#ffe9a8] hover:border-[#ffc93c]',
  };

  return (
    <button
      onClick={action}
      className={`w-full flex items-center justify-between p-3 rounded-xl border ${colors[color]} hover:bg-[#f4fffe] transition`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <span className={`text-sm font-bold ${count > 0 ? 'text-red-500' : 'text-[#5b6b7a]'}`}>
        {count}
      </span>
    </button>
  );
}