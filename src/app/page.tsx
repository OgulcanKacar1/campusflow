import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  // Supabase sunucu istemcisini oluşturuyoruz
  const supabase = await createClient()

  // Sadece bağlantının çalışıp çalışmadığını test ediyoruz.
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // "Auth session missing" aslında bizim için bir hata değil, kullanıcının giriş yapmamış olmasıdır.
  const isSetupSuccess = !error || error.message.includes('Auth session missing')
  const errorMessage = error && !error.message.includes('Auth session missing') ? error.message : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-950 text-white">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex border border-zinc-800 p-8 rounded-lg bg-zinc-900 shadow-2xl">
        <div className="flex flex-col space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">CampusFlow</h1>
          {errorMessage && <p className="text-red-500 text-lg">Kritik Bağlantı Hatası: {errorMessage}</p>}
          {isSetupSuccess && (
            <div>
              <p className="text-emerald-400 font-semibold text-lg flex items-center">
                <span className="w-3 h-3 bg-emerald-400 rounded-full mr-3 animate-pulse"></span>
                Supabase Altyapısı Başarıyla Kuruldu!
              </p>
              <p className="text-zinc-400 mt-2 text-sm">
                Proje ID: invizdvgroerxyzhctyh
              </p>
              <div className="mt-6 pt-6 border-t border-zinc-800">
                <p className="text-zinc-500">Mevcut Durum: {user ? user.email : 'Oturum açılmamış (Sistem logine hazır)'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
