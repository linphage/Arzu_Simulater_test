import svgPaths from "./svg-ktaaro5dmo";
import imgDelete from "figma:asset/d5c33ede6d4ed05d8df7e44820a6a441da319dbf.png";

function Svg() {
  return (
    <div className="relative shrink-0 size-4" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <g id="Vector"></g>
        </g>
      </svg>
    </div>
  );
}

function Border() {
  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-center p-[2px] relative rounded-lg shrink-0 size-6"
      data-name="Border"
    >
      <div
        aria-hidden="true"
        className="absolute border-2 border-[#aeaeae] border-solid inset-0 pointer-events-none rounded-lg"
      />
      <Svg />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute left-0 size-3.5 top-0" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Group">
          <path
            d={svgPaths.p2463fe80}
            id="Vector"
            stroke="var(--stroke-0, #3A3F47)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.16667"
          />
          <path
            d={svgPaths.pc76da80}
            id="Vector_2"
            stroke="var(--stroke-0, #3A3F47)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.16667"
          />
          <path
            d="M1.75 5.83333H12.25"
            id="Vector_3"
            stroke="var(--stroke-0, #3A3F47)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.16667"
          />
        </g>
      </svg>
    </div>
  );
}

function Svg1() {
  return (
    <div className="relative shrink-0 size-3.5" data-name="SVG">
      <Group />
    </div>
  );
}

function IconifyIcon() {
  return (
    <div
      className="box-border content-stretch flex flex-col items-center justify-center p-0 relative shrink-0"
      data-name="iconify-icon"
    >
      <Svg1 />
    </div>
  );
}

function Container() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-1 items-end justify-start pb-[1.5px] pt-0 px-0 relative shrink-0"
      data-name="Container"
    >
      <IconifyIcon />
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal h-[15px] justify-center leading-[0] not-italic relative shrink-0 text-[#3a3f47] text-[12px] text-left w-[85px]">
        <p className="block leading-[normal]">今天 17:00</p>
      </div>
    </div>
  );
}

function Frame10() {
  return (
    <div className="bg-[#bebebe] box-border content-stretch flex flex-row gap-2.5 items-center justify-center px-1.5 py-1 relative rounded-md shrink-0">
      <div
        className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] justify-center leading-[0] relative shrink-0 text-[#3a3f47] text-[12px] text-left text-nowrap"
        style={{ fontVariationSettings: "'wght' 400" }}
      >
        <p className="block leading-[normal] whitespace-pre">银卡</p>
      </div>
    </div>
  );
}

function Frame11() {
  return (
    <div className="bg-[#bebebe] box-border content-stretch flex flex-row gap-2.5 items-center justify-center px-1.5 py-1 relative rounded-md shadow-[0px_4px_4px_0px_rgba(169,188,228,0.25)] shrink-0 w-24">
      <div
        className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] justify-center leading-[0] relative shrink-0 text-[#3a3f47] text-[12px] text-left text-nowrap"
        style={{ fontVariationSettings: "'wght' 400" }}
      >
        <p className="block leading-[normal] whitespace-pre">奈费勒救我！！</p>
      </div>
    </div>
  );
}

function Frame71349474() {
  return (
    <div className="box-border content-stretch flex flex-row gap-[7px] items-center justify-start p-0 relative shrink-0">
      <Container />
      <Frame10 />
      <Frame11 />
    </div>
  );
}

function Frame71349475() {
  return (
    <div className="[flex-flow:wrap] box-border content-start flex gap-1 items-start justify-start p-0 relative shrink-0 w-[249px]">
      <div
        className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] justify-center leading-[0] relative shrink-0 text-[#3a3f47] text-[14px] text-left w-[226px]"
        style={{ fontVariationSettings: "'wght' 400" }}
      >
        <p className="block leading-[normal]">完成项目报告</p>
      </div>
      <div
        className="bg-center bg-contain bg-no-repeat h-5 shrink-0 w-[18px]"
        data-name="Delete"
        style={{ backgroundImage: `url('${imgDelete}')` }}
      />
      <Frame71349474 />
    </div>
  );
}

export default function Frame71349476() {
  return (
    <div className="bg-[#e0e0e0] relative rounded-2xl size-full">
      <div
        aria-hidden="true"
        className="absolute border-2 border-[#000000] border-solid inset-0 pointer-events-none rounded-2xl"
      />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-4 items-center justify-start pl-[68px] pr-4 py-4 relative size-full">
          <Border />
          <Frame71349475 />
        </div>
      </div>
    </div>
  );
}