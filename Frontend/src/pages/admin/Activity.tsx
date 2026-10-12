import { PageHeader } from "../../components/ui";
import { useStore } from "../../store/useStore";
import { formatDateTime } from "../../lib/utils";

export default function Activity() {
  const audit = useStore((s) => s.audit);
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      <PageHeader title="Activity" subtitle="Everything admins have done, newest first." />
      <div className="card overflow-hidden">
        {audit.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-gray-600">No activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600"><tr><th className="px-5 py-3">When</th><th className="px-5 py-3">Admin</th><th className="px-5 py-3">What happened</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {audit.map((a) => (
                  <tr key={a.id}><td className="whitespace-nowrap px-5 py-3 text-gray-600">{formatDateTime(a.date)}</td><td className="px-5 py-3 text-gray-700">{a.who}</td><td className="px-5 py-3 text-gray-900">{a.text}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
