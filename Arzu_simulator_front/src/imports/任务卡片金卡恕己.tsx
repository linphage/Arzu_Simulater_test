import svgPaths from "./svg-y2ssk1vz7b";
import imgDelete from "figma:asset/d5c33ede6d4ed05d8df7e44820a6a441da319dbf.png";
import img20003731 from "figma:asset/77dfb21b6ae5b3e017b8309d5b6bc1907545c62e.png";

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
        className="absolute border-2 border-[#d7bfae] border-solid inset-0 pointer-events-none rounded-lg"
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
            stroke="var(--stroke-0, #5B3A29)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.16667"
          />
          <path
            d={svgPaths.pc76da80}
            id="Vector_2"
            stroke="var(--stroke-0, #5B3A29)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.16667"
          />
          <path
            d="M1.75 5.83333H12.25"
            id="Vector_3"
            stroke="var(--stroke-0, #5B3A29)"
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
      className="box-border content-stretch flex flex-row gap-1 items-end justify-start mr-[-10px] pb-[1.5px] pt-0 px-0 relative shrink-0"
      data-name="Container"
    >
      <IconifyIcon />
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal h-[15px] justify-center leading-[0] not-italic relative shrink-0 text-[#5b3a29] text-[12px] text-left w-[85px]">
        <p className="block leading-[normal]">今天 17:00</p>
      </div>
    </div>
  );
}

function Frame10() {
  return (
    <div className="bg-[#f2e2d2] box-border content-stretch flex flex-row gap-2.5 items-center justify-center mr-[-10px] px-1.5 py-1 relative rounded-md shrink-0">
      <div
        className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_sans-serif] justify-center leading-[0] relative shrink-0 text-[#6b4c3b] text-[12px] text-left text-nowrap"
        style={{ fontVariationSettings: "'wght' 400" }}
      >
        <p className="block leading-[normal] whitespace-pre">金卡</p>
      </div>
    </div>
  );
}

function Frame13() {
  return (
    <div className="[flex-flow:wrap] box-border content-end flex gap-[7px] items-end justify-start pl-0 pr-[18px] py-0 relative shrink-0 w-[141px]">
      <div
        className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] justify-center leading-[0] mr-[-10px] relative shrink-0 text-[#5b3a29] text-[14px] text-left w-[84px]"
        style={{ fontVariationSettings: "'wght' 400" }}
      >
        <p className="block leading-[normal]">完成项目报告</p>
      </div>
      <Container />
      <Frame10 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="box-border content-stretch flex flex-row gap-4 items-center justify-start p-0 relative shrink-0 w-[183px]">
      <Border />
      <Frame13 />
    </div>
  );
}

function Frame11() {
  return (
    <div className="bg-[#f2e2d2] relative rounded-md shadow-[0px_4px_4px_0px_rgba(228,197,169,0.25)] shrink-0 w-full">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2.5 items-center justify-center px-1.5 py-1 relative w-full">
          <div
            className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] justify-center leading-[0] relative shrink-0 text-[#5b3a29] text-[12px] text-left text-nowrap"
            style={{ fontVariationSettings: "'wght' 400" }}
          >
            <p className="block leading-[normal] whitespace-pre">奈费勒救我！！</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame12() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[5px] items-end justify-start p-0 relative shrink-0 w-24">
      <div
        className="bg-center bg-contain bg-no-repeat h-5 shrink-0 w-[18px]"
        data-name="Delete"
        style={{ backgroundImage: `url('${imgDelete}')` }}
      />
      <Frame11 />
    </div>
  );
}

function Frame15() {
  return (
    <div className="absolute bg-[#f7e9dc] box-border content-stretch flex flex-row gap-[9px] items-center justify-start left-0 pl-[68px] pr-4 py-4 rounded-2xl top-3.5">
      <div
        aria-hidden="true"
        className="absolute border-2 border-[#000000] border-solid inset-0 pointer-events-none rounded-2xl"
      />
      <Frame14 />
      <Frame12 />
    </div>
  );
}

export default function Component() {
  return (
    <div className="relative size-full" data-name="任务卡片-金卡-恕己">
      <Frame15 />
      <div
        className="absolute bg-center bg-cover bg-no-repeat h-[95px] left-[13px] top-0.5 w-[43px]"
        data-name="2000373 1"
        style={{ backgroundImage: `url('${img20003731}')` }}
      />
    </div>
  );
}