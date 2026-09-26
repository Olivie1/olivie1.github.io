export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse delay-100"></div>
      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse delay-200"></div>
    </div>
  );
}
