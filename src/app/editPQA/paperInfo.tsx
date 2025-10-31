'use client';

interface Paper {
  authority:string;
  course: string;
  term: string;
  field: string;
  subject: string;
  subCode?: string;
  season: string;
  year: number;
  set: string,
  descr: string
}

interface PaperInfoProps {
  data: any;
}

export default function PaperInfo({ data }: PaperInfoProps) {
  // prepare label → key pairs for consistent naming
  const fields: { label: string; value: string | number }[] = [
    { label: "Authority", value: data?.authority ?? "-" },
    { label: "Course", value: data?.course ?? "-" },
    { label: "Field", value: data?.field ?? "-" },
    { label: "Term", value: data?.term ?? "-" },
    { label: "Subject", value: `${data?.subject ?? "-"} (${data?.subCode ?? "-"})` },
    { label: "Season", value: data?.season ?? "-" },
    { label: "Year", value: data?.year ?? "-" },
    { label: "Set", value: data?.set ?? "-" },
  ];

  return (
    <section
      className="card w-full max-w-4xl mx-auto"
      aria-labelledby="paperinfo-heading"
    >
      <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-4 py-4 pr-2  gap-4 place-items-center text-center">
        {fields.map((field, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-base-content/60">
              {field.label}
            </span>
            <span className="font-medium text-sm sm:text-base overflow-auto hide-scrollbar">
              {field.value}
            </span>

          </div>
        ))}
      </div>

    </section>
  );
}
