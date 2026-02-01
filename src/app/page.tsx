'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <header className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-zinc-900" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <img 
            src="/logo-white.png" 
            alt="EVeM" 
            className="h-16 md:h-20 mx-auto mb-8"
          />
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            EVeM DNA
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            生物の発達の方向性は遺伝子によって大きく方向づけられます。<br />
            企業も同様に、その進化の方向性は固有の遺伝子によって規定されます。
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#our-statement" 
              className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors"
            >
              詳しく見る
            </a>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </header>

      {/* Our Statement Section */}
      <section id="our-statement" className="py-24 px-6 bg-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Our Statement</h2>
          <p className="text-zinc-500 text-center mb-16">私たちの考え</p>
          
          {/* Purpose */}
          <div className="mb-20">
            <div className="border-l-4 border-white pl-6 mb-8">
              <h3 className="text-sm text-zinc-500 uppercase tracking-wider mb-2">Purpose</h3>
              <p className="text-xl md:text-2xl font-bold">すべてのチャレンジに、マネジメントの力を</p>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              答えのない問いを探求し、自分たちで決めた道を進み、それを実現する。こうした取り組み「チャレンジ」は、不確実性が増すにつれ、あらゆるところで求められるようになってきています。チャレンジは、0から1を生むイノベーションだけでは成立せず、それを育てる「マネジメント」の力が不可欠です。私たちは、素晴らしいイノベーションをマネジメントの力でカタチにし、世界をよりよくしたい。そのために今日も活動しています。
            </p>
          </div>

          {/* Mission */}
          <div className="mb-20">
            <div className="border-l-4 border-white pl-6 mb-8">
              <h3 className="text-sm text-zinc-500 uppercase tracking-wider mb-2">Mission</h3>
              <p className="text-xl md:text-2xl font-bold">マネジメントを、誰でもできるテクノロジーにする</p>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              マネジメントは個人のセンスや経験則を頼りにしか行えない、そう信じられてきたのではないでしょうか。私たちはマネジメントを科学し、誰もがその業務を実行できるようになるためのテクノロジーを開発します。そして、それを世界中に届け、人類の営みを進化させます。
            </p>
          </div>

          {/* Vision */}
          <div>
            <div className="border-l-4 border-white pl-6 mb-8">
              <h3 className="text-sm text-zinc-500 uppercase tracking-wider mb-2">Vision</h3>
              <p className="text-xl md:text-2xl font-bold">主体性を発揮する人で溢れる世界</p>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              地位や権力を振りかざすのではなく、対等な立場で、技術で人を動かす。そのような"イーブン"なスタイルに支えられたマネジメントは、一人ひとりの主体性を引き出します。否定されることを恐れず、ためらいなく意見を言い、アイデアを生み出せる。任されたポジションに誇りを持ち、自分の力で未来を切り拓いていける。チャレンジを通して叶えるのは誰かの夢ではなく、「自分の夢」だと胸を張って言える状態が「人生の主役として生きている」という実感を呼び覚まし、さまざまなチャレンジを後押しする強い力になるでしょう。
            </p>
          </div>
        </div>
      </section>

      {/* Why EVeM Section */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Why EVeM</h2>
          <p className="text-zinc-500 text-center mb-16">この挑戦を担う必然性</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-zinc-900 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-4">スタートアップ発の<br />マネジメント技術</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                変化が激しく、答えも見えない中、チームを率いてイノベーションを加速させる必要があるスタートアップで求められるのは、哲学でも組織論でもなく、今すぐ使って結果の出る「技術」です。
              </p>
            </div>

            <div className="bg-zinc-900 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-4">ユーザーに向き合い続ける<br />カルチャー</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                私たちの仕事は、マネージャーに武器を与え、その業務を支援すること。マネージャーの実務や悩みに生身で1つ1つぶつかるからこそ、実際に使って成果につながる技術やシステムの開発が可能になります。
              </p>
            </div>

            <div className="bg-zinc-900 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-4">日本で生まれた<br />サービスだからこそ</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                日本は、世界に先駆けて人口減少の社会課題にぶつかることになる課題先進国です。この日本でマネジメントの技術を実装し、「生産性の向上」に寄与することで、この技術を世界に通用するモデルに進化させることができます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* After EVeM Section */}
      <section className="py-24 px-6 bg-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">After EVeM</h2>
          <p className="text-zinc-500 text-center mb-8">EVeMが社会に与えるインパクト</p>
          
          <div className="bg-black/50 p-8 rounded-2xl mb-16">
            <p className="text-zinc-400 leading-relaxed text-center">
              マネジメントとは、太古の昔から人類が何かに挑むときに用いてきた力であり、<br className="hidden md:block" />
              人類の知恵とパワーの結集にレバレッジをかける、根源的なアセットです。<br /><br />
              私たちEVeMは、マネジメントを、<br className="hidden md:block" />
              <span className="text-white font-semibold">社会を動かす豊かなプロトコル</span>だと捉えています。
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">高い労働生産性</h3>
                <p className="text-zinc-400 leading-relaxed">
                  マネジメントが個人の経験則やセンスではなく、正しい技術を以て行われるようになれば、あるべき目標と方針の下、メンバーの能力・意欲が活かされます。また、業務を通じてメンバーが成長します。そうして、1人1人の生産性が向上します。
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">人の尊厳が守られる社会</h3>
                <p className="text-zinc-400 leading-relaxed">
                  マネジメントの技術が存在していれば、対等な関係のもとマネジメントは単なる役割として全うされ、メンバーは抑圧から解放され、自分らしく尊厳を以て仕事に臨むことができます。
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">地球を救うイノベーションの創出</h3>
                <p className="text-zinc-400 leading-relaxed">
                  私たちは、マネジメント技術の提供を通じて、立場や肩書きに縛られず、誰もが自由に意見を交わし、ワイワイ、ガヤガヤと価値創造に向かう「イーブンな未来」を社会に実装します。そのような未来が、地球を救うイノベーションを次々に生む土壌になるでしょう。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-black border-t border-zinc-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">EVeM DNAに関する質問はこちら</h2>
          <p className="text-zinc-400 mb-10">
            AIアシスタントがEVeM DNAについてお答えします
          </p>
          <Link 
            href="/login"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors group"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            EVeM DNA Chatを始める
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-black border-t border-zinc-800">
        <div className="max-w-4xl mx-auto text-center">
          <img 
            src="/logo-white.png" 
            alt="EVeM" 
            className="h-8 mx-auto mb-4 opacity-50"
          />
          <p className="text-zinc-600 text-sm">© 2026 EVeM Japan</p>
        </div>
      </footer>
    </div>
  );
}
