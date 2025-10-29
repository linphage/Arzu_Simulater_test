import React from 'react';
import svgPaths from "../assets/svg/status-bar-icons";

function NetworkSignalLight() {
  return (
    <div className="h-3.5 relative shrink-0 w-5" data-name="Network Signal / Light">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 14">
        <g id="Network Signal /Â Light">
          <path clipRule="evenodd" d={svgPaths.p1f162900} fill="var(--fill-0, #D1D1D6)" fillRule="evenodd" id="Path" />
          <path
            clipRule="evenodd"
            d={svgPaths.p1d5dbe40}
            fill="var(--fill-0, #D1D1D6)"
            fillRule="evenodd"
            id="Path_2"
          />
          <path
            clipRule="evenodd"
            d={svgPaths.p18019e00}
            fill="var(--fill-0, #D1D1D6)"
            fillRule="evenodd"
            id="Path_3"
          />
          <path
            clipRule="evenodd"
            d={svgPaths.p342c3400}
            fill="var(--fill-0, #3C3C43)"
            fillOpacity="0.18"
            fillRule="evenodd"
            id="Empty Bar"
          />
          <path clipRule="evenodd" d={svgPaths.p1f162900} fill="var(--fill-0, black)" fillRule="evenodd" id="Path_4" />
          <path clipRule="evenodd" d={svgPaths.p1d5dbe40} fill="var(--fill-0, black)" fillRule="evenodd" id="Path_5" />
          <path clipRule="evenodd" d={svgPaths.p18019e00} fill="var(--fill-0, black)" fillRule="evenodd" id="Path_6" />
        </g>
      </svg>
    </div>
  );
}

function WiFiSignalLight() {
  return (
    <div className="h-3.5 relative shrink-0 w-4" data-name="WiFi Signal / Light">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 14">
        <g id="WiFi Signal / Light">
          <path d={svgPaths.p3dc48e00} fill="var(--fill-0, black)" id="Path" />
          <path d={svgPaths.p3b3c95f0} fill="var(--fill-0, black)" id="Path_2" />
          <path d={svgPaths.p932c700} fill="var(--fill-0, black)" id="Path_3" />
        </g>
      </svg>
    </div>
  );
}

function BatteryLight() {
  return (
    <div className="h-3.5 relative shrink-0 w-[25px]" data-name="Battery / Light">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 14">
        <g id="Battery / Light">
          <path d={svgPaths.p297bad10} fill="var(--fill-0, #3C3C43)" fillOpacity="0.6" id="Rectangle 23" />
          <path
            clipRule="evenodd"
            d={svgPaths.p2587880}
            fill="var(--fill-0, #3C3C43)"
            fillOpacity="0.6"
            fillRule="evenodd"
            id="Rectangle 21 (Stroke)"
          />
          <rect fill="var(--fill-0, black)" height="8" id="Rectangle 20" rx="1" width="19" x="2" y="3" />
        </g>
      </svg>
    </div>
  );
}

function StatusIcons() {
  return (
    <div
      className="absolute box-border content-stretch flex flex-row gap-1 items-center justify-start p-0 right-6 top-4"
      data-name="Status Icons"
    >
      <NetworkSignalLight />
      <WiFiSignalLight />
      <BatteryLight />
    </div>
  );
}

function Indicator() {
  return <div className="absolute right-[71px] size-1.5 top-2" data-name="Indicator" />;
}

function Component941() {
  return (
    <div
      className="absolute h-[15px] top-1/2 translate-x-[-50%] translate-y-[-50%] w-[33px]"
      data-name="9:41"
      style={{ left: "50%" }}
    >
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 33 15">
        <g id="9:41">
          <g id="9:41_2">
            <path d={svgPaths.p309cf100} fill="var(--fill-0, black)" />
            <path d={svgPaths.p1285b880} fill="var(--fill-0, black)" />
            <path d={svgPaths.pa9bea00} fill="var(--fill-0, black)" />
            <path d={svgPaths.p1d3f77f0} fill="var(--fill-0, black)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function TimeLight() {
  return (
    <div className="absolute h-[21px] left-1/2 transform -translate-x-1/2 overflow-clip rounded-[20px] top-3 w-[54px]" data-name="Time / Light">
      <Component941 />
    </div>
  );
}

function Notch() {
  return <div className="absolute h-[30px] left-0 right-0 top-0" data-name="Notch" />;
}

export function StatusBar() {
  return (
    <div 
      className="absolute h-11 overflow-clip top-0" 
      data-name="Status Bar"
      style={{
        left: '0',
        right: '0',
        width: '100%',
        paddingTop: 'env(safe-area-inset-top, 0px)' // 适配刘海屏
      }}
    >
      <Notch />
      <StatusIcons />
      <Indicator />
      <TimeLight />
    </div>
  );
}