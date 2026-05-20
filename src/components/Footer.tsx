import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-slate-200/60 bg-slate-950 text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <span className="text-xl font-bold">TechStore</span>
            </div>
            <p className="mb-6 max-w-md text-sm leading-relaxed text-slate-400">
              최신 기술 제품을 합리적인 가격으로 제공하는 프리미엄 온라인 쇼핑몰입니다. 고객
              만족을 최우선으로 하는 서비스를 제공합니다.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-slate-400 transition-colors hover:text-white">
                회사 소개
              </a>
              <a href="#" className="text-slate-400 transition-colors hover:text-white">
                채용 정보
              </a>
              <a href="#" className="text-slate-400 transition-colors hover:text-white">
                투자 정보
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              고객 지원
            </h4>
            <ul className="space-y-3 text-sm">
              {['고객센터', '자주 묻는 질문', '배송 안내', '반품/교환 안내'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-400 transition-colors hover:text-indigo-300">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              쇼핑 정보
            </h4>
            <ul className="space-y-3 text-sm">
              {['이용약관', '개인정보처리방침', '전자상거래법', '사업자정보'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-400 transition-colors hover:text-indigo-300">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 md:flex-row">
          <div className="text-center text-xs text-slate-500 md:text-left">
            <p>사업자등록번호: 123-45-67890</p>
            <p className="mt-1">대표: 홍길동 | 서울특별시 강남구 테헤란로 123</p>
            <p className="mt-1">전화: 02-1234-5678 | info@techstore.com</p>
          </div>
          <p className="text-xs text-slate-500">&copy; 2024 TechStore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
