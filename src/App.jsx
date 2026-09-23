import FeesSection from './components/FeesSection'

export default function App() {
  return (
    <div className="app-container" dir="rtl">
      <main>
        <h1 className="text-[27px] font-extrabold tracking-tight mt-3 mb-0.5">أسعار التوصيل</h1>
        <div className="text-[15px] text-subtle2 mb-6">اسأل عن ثمن التوصيل لكل ولاية.</div>
        <FeesSection />
      </main>
    </div>
  )
}
