export const HeroBanner = () => {
  return (
    <section className="relative overflow-hidden bg-[#1B1D1F] px-8 py-20 text-center dark:bg-[#0F1012]">
      {/* Gradient glow effect */}
      <div
        className="pointer-events-none absolute -left-[20%] -top-[50%] h-[200%] w-[140%]"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(49,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(139,92,246,0.06) 0%, transparent 50%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-[640px]">
        <h1 className="mb-4 text-[2rem] font-[800] leading-[1.35] tracking-[-0.03em] text-white">
          코드를 쓰면,{" "}
          <em className="bg-gradient-to-br from-[#3182F6] to-[#8B5CF6] bg-clip-text not-italic text-transparent">
            글이 된다.
          </em>
        </h1>
        <p className="text-[1.0625rem] leading-[1.7] text-white/70">
          GitHub에 커밋하면 AI가 블로그 글을 자동으로 생성합니다.
          <br />
          게임 프로그래머의 AI × 사이드프로젝트 개발 기록.
        </p>
      </div>
    </section>
  );
};
