export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="h-10 bg-white/10 rounded-lg w-64 mb-2"></div>
            <div className="h-6 bg-white/5 rounded-lg w-96"></div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 mb-6">
            <div className="h-10 bg-white/10 rounded-lg w-48"></div>
            <div className="h-10 bg-white/10 rounded-lg flex-1 max-w-md"></div>
            <div className="h-10 bg-white/10 rounded-lg w-32"></div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-white/5 rounded-xl p-6">
                <div className="h-6 bg-white/10 rounded mb-4 w-32"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 bg-white/5 rounded"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="xl:col-span-3 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/5 rounded-xl p-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-16 bg-white/10 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded mb-2 w-32"></div>
                      <div className="h-6 bg-white/10 rounded mb-3 w-3/4"></div>
                      <div className="h-4 bg-white/5 rounded mb-4"></div>
                      <div className="flex gap-4">
                        <div className="h-8 bg-white/5 rounded w-24"></div>
                        <div className="h-8 bg-white/5 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
