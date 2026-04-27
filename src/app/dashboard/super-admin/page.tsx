export default function SuperAdminDashboard() {
  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-2">
          👑 Süper Admin Paneli
        </h1>
        <p className="text-gray-400 mb-8">
          Tüm üniversiteleri, lisansları ve sistemi bu panelden yönetiyorsun.
        </p>

        {/* Yer Tutucu Kartlar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Toplam Üniversite', value: '—', color: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/20' },
            { label: 'Toplam Kullanıcı', value: '—', color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/20' },
            { label: 'Aktif Lisans', value: '—', color: 'from-green-500/20 to-green-600/5', border: 'border-green-500/20' },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-xl border ${card.border} bg-gradient-to-br ${card.color} p-5`}
            >
              <p className="text-gray-400 text-sm">{card.label}</p>
              <p className="text-white text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-gray-600">(İçerik Yapım Aşamasında — Faz 2'de doldurulacak)</p>
      </div>
    </div>
  );
}
