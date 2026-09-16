// components/admin/MetricCard.tsx
export function MetricCard({ 
  title, value, subtitle, color, icon, stars 
}: {
  title: string;
  value: string;
  subtitle: string;
  color: 'indigo' | 'emerald' | 'rose' | 'amber';
  icon: React.ReactNode;
  stars?: boolean;
}) {
  const colors = {
    indigo: 'bg-[#f4fffe] text-[#00806b]',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-[#fffaeb] text-[#a87c10]',
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-[#e2f5f2]">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-[#0f2940]">{value}</p>
          <p className="text-xs text-[#5b6b7a]">{title}</p>
          <p className="text-xs text-[#5b6b7a]">{subtitle}</p>
          {stars && (
            <div className="flex text-[#ffc93c] text-sm mt-1">★★★★★</div>
          )}
        </div>
      </div>
    </div>
  );
}