import { inp, lbl, IconCalendar, IconClock, IconPlay, IconStop, IconStar, IconTicket, SectionHeader } from "./DrawFormUtils";
import type { DrawFormData } from "../DrawFormModal";

type SectionProps = {
  form: DrawFormData;
  set: (field: keyof DrawFormData, val: any) => void;
};

export function BasicInfoSection({ form, set }: SectionProps) {
  return (
    <div>
      <SectionHeader icon={<IconStar />} label="Basic Details" accent="bg-amber-400/10 text-amber-400 border border-amber-400/20" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>
            Draw Name <span className="text-amber-500">*</span>
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Subhlaxmi Gold"
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>Draw Series (Optional)</label>
          <input
            value={form.drawSeriesName}
            onChange={(e) => set("drawSeriesName", e.target.value)}
            placeholder="e.g. SL-G12"
            className={inp}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className={lbl}>
          Prize Amount <span className="text-amber-500">*</span>
        </label>
        <input
          required
          value={form.prizeAmount}
          onChange={(e) => set("prizeAmount", e.target.value)}
          placeholder="e.g. 10 Lakhs"
          className={inp}
        />
      </div>
    </div>
  );
}

type TimingSectionProps = SectionProps & {
  durationMode: "7days" | "custom";
  setDurationMode: (mode: "7days" | "custom") => void;
};

export function TimingSection({ form, set, durationMode, setDurationMode }: TimingSectionProps) {
  return (
    <div className="space-y-4">
      <SectionHeader icon={<IconClock />} label="Schedule & Automation" accent="bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" />

      {/* Start (Activation) */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <IconPlay />
          </span>
          <p className="text-[11.5px] font-bold text-zinc-300">Activation Time</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lbl}>
              Date <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"><IconCalendar /></span>
              <input
                type="date"
                required
                value={form.activatesAtDate}
                onChange={(e) => set("activatesAtDate", e.target.value)}
                className={`${inp} pl-8`}
              />
            </div>
          </div>
          <div>
            <label className={lbl}>
              Time (IST) <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"><IconClock /></span>
              <input
                type="time"
                required
                value={form.activatesAtTime}
                onChange={(e) => set("activatesAtTime", e.target.value)}
                className={`${inp} pl-8`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative py-2">
        <div className="absolute inset-y-0 left-[9px] w-px bg-gradient-to-b from-emerald-500/20 via-zinc-700 to-red-500/20" />
      </div>

      {/* End (Draw time) */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <IconStop />
          </span>
          <p className="text-[11.5px] font-bold text-zinc-300">Draw Time (Expiry)</p>
        </div>
        
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setDurationMode("7days")}
            className={`flex-1 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${
              durationMode === "7days"
                ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                : "border-white/5 bg-white/[0.02] text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Auto: 7 Days Later
          </button>
          <button
            type="button"
            onClick={() => setDurationMode("custom")}
            className={`flex-1 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${
              durationMode === "custom"
                ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                : "border-white/5 bg-white/[0.02] text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Custom Date
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>
              Date <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"><IconCalendar /></span>
              <input
                type="date"
                required
                disabled={durationMode === "7days"}
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className={`${inp} pl-8 ${durationMode === "7days" ? "opacity-50 cursor-not-allowed" : ""}`}
              />
            </div>
          </div>
          <div>
            <label className={lbl}>
              Time (IST) <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"><IconClock /></span>
              <input
                type="time"
                required
                disabled={durationMode === "7days"}
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
                className={`${inp} pl-8 ${durationMode === "7days" ? "opacity-50 cursor-not-allowed" : ""}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TicketConfigSection({ form, set }: SectionProps) {
  return (
    <div>
      <SectionHeader icon={<IconTicket />} label="Ticket Configuration" accent="bg-blue-400/10 text-blue-400 border border-blue-400/20" />

      {/* Price · Series · Prefix */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className={lbl}>
            Price / Ticket (₹) <span className="text-amber-500">*</span>
          </label>
          <input
            type="number"
            required
            min={1}
            value={form.pricePerTicket}
            onChange={(e) => set("pricePerTicket", e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="100"
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>
            Series <span className="text-amber-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.series}
            onChange={(e) => set("series", e.target.value)}
            placeholder="A,B,C"
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>
            Prefix <span className="text-amber-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.ticketPrefix}
            onChange={(e) => set("ticketPrefix", e.target.value.toUpperCase())}
            placeholder="SL"
            maxLength={6}
            className={inp}
          />
        </div>
      </div>

      {/* Ticket Range */}
      <div>
        <label className={lbl}>
          Ticket Number Range <span className="text-amber-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            required
            value={form.ticketRangeStart}
            onChange={(e) => set("ticketRangeStart", Number(e.target.value))}
            placeholder="10000"
            className={inp}
          />
          <span className="shrink-0 text-[11px] font-semibold text-zinc-600 px-1">TO</span>
          <input
            type="number"
            required
            value={form.ticketRangeEnd}
            onChange={(e) => set("ticketRangeEnd", Number(e.target.value))}
            placeholder="99999"
            className={inp}
          />
        </div>
        {form.ticketRangeStart !== "" && form.ticketRangeEnd !== "" && (
          <p className="mt-2 text-[11px] text-zinc-500 pl-0.5">
            <span className="font-semibold text-zinc-300">
              {Math.max(0, Number(form.ticketRangeEnd) - Number(form.ticketRangeStart) + 1).toLocaleString("en-IN")}
            </span>{" "}tickets per series
            {form.series && ` · ${form.series.split(",").filter(Boolean).length} series`}
          </p>
        )}
      </div>
    </div>
  );
}

export function StatusOverrideSection({ form, set }: SectionProps) {
  return (
    <div className={`rounded-xl border px-5 py-4 ${
      form.statusOverride !== "auto" 
        ? "border-amber-500/30 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.05)_inset]" 
        : "border-white/[0.05] bg-white/[0.01]"
    }`}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
            Manual Status Override
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            Force a specific status (ignores schedule).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-1">
        {([
          { value: "auto",     label: "Auto",     sub: "Schedule" },
          { value: "upcoming", label: "Upcoming", sub: "Hidden" },
          { value: "active",   label: "Active",   sub: "Booking open" },
          { value: "closed",   label: "Closed",   sub: "Booking shut" },
          { value: "drawn",    label: "Drawn",    sub: "Result done" },
        ] as const).map((opt) => {
          const isSelected = form.statusOverride === opt.value;
          const colors: Record<string, string> = {
            auto:     "border-zinc-600/60 text-zinc-300 bg-zinc-800/40",
            upcoming: "border-blue-500/50 text-blue-300 bg-blue-500/10",
            active:   "border-emerald-500/50 text-emerald-300 bg-emerald-500/10",
            closed:   "border-zinc-500/50 text-zinc-400 bg-zinc-700/20",
            drawn:    "border-amber-500/50 text-amber-300 bg-amber-500/10",
          };
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("statusOverride", opt.value)}
              className={`flex flex-col items-center rounded-xl border py-2.5 px-1.5 text-center transition-all duration-150 ${
                isSelected
                  ? `${colors[opt.value]} ring-1 ring-inset ring-current/40 shadow-sm`
                  : "border-white/[0.07] text-zinc-600 bg-white/[0.02] hover:border-white/15 hover:text-zinc-400"
              }`}
            >
              <span className="text-[11px] font-bold leading-tight">{opt.label}</span>
              <span className="text-[9px] mt-1 opacity-60 leading-tight">{opt.sub}</span>
            </button>
          );
        })}
      </div>
      <p className={`mt-2 text-[11px] pl-0.5 ${form.statusOverride !== "auto" ? "text-amber-400/70" : "text-zinc-600"}`}>
        {form.statusOverride !== "auto"
          ? "Manual override active — date-based auto-compute is paused for this draw."
          : "Status is automatically managed by start and end schedule."}
      </p>
    </div>
  );
}
