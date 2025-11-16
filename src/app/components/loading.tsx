'use client';
export default function Loading({children}:any)
{
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-blue-600">{children}</span>
      </div>
    );
}