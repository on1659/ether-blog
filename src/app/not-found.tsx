import Link from "next/link";
import { NotFoundMascot } from "@/components/mascot/NotFoundMascot";

const NotFound = () => {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* 404 gradient text */}
      <h1
        className="mb-4 text-[5rem] font-[800] leading-none sm:text-[8rem]"
        style={{
          background: "linear-gradient(135deg, var(--brand-primary), #8B5CF6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        404
      </h1>

      {/* Lost mascot */}
      <NotFoundMascot />

      {/* Messages */}
      <p
        className="mb-2 text-xl font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        페이지를 찾을 수 없습니다
      </p>
      <p className="mb-8" style={{ color: "var(--text-tertiary)" }}>
        이더봇도 길을 잃은 것 같아요...
      </p>

      {/* Home button */}
      <Link
        href="/"
        className="inline-block rounded-lg px-6 py-2.5 text-[0.9375rem] font-semibold text-white transition-opacity duration-200 hover:opacity-85"
        style={{ background: "var(--brand-primary)" }}
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
};

export default NotFound;
