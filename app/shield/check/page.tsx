import ContractorCheckFlow from '@/components/shield/ContractorCheckFlow';

export default function ShieldCheckPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">🔍 Check a contractor</h1>
          <p className="text-slate-500">Verify license status and get an AI risk assessment before you hire.</p>
        </div>
        <ContractorCheckFlow />
      </div>
    </div>
  );
}
