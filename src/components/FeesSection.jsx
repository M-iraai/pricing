import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Search, Copy, Check, X, Home, Building2, MapPin, Phone, RefreshCw } from 'lucide-react'

const WILAYA_EN = {
  'أدرار': 'Adrar', 'الشلف': 'Chlef', 'الأغواط': 'Laghouat', 'أم البواقي': 'Oum El Bouaghi',
  'باتنة': 'Batna', 'بجاية': 'Béjaïa', 'بسكرة': 'Biskra', 'بشار': 'Béchar',
  'البليدة': 'Blida', 'البويرة': 'Bouira', 'تمنراست': 'Tamanrasset', 'تبسة': 'Tébessa',
  'تلمسان': 'Tlemcen', 'تيارت': 'Tiaret', 'تيزي وزو': 'Tizi Ouzou', 'الجزائر': 'Algiers',
  'الجلفة': 'Djelfa', 'جيجل': 'Jijel', 'سطيف': 'Sétif', 'سعيدة': 'Saïda',
  'سكيكدة': 'Skikda', 'سيدي بلعباس': 'Sidi Bel Abbès', 'عنابة': 'Annaba',
  'قالمة': 'Guelma', 'قسنطينة': 'Constantine', 'المدية': 'Médéa', 'مستغانم': 'Mostaganem',
  'المسيلة': 'Msila', 'معسكر': 'Mascara', 'ورقلة': 'Ouargla', 'وهران': 'Oran',
  'البيض': 'El Bayadh', 'إليزي': 'Illizi', 'برج بوعريريج': 'Bordj Bou Arréridj',
  'بومرداس': 'Boumerdès', 'الطارف': 'El Tarf', 'تندوف': 'Tindouf', 'تيسمسيلت': 'Tissemsilt',
  'الوادي': 'El Oued', 'خنشلة': 'Khenchela', 'سوق أهراس': 'Souk Ahras',
  'تيبازة': 'Tipaza', 'ميلة': 'Mila', 'عين الدفلى': 'Aïn Defla',
  'النعامة': 'Naâma', 'عين تموشنت': 'Aïn Témouchent', 'غرداية': 'Ghardaïa',
  'غليزان': 'Relizane', 'تيميمون': 'Timimoun', 'برج باجي مختار': 'Bordj Badji Mokhtar',
  'أولاد جلال': 'Ouled Djellal', 'بني عباس': 'Béni Abbès', 'عين صالح': 'In Salah',
  'عين قزام': 'In Guezzam', 'توقرت': 'Touggourt', 'جانت': 'Djanet',
  'المغير': 'El MGhair', 'المنيعة': 'El Meniaa',
}

const wilayaNameEn = (name) => WILAYA_EN[name] || ''

// `/api/wilayas` currently returns English names ("Adrar"); older payloads returned
// Arabic ones. Resolve a display-safe English name either way.
const nameEnOf = (name) => wilayaNameEn(name) || name || ''

const getJson = (url) =>
  fetch(url, { cache: 'no-store' }).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

export default function FeesSection() {
  const [feesData, setFeesData] = useState(null)
  const [wilayas, setWilayas] = useState([])
  const [search, setSearch] = useState('')
  const [selectedWilaya, setSelectedWilaya] = useState(null)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState(null)
  const [desksData, setDesksData] = useState(null)

  const loadFees = useCallback(() => {
    // `no-store` + cache-busting param so no proxy/CDN can serve an old price
    const bust = Date.now()
    setError(null)
    return Promise.all([
      getJson(`/api/fees?t=${bust}`),
      getJson(`/api/wilayas?t=${bust}`),
      // Stop-desk list is optional: prices must still load if this route fails
      getJson(`/api/desks?t=${bust}`).catch(() => null),
    ]).then(([fees, wils, desks]) => {
      if (!fees || !Array.isArray(fees.livraison) || !Array.isArray(wils)) {
        throw new Error('Unexpected API payload')
      }
      setFeesData(fees)
      setWilayas(wils)
      setDesksData(desks && typeof desks === 'object' ? desks : null)
      setLastUpdated(Date.now())
      return true
    }).catch(err => {
      setError(err.message || 'Failed to load')
      throw err
    })
  }, [])

  useEffect(() => {
    loadFees()
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [loadFees])

  // Auto-refresh when the user returns to the app after it was in the background,
  // so a long-idle PWA always shows current prices
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadFees().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadFees])

  // Clear pending timers on unmount
  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const sortedWilayas = useMemo(() => {
    return [...wilayas].sort((a, b) => {
      const enA = nameEnOf(a.wilaya_name)
      const enB = nameEnOf(b.wilaya_name)
      return enA.localeCompare(enB)
    })
  }, [wilayas])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sortedWilayas
    return sortedWilayas.filter(w => {
      const en = nameEnOf(w.wilaya_name).toLowerCase()
      const ar = w.wilaya_name.toLowerCase()
      const id = String(w.wilaya_id)
      return en.startsWith(q) || ar.startsWith(q) || id.startsWith(q)
    })
  }, [sortedWilayas, search])

  const selectedFee = useMemo(() => {
    if (!feesData || !selectedWilaya) return null
    const arr = feesData.livraison || []
    return arr.find(f => f.wilaya_id === selectedWilaya.wilaya_id) || null
  }, [feesData, selectedWilaya])

  // English wilaya name → wilaya_id (used to place our own hub in its wilaya)
  const idByEnglishName = useMemo(() => {
    const map = {}
    for (const w of wilayas) {
      const en = nameEnOf(w.wilaya_name)
      if (en) map[en.toLowerCase()] = w.wilaya_id
    }
    return map
  }, [wilayas])

  // Stop-desk offices grouped by wilaya id
  const desksByWilaya = useMemo(() => {
    const map = {}
    const add = (id, desk) => {
      if (!id) return
      const list = map[id] || (map[id] = [])
      const key = `${desk.name}|${desk.phone}`
      if (list.some(d => `${d.name}|${d.phone}` === key)) return
      list.push(desk)
    }

    const others = desksData?.other_desks
    if (Array.isArray(others)) {
      for (const d of others) {
        add(Number(d.code_wilaya), {
          name: d.name || '',
          commune: d.commune || '',
          adresse: d.adresse || '',
          phone: d.phone || '',
          map: d.map || '',
        })
      }
    }

    const my = desksData?.my_desk
    if (my && my.hub_name) {
      const loc = my.location || {}
      add(idByEnglishName[String(loc.wilaya || '').toLowerCase()], {
        name: my.hub_name,
        commune: loc.commune || '',
        adresse: loc.adresse || '',
        phone: loc.phone || '',
        map: loc.map || '',
      })
    }

    return map
  }, [desksData, idByEnglishName])

  const handleRefresh = () => {
    setRefreshing(true)
    loadFees()
      .catch(() => {})
      .finally(() => setRefreshing(false))
  }

  const dismissTimer = useRef(null)
  const toastTimer = useRef(null)

  const handleCopy = () => {
    if (!selectedFee) return
    const text = `التوصيل للمنزل: ${selectedFee.tarif} دج\nالتوصيل للبيرو: ${selectedFee.tarif_stopdesk} دج`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      // Confirmation toast (outlives the card)
      setToast(true)
      if (toastTimer.current) clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setToast(false), 1800)
      // Let the "تم النسخ!" state show briefly, then hide the card to keep things clean
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
      dismissTimer.current = setTimeout(() => {
        setSelectedWilaya(null)
        setCopied(false)
      }, 800)
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 border-3 border-purple/20 border-t-purple rounded-full animate-spin" />
        <span className="text-subtle2 text-sm">جاري تحميل الأسعار...</span>
      </div>
    )
  }

  if (error && !feesData) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
          <X size={22} className="text-red-500" />
        </div>
        <div className="text-sm font-bold text-ink">تعذّر تحميل الأسعار</div>
        <div className="text-xs text-subtle2" dir="ltr">{error}</div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-purple hover:bg-purple-2 px-5 py-2.5 rounded-full disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          إعادة المحاولة
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Copy confirmation toast */}
      {toast && (
        <div className="fixed bottom-24 right-1/2 translate-x-1/2 z-50 bg-ink text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg animate-[fadeSlideIn_0.25s_ease] pointer-events-none">
          تم النسخ ✓
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle2 pointer-events-none" />
        <input
          type="search"
          placeholder="ابحث عن ولاية... (Al, Or, الجزائر, 16)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pr-11 pl-10 py-3.5 rounded-2xl border border-border bg-white text-sm text-ink placeholder:text-subtle2/60 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/10 transition-all shadow-product"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setSelectedWilaya(null) }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X size={14} className="text-subtle2" />
          </button>
        )}
      </div>

      {/* Refresh bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-subtle2">
          {lastUpdated ? `آخر تحديث: ${new Date(lastUpdated).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}` : ''}
        </span>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-bold text-purple hover:text-purple-2 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          تحديث الأسعار
        </button>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-subtle2">
          {search.trim()
            ? <><span className="font-bold text-purple">{filtered.length}</span> نتيجة</>
            : <>كل الولايات — <span className="font-bold text-purple">58</span></>
          }
        </span>
      </div>

      {/* Wilayas List — the selected row expands with prices + stop desks */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-subtle2">
            <Search size={32} className="opacity-30" />
            <span className="text-sm font-medium">لا توجد نتائج لـ "{search}"</span>
            <span className="text-xs">جرّب حرف آخر أو اسمولاية مختلف</span>
          </div>
        )}

        {filtered.map(w => {
          const fee = (feesData?.livraison || []).find(f => f.wilaya_id === w.wilaya_id)
          const isSelected = selectedWilaya?.wilaya_id === w.wilaya_id
          const desks = desksByWilaya[w.wilaya_id] || []

          return (
            <div key={w.wilaya_id} className="space-y-2">
              <button
                onClick={() => setSelectedWilaya(isSelected ? null : w)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all active:scale-[0.98] text-right ${
                  isSelected
                    ? 'bg-lav border-purple/30 shadow-stat'
                    : 'bg-white border-border hover:border-purple/20 hover:shadow-product'
                }`}
              >
                {/* ID badge */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                  isSelected ? 'bg-purple text-white' : 'bg-gray-100 text-subtle2'
                }`}>
                  {w.wilaya_id < 10 ? `0${w.wilaya_id}` : w.wilaya_id}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold truncate ${isSelected ? 'text-purple' : 'text-ink'}`}>
                    {nameEnOf(w.wilaya_name)}
                  </div>
                  {wilayaNameEn(w.wilaya_name) && (
                    <div className="text-xs text-subtle2 truncate">{w.wilaya_name}</div>
                  )}
                </div>

                {/* Price */}
                {fee && (
                  <div className="flex-shrink-0 text-left">
                    <div className="text-xs text-subtle2">🏠 {fee.tarif}</div>
                    <div className="text-xs text-subtle2">📦 {fee.tarif_stopdesk}</div>
                  </div>
                )}

                {/* Arrow */}
                <div className={`flex-shrink-0 transition-transform ${isSelected ? 'rotate-180 text-purple' : 'text-border7'}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>

              {/* Expanded panel — prices + stop desks, right under the selected wilaya */}
              {isSelected && (
                <div className="animate-[fadeSlideIn_0.25s_ease] space-y-3 pl-1">
                  {/* Price cards */}
                  {fee && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white border border-border rounded-2xl p-4 text-center shadow-stat relative overflow-hidden">
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple to-purple-2 rounded-b-2xl" />
                        <div className="w-10 h-10 mx-auto mb-2 bg-lav rounded-xl flex items-center justify-center">
                          <Home size={18} className="text-purple" />
                        </div>
                        <div className="text-[11px] text-subtle2 mb-1 font-medium">للمنزل</div>
                        <div className="text-2xl font-extrabold text-ink">{fee.tarif}</div>
                        <div className="text-[11px] text-subtle2">دج</div>
                      </div>
                      <div className="bg-white border border-border rounded-2xl p-4 text-center shadow-stat relative overflow-hidden">
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-b-2xl" />
                        <div className="w-10 h-10 mx-auto mb-2 bg-emerald-50 rounded-xl flex items-center justify-center">
                          <Building2 size={18} className="text-emerald-600" />
                        </div>
                        <div className="text-[11px] text-subtle2 mb-1 font-medium">للبيرو</div>
                        <div className="text-2xl font-extrabold text-ink">{fee.tarif_stopdesk}</div>
                        <div className="text-[11px] text-subtle2">دج</div>
                      </div>
                    </div>
                  )}

                  {/* Stop-desk offices */}
                  {desksData && (
                    <div className="bg-white border border-border rounded-2xl p-4 shadow-stat">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-ink">
                          <MapPin size={15} className="text-purple" />
                          مكاتب الاستلام (Stop Desk)
                        </div>
                        <span className="text-[11px] font-bold text-purple bg-lav px-2 py-0.5 rounded-full">
                          {desks.length}
                        </span>
                      </div>

                      {desks.length === 0 ? (
                        <div className="text-xs text-subtle2">
                          لا توجد مكاتب استلام في هذه الولاية — التوصيل للمنزل متاح فقط.
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {desks.map((d, i) => (
                            <li
                              key={`${d.name}-${i}`}
                              className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-border/70"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-lav flex items-center justify-center">
                                <MapPin size={15} className="text-purple" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-bold text-ink truncate">{d.name}</div>
                                <div className="text-xs text-subtle2 truncate">
                                  {[d.commune, d.adresse]
                                    .filter((v, i, arr) => v && (i === 0 || v !== arr[i - 1]))
                                    .join(' — ')}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                                  {d.phone && (
                                    <a
                                      href={`tel:${d.phone}`}
                                      dir="ltr"
                                      className="flex items-center gap-1 text-xs font-bold text-purple hover:text-purple-2 transition-colors"
                                    >
                                      <Phone size={12} />
                                      {d.phone}
                                    </a>
                                  )}
                                  {d.map && (
                                    <a
                                      href={d.map}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                                    >
                                      الموقع على الخريطة ↗
                                    </a>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Copy button */}
                  {fee && (
                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      {copied ? (
                        <>
                          <Check size={18} className="animate-[popIn_0.2s_ease]" />
                          تم النسخ!
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          نسخ الأسعار
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
