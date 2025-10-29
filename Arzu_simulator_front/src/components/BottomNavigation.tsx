import React from 'react';
import svgPaths from "../imports/svg-j3e87w7dyb";
import imgCat1 from "figma:asset/68a0c8f5b6850549bba14a5a1c483c7346fd7698.png";
import imgUserArchiveSave1 from "figma:asset/730fe381f1fdb8bf18c5ba493f0cdcf6148ca5b9.png";
import imgRewardPoint1 from "figma:asset/437e088a73cd10772a092c9c8ff904116974176c.png";
import imgSettingIcon1 from "figma:asset/ce6182136432a7c1c42ec2faca29cc927c156c58.png";

function Svg10() {
  return (
    <div className="relative shrink-0 size-7" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="SVG">
          <path
            d={svgPaths.p1634a200}
            id="Vector"
            stroke="var(--stroke-0, white)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.33333"
          />
        </g>
      </svg>
    </div>
  );
}

function CentralAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#3a3f47] border-2 border-[#DDF0FF] box-border content-stretch flex flex-row items-center justify-center rounded-[28px] w-12 h-12 cursor-pointer hover:bg-[#4a4f57] transition-colors"
      data-name="Central Add Button"
    >
      <Svg10 />
    </button>
  );
}

function NavButton({ 
  icon, 
  text, 
  iconSize = "w-10 h-10", 
  iconOffset = "", 
  onClick 
}: { 
  icon: string; 
  text: string; 
  iconSize?: string; 
  iconOffset?: string; 
  onClick?: () => void; 
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-end cursor-pointer hover:opacity-80 transition-opacity"
      disabled={!onClick}
    >
      {/* Fixed height container for icons to ensure consistent text positioning */}
      <div className="flex items-center justify-center h-20 mb-1">
        <div
          className={`bg-center bg-cover bg-no-repeat ${iconSize} ${iconOffset}`}
          style={{ backgroundImage: `url('${icon}')` }}
        />
      </div>
      {/* Text positioned 18px above its normal position */}
      <div
        className="flex flex-col font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] justify-center leading-[0] relative shrink-0 text-[#ddf0ff] text-[12px] text-center -translate-y-[18px] z-10"
        style={{ fontVariationSettings: "'wght' 400" }}
      >
        <p className="block leading-[normal] whitespace-nowrap">{text}</p>
      </div>
    </button>
  );
}

export function FixedBottomNavigation({ 
  onAddClick, 
  onOfficeClick,
  onRoseGardenClick,
  onParliamentClick,
  onSettingsClick 
}: { 
  onAddClick: () => void; 
  onOfficeClick: () => void; 
  onRoseGardenClick?: () => void;
  onParliamentClick?: () => void;
  onSettingsClick?: () => void;
}) {
  return (
    <div 
      className="fixed bottom-[-10px] left-0 right-0 h-[111px] z-50" 
      data-name="底部控制栏"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)' // 适配安全区域
      }}
    >
      {/* Background */}
      <div 
        className="absolute bg-[#3a3f47] h-[77px] left-0 top-7 rounded-t-[28px]" 
        data-name="底部按钮空间"
        style={{
          width: '100%',
          minWidth: '100vw'
        }}
      />
      
      {/* Navigation buttons container */}
      <div className="absolute inset-0 flex items-center justify-center pt-7">
        <div className="flex items-end justify-center w-full px-6">
          {/* Left side buttons */}
          <div className="flex-1 flex justify-around">
            <NavButton 
              icon={imgUserArchiveSave1} 
              text="议会" 
              iconSize="w-10 h-10" 
              onClick={onParliamentClick}
            />
            <NavButton 
              icon={imgRewardPoint1} 
              text="办公室" 
              iconSize="w-10 h-10" 
              onClick={onOfficeClick}
            />
          </div>
          
          {/* Central add button */}
          <div className="mx-6 mb-6 -translate-y-[10px]">
            <CentralAddButton onClick={onAddClick} />
          </div>
          
          {/* Right side buttons */}
          <div className="flex-1 flex justify-around">
            <NavButton 
              icon={imgCat1} 
              text="玫瑰园" 
              iconSize="w-10 h-10" 
              onClick={onRoseGardenClick}
            />
            <NavButton 
              icon={imgSettingIcon1} 
              text="设置" 
              iconSize="w-10 h-10" 
              onClick={onSettingsClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}