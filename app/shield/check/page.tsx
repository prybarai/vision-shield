import ContractorCheckFlow from '@/components/shield/ContractorCheckFlow';

export default function ShieldCheckPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7 shadow-sm mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Check a contractor</h1>
          <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Verify license status and get a plain-English risk read before you hire, pay a deposit, or sign a contract.
          </p>
        </div>
        <ContractorCheckFlow />
      </div>
    </div>
  );
}
