import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Clock, Mail, Reply } from "lucide-react";
import { MetricCard, PageHeader } from "../components/ui";
import { useStore } from "../store/useStore";
import { categoryCounts, dailyVolume, live, sentimentTrend } from "../lib/stats";
import { CATEGORY_CHART_COLORS } from "../lib/utils";

const tip = { borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 };
const axis = { fontSize: 12, fill: "#4B5563" };

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="mb-3 text-xs text-gray-600">{subtitle}</p>}
      <div className="h-60">{children}</div>
    </div>
  );
}

export default function Analytics() {
  const emails = useStore((s) => s.emails);
  const l = live(emails);

  const received = l.length;
  const replied = l.filter((e) => e.replied).length;
  const waiting = l.filter((e) => e.replyRequired && !e.replied).length;

  const urgentVol = useMemo(() => dailyVolume(emails, 7, (e) => e.priority === "High" || e.priority === "Critical"), [emails]);
  const complaintVol = useMemo(() => dailyVolume(emails, 7, (e) => e.category === "Customer Complaint"), [emails]);
  const volume = useMemo(
    () =>
      urgentVol.map((u, i) => ({
        day: u.day,
        Urgent: u.count,
        Complaints: complaintVol[i].count,
        Sales: dailyVolume(emails, 7, (e) => e.category === "Sales Inquiry")[i].count,
        Support: dailyVolume(emails, 7, (e) => e.category === "Support Request")[i].count,
      })),
    [emails, urgentVol, complaintVol],
  );
  const cats = useMemo(() => categoryCounts(emails), [emails]);
  const sentiment = useMemo(() => sentimentTrend(emails, 7), [emails]);

  const pendingActions = l.reduce((n, e) => n + e.actions.filter((a) => a.status === "Pending").length, 0);
  const completedActions = l.reduce((n, e) => n + e.actions.filter((a) => a.status === "Completed").length, 0);

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <PageHeader title="Analytics" subtitle="Performance, volume and sentiment across your inbox." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Emails received" value={received} icon={<Mail className="h-5 w-5" />} tone="blue" />
        <MetricCard label="Emails replied to" value={replied} icon={<Reply className="h-5 w-5" />} tone="emerald" />
        <MetricCard label="Waiting on a reply" value={waiting} icon={<Clock className="h-5 w-5" />} tone="violet" />
        <MetricCard label="Pending actions" value={pendingActions} hint={`${completedActions} completed`} icon={<AlertTriangle className="h-5 w-5" />} tone="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Volume by type" subtitle="Urgent, complaints, sales and support – last 7 days">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volume} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="day" tick={axis} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tip} cursor={{ fill: "#F3F4F6" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Urgent" fill="#EF4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Complaints" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Sales" fill="#2563EB" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Support" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sentiment trends" subtitle="Watch for spikes in Angry or Negative emails">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sentiment} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="day" tick={axis} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Positive" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Neutral" stroke="#9CA3AF" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Negative" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Angry" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Emails by category" subtitle="How your mail is sorted">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cats} layout="vertical" margin={{ top: 5, right: 16, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#4B5563" }} axisLine={false} tickLine={false} width={120} />
              <Tooltip contentStyle={tip} cursor={{ fill: "#F3F4F6" }} />
              <Bar dataKey="value" name="Emails" radius={[0, 6, 6, 0]}>
                {cats.map((c) => <Cell key={c.name} fill={CATEGORY_CHART_COLORS[c.name]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Emails received" subtitle="Daily incoming volume – last 7 days">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyVolume(emails, 7)} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="day" tick={axis} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tip} />
              <Line type="monotone" dataKey="count" name="Emails" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
