function Loader() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-gray-800"></div>
        <div className="absolute top-0 h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
      </div>
    </div>
  );
}

export default Loader;
